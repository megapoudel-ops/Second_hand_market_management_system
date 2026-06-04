const test = require('node:test');
const assert = require('node:assert/strict');
const {
  bulkNotificationSchema,
  notificationSchema
} = require('../src/validators/notification.validator');

test('notification validation leaves channels unset for template defaults', () => {
  const { error, value } = notificationSchema.validate({
    recipient: '507f1f77bcf86cd799439011',
    templateKey: 'listing_message',
    variables: {
      buyerName: 'Asha'
    }
  });

  assert.equal(error, undefined);
  assert.equal(value.channels, undefined);
});

test('notification validation defaults channels for direct notifications', () => {
  const { error, value } = notificationSchema.validate({
    recipient: '507f1f77bcf86cd799439011',
    title: 'Hello',
    message: 'World'
  });

  assert.equal(error, undefined);
  assert.deepEqual(value.channels, ['in_app']);
});

test('bulk notification validation leaves channels unset for template defaults', () => {
  const { error, value } = bulkNotificationSchema.validate({
    recipients: ['507f1f77bcf86cd799439011'],
    templateKey: 'listing_message'
  });

  assert.equal(error, undefined);
  assert.equal(value.channels, undefined);
});
