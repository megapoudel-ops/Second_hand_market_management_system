const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');

test('app exports an express application', () => {
  assert.equal(typeof app, 'function');
  assert.equal(typeof app.use, 'function');
});
