const test = require('node:test');
const assert = require('node:assert/strict');
const { authenticate, authorize } = require('../src/middleware/auth.middleware');

function runMiddleware(middleware, req = {}) {
  return new Promise((resolve, reject) => {
    const res = {};
    const next = (error) => {
      if (error) {
        resolve(error);
        return;
      }

      resolve(null);
    };

    Promise.resolve(middleware(req, res, next)).catch(reject);
  });
}

test('authenticate rejects malformed bearer tokens with 401', async () => {
  const error = await runMiddleware(authenticate, {
    headers: {
      authorization: 'Bearer invalid-token'
    }
  });

  assert.equal(error.statusCode, 401);
  assert.equal(error.message, 'Invalid authentication token');
});

test('authorize rejects requests without an authenticated user with 401', async () => {
  const error = await runMiddleware(authorize('admin'), {});

  assert.equal(error.statusCode, 401);
  assert.equal(error.message, 'Authentication is required');
});
