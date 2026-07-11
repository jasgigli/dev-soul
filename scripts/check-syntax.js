'use strict';

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const roots = ['bin', 'src', 'test', 'scripts'];

for (const root of roots) {
  for (const file of walk(path.join(process.cwd(), root))) {
    if (file.endsWith('.js')) {
      execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
    }
  }
}

function walk(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}
