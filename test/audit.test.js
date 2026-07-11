'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { auditPackage } = require('../src/audit');

test('auditPackage flags missing package entry points', async () => {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'dev-soul-audit-'));
  await fs.writeFile(path.join(cwd, 'package.json'), JSON.stringify({
    name: 'sample',
    version: '1.0.0',
    license: 'MIT'
  }, null, 2));

  const audit = await auditPackage(cwd);

  assert.ok(audit.findings.some((finding) => finding.name === 'package entry points' && finding.status === 'failed'));
});
