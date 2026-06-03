const test = require('node:test');
const assert = require('node:assert/strict');

function loadNotificationService(mocks) {
  const modulePaths = [
    '../src/services/notification.service',
    '../src/models/notification.model',
    '../src/models/preference.model',
    '../src/models/template.model',
    '../src/models/user.model',
    '../src/services/email.service',
    '../src/services/sms.service',
    '../src/services/push.service'
  ];

  for (const modulePath of modulePaths) {
    delete require.cache[require.resolve(modulePath)];
  }

  for (const [modulePath, exports] of Object.entries(mocks)) {
    const filename = require.resolve(modulePath);
    require.cache[filename] = {
      id: filename,
      filename,
      loaded: true,
      exports
    };
  }

  return require('../src/services/notification.service');
}

function createNotificationDocument(payload) {
  return {
    ...payload,
    channels: payload.channels || [],
    metadata: payload.metadata || new Map(),
    status: payload.status || 'pending',
    async save() {
      this.saved = true;
      return this;
    }
  };
}

test('createAndDispatch renders active templates and sends enabled channels', async () => {
  const calls = {
    createdPayload: null,
    push: null
  };
  const recipient = {
    _id: '507f1f77bcf86cd799439011',
    email: 'buyer@example.com',
    phone: '+9779800000000',
    pushTokens: ['push-token']
  };

  const service = loadNotificationService({
    '../src/models/notification.model': {
      async create(payload) {
        calls.createdPayload = payload;
        return createNotificationDocument({
          ...payload,
          metadata: new Map(Object.entries(payload.metadata))
        });
      },
      async find() {
        return [];
      }
    },
    '../src/models/preference.model': {
      async findOne() {
        return {
          mutedTypes: [],
          channels: {
            in_app: true,
            email: false,
            sms: false,
            push: true
          }
        };
      }
    },
    '../src/models/template.model': {
      async findOne(query) {
        assert.deepEqual(query, { key: 'listing_message', isActive: true });
        return {
          title: 'New message from {{buyer.name}}',
          message: '{{buyer.name}} asked about {{listing.title}}.',
          type: 'message',
          defaultChannels: ['in_app', 'email', 'push']
        };
      }
    },
    '../src/models/user.model': {
      async findById() {
        return recipient;
      }
    },
    '../src/services/email.service': {
      async sendEmail() {
        throw new Error('email should be disabled by preferences');
      }
    },
    '../src/services/sms.service': {
      async sendSms() {
        throw new Error('sms should not be requested');
      }
    },
    '../src/services/push.service': {
      async sendPush(payload) {
        calls.push = payload;
      }
    }
  });

  const notification = await service.createAndDispatch({
    recipient: recipient._id,
    templateKey: 'listing_message',
    variables: {
      buyer: { name: 'Asha' },
      listing: { title: 'Used laptop' }
    },
    metadata: {
      listingId: 'listing-1'
    }
  });

  assert.equal(calls.createdPayload.title, 'New message from Asha');
  assert.equal(calls.createdPayload.message, 'Asha asked about Used laptop.');
  assert.deepEqual(notification.channels, ['in_app', 'push']);
  assert.equal(notification.status, 'sent');
  assert.ok(notification.sentAt instanceof Date);
  assert.deepEqual(calls.push, {
    tokens: ['push-token'],
    title: 'New message from Asha',
    message: 'Asha asked about Used laptop.',
    data: {
      listingId: 'listing-1'
    }
  });
});

test('createAndDispatch leaves future scheduled notifications pending', async () => {
  let pushWasCalled = false;
  const scheduledFor = new Date(Date.now() + 60_000);

  const service = loadNotificationService({
    '../src/models/notification.model': {
      async create(payload) {
        return createNotificationDocument(payload);
      },
      async find() {
        return [];
      }
    },
    '../src/models/preference.model': {
      async findOne() {
        return null;
      }
    },
    '../src/models/template.model': {
      async findOne() {
        return null;
      }
    },
    '../src/models/user.model': {
      async findById() {
        return { _id: '507f1f77bcf86cd799439012', pushTokens: ['token'] };
      }
    },
    '../src/services/email.service': {
      async sendEmail() {}
    },
    '../src/services/sms.service': {
      async sendSms() {}
    },
    '../src/services/push.service': {
      async sendPush() {
        pushWasCalled = true;
      }
    }
  });

  const notification = await service.createAndDispatch({
    recipient: '507f1f77bcf86cd799439012',
    title: 'Scheduled',
    message: 'Send later',
    channels: ['push'],
    scheduledFor
  });

  assert.equal(notification.status, 'pending');
  assert.equal(notification.scheduledFor, scheduledFor);
  assert.equal(pushWasCalled, false);
});

test('createAndDispatch rejects missing recipients before creating notifications', async () => {
  let created = false;

  const service = loadNotificationService({
    '../src/models/notification.model': {
      async create() {
        created = true;
      },
      async find() {
        return [];
      }
    },
    '../src/models/preference.model': {
      async findOne() {
        return null;
      }
    },
    '../src/models/template.model': {
      async findOne() {
        return null;
      }
    },
    '../src/models/user.model': {
      async findById() {
        return null;
      }
    },
    '../src/services/email.service': {
      async sendEmail() {}
    },
    '../src/services/sms.service': {
      async sendSms() {}
    },
    '../src/services/push.service': {
      async sendPush() {}
    }
  });

  await assert.rejects(
    service.createAndDispatch({
      recipient: '507f1f77bcf86cd799439013',
      title: 'Hello',
      message: 'World'
    }),
    {
      statusCode: 404,
      message: 'Notification recipient not found'
    }
  );
  assert.equal(created, false);
});

test('dispatchDueNotifications sends each pending scheduled notification', async () => {
  const due = [
    createNotificationDocument({
      recipient: '507f1f77bcf86cd799439014',
      title: 'Due',
      message: 'Now',
      channels: ['push'],
      metadata: new Map()
    })
  ];
  let findQuery = null;
  let pushCount = 0;

  const service = loadNotificationService({
    '../src/models/notification.model': {
      async create(payload) {
        return createNotificationDocument(payload);
      },
      async find(query) {
        findQuery = query;
        return due;
      }
    },
    '../src/models/preference.model': {
      async findOne() {
        return null;
      }
    },
    '../src/models/template.model': {
      async findOne() {
        return null;
      }
    },
    '../src/models/user.model': {
      async findById(id) {
        return { _id: id, pushTokens: ['token'] };
      }
    },
    '../src/services/email.service': {
      async sendEmail() {}
    },
    '../src/services/sms.service': {
      async sendSms() {}
    },
    '../src/services/push.service': {
      async sendPush() {
        pushCount += 1;
      }
    }
  });

  const now = new Date();
  const results = await service.dispatchDueNotifications(now);

  assert.deepEqual(findQuery, {
    status: 'pending',
    scheduledFor: { $lte: now }
  });
  assert.equal(results.length, 1);
  assert.equal(results[0].status, 'sent');
  assert.equal(pushCount, 1);
});
