'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { formatDoctorSummary } = require('../src/format');

test('formatDoctorSummary prints compact health status', () => {
  const output = formatDoctorSummary({
    ok: true,
    summary: {
      score: 100,
      passed: 3,
      total: 3,
      warned: 0,
      failed: 0
    }
  }, { plain: true, color: false });

  assert.match(output, /dev-soul summary/);
  assert.match(output, /score: 100\/100/);
  assert.match(output, /next: npx dev-soul ready/);
});
