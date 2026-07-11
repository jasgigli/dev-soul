'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseArgs } = require('../src/cli');

test('parseArgs separates command and flags', () => {
  const parsed = parseArgs(['doctor', '--json', '--strict']);

  assert.equal(parsed.command, 'doctor');
  assert.equal(parsed.flags.json, true);
  assert.equal(parsed.flags.strict, true);
});
