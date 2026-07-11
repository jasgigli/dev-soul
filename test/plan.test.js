'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createPlan } = require('../src/plan');

test('createPlan returns prioritized fixes for an incomplete project', async () => {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'dev-soul-plan-'));
  await fs.writeFile(path.join(cwd, 'package.json'), JSON.stringify({
    name: 'sample',
    version: '1.0.0',
    license: 'MIT',
    scripts: {}
  }, null, 2));

  const plan = await createPlan(cwd);

  assert.ok(plan.items.length > 0);
  assert.equal(plan.items[0].priority, 'high');
});
