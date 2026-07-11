'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { mergeConfig } = require('../src/config');

test('mergeConfig preserves nested defaults', () => {
  const merged = mergeConfig({
    requiredFiles: ['package.json'],
    node: { minimumMajor: 18 },
    packageManager: { allowMissingLockfile: false }
  }, {
    node: { minimumMajor: 20 }
  });

  assert.equal(merged.node.minimumMajor, 20);
  assert.equal(merged.packageManager.allowMissingLockfile, false);
  assert.deepEqual(merged.requiredFiles, ['package.json']);
});
