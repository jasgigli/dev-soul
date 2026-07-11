'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseEnvKeys } = require('../src/env');

test('parseEnvKeys extracts valid env keys without values', () => {
  const keys = parseEnvKeys([
    '# comment',
    'DATABASE_URL=postgres://example',
    ' API_KEY = secret ',
    'invalid-key=value',
    ''
  ].join('\n'));

  assert.deepEqual([...keys].sort(), ['API_KEY', 'DATABASE_URL']);
});
