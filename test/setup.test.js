'use strict';

const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { setupProject } = require('../src/setup');

test('setupProject creates safe defaults without overwriting existing package', async () => {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'dev-soul-'));
  await fs.writeFile(path.join(cwd, 'package.json'), JSON.stringify({
    name: 'sample',
    version: '1.0.0',
    license: 'MIT',
    scripts: { test: 'node --test' }
  }, null, 2));

  const result = await setupProject(cwd);
  const packageJson = JSON.parse(await fs.readFile(path.join(cwd, 'package.json'), 'utf8'));

  assert.ok(result.actions.some((action) => action.target === '.gitignore'));
  assert.equal(packageJson.description, 'A Node.js project.');
  assert.equal(packageJson.engines.node, '>=18.18.0');
  assert.equal(packageJson.scripts.doctor, 'dev-soul doctor');
  assert.equal(packageJson.scripts.score, 'dev-soul score');
  assert.equal(packageJson.scripts.ready, 'dev-soul ready');
  assert.equal(packageJson.scripts.plan, 'dev-soul plan');
  assert.equal(packageJson.scripts.insights, 'dev-soul insights');
  assert.equal(packageJson.scripts.env, 'dev-soul env');
  assert.equal(packageJson.scripts['audit:package'], 'dev-soul audit');
  assert.equal(await fs.readFile(path.join(cwd, '.gitignore'), 'utf8'), 'node_modules/\n.env\n.DS_Store\n');
});
