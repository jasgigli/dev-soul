'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseArgs, uiOptions } = require('../src/cli');

test('parseArgs separates command and flags', () => {
  const parsed = parseArgs(['doctor', '--json', '--strict']);

  assert.equal(parsed.command, 'doctor');
  assert.equal(parsed.flags.json, true);
  assert.equal(parsed.flags.strict, true);
});

test('parseArgs supports flag values', () => {
  const parsed = parseArgs(['doctor', '--format=json']);

  assert.equal(parsed.flags.format, 'json');
});

test('uiOptions disables animation for plain mode', () => {
  const parsed = parseArgs(['doctor', '--plain']);
  const options = uiOptions(parsed);

  assert.equal(options.animate, false);
  assert.equal(options.plain, true);
});
