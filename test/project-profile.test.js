'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseNodeVersion } = require('../src/project-profile');

test('parseNodeVersion parses standard Node versions', () => {
  assert.deepEqual(parseNodeVersion('v20.11.1'), {
    version: 'v20.11.1',
    major: 20,
    minor: 11,
    patch: 1
  });
});
