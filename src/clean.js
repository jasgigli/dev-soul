'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const DEFAULT_TARGETS = [
  'coverage',
  'dist',
  'build',
  '.turbo',
  '.next',
  '.vite',
  '.parcel-cache',
  'npm-debug.log'
];

async function inspectClean(cwd, options = {}) {
  const includeNodeModules = Boolean(options.nodeModules);
  const targets = includeNodeModules ? ['node_modules', ...DEFAULT_TARGETS] : DEFAULT_TARGETS;
  const entries = [];

  for (const target of targets) {
    const absolutePath = path.resolve(cwd, target);
    if (!isInside(cwd, absolutePath) && absolutePath !== path.resolve(cwd)) {
      continue;
    }

    try {
      const stat = await fs.stat(absolutePath);
      entries.push({
        target,
        path: absolutePath,
        type: stat.isDirectory() ? 'directory' : 'file'
      });
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  return {
    cwd,
    entries,
    count: entries.length
  };
}

async function cleanProject(cwd, options = {}) {
  const plan = await inspectClean(cwd, options);
  const apply = Boolean(options.apply);

  if (apply) {
    for (const entry of plan.entries) {
      await fs.rm(entry.path, { recursive: true, force: true });
    }
  }

  return {
    ...plan,
    applied: apply
  };
}

function isInside(cwd, target) {
  const relative = path.relative(path.resolve(cwd), target);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

module.exports = {
  cleanProject,
  inspectClean
};
