'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { summarize } = require('../src/doctor');

test('summarize calculates score with warnings and failures', () => {
  const summary = summarize([
    { status: 'passed', weight: 1 },
    { status: 'warned', weight: 1 },
    { status: 'failed', weight: 2 }
  ]);

  assert.equal(summary.total, 3);
  assert.equal(summary.passed, 1);
  assert.equal(summary.warned, 1);
  assert.equal(summary.failed, 1);
  assert.equal(summary.score, 25);
});
