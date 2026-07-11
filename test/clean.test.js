'use strict';

const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { cleanProject, inspectClean } = require('../src/clean');

test('cleanProject previews and applies generated cleanup targets', async () => {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'dev-soul-clean-'));
  await fs.mkdir(path.join(cwd, 'coverage'));

  const plan = await inspectClean(cwd);
  assert.equal(plan.count, 1);
  assert.equal(plan.entries[0].target, 'coverage');

  await cleanProject(cwd, { apply: true });
  await assert.rejects(fs.stat(path.join(cwd, 'coverage')), { code: 'ENOENT' });
});
