const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getPort } = require('../src/config/serverConfig');

test('uses the default port when no value is configured', () => {
  assert.equal(getPort(undefined), 3000);
});

test('accepts valid ports', () => {
  assert.equal(getPort('3001'), 3001);
  assert.equal(getPort('65535'), 65535);
});

test('rejects invalid ports', () => {
  for (const value of ['', 'abc', '3000.5', '0', '65536']) {
    assert.throws(() => getPort(value), /PORT deve ser um inteiro/);
  }
});
