'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

async function collectProjectProfile(cwd) {
  const [packageJson, packageManager, git, files] = await Promise.all([
    readPackageJson(cwd),
    detectPackageManager(cwd),
    detectGit(cwd),
    detectCommonFiles(cwd)
  ]);

  return {
    cwd,
    node: parseNodeVersion(process.version),
    packageJson,
    packageManager,
    git,
    files
  };
}

async function readPackageJson(cwd) {
  const packagePath = path.join(cwd, 'package.json');

  try {
    const data = JSON.parse(await fs.readFile(packagePath, 'utf8'));
    return {
      exists: true,
      path: packagePath,
      name: data.name,
      version: data.version,
      data
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { exists: false, path: packagePath };
    }

    if (error instanceof SyntaxError) {
      throw new Error('package.json contains invalid JSON.');
    }

    throw error;
  }
}

async function detectPackageManager(cwd) {
  const lockfiles = [
    ['pnpm', 'pnpm-lock.yaml'],
    ['npm', 'package-lock.json'],
    ['yarn', 'yarn.lock'],
    ['bun', 'bun.lockb']
  ];
  const found = [];

  for (const [name, lockfile] of lockfiles) {
    if (await exists(path.join(cwd, lockfile))) {
      found.push({ name, lockfile });
    }
  }

  return {
    name: found[0] ? found[0].name : null,
    lockfile: found[0] ? found[0].lockfile : null,
    lockfiles: found
  };
}

async function detectGit(cwd) {
  return {
    exists: await exists(path.join(cwd, '.git'))
  };
}

async function detectCommonFiles(cwd) {
  const names = [
    'README.md',
    '.gitignore',
    '.editorconfig',
    '.env.example',
    '.env',
    '.nvmrc',
    'node_modules',
    'dev-soul.config.json',
    '.github/workflows/dev-soul.yml'
  ];
  const entries = await Promise.all(names.map(async (name) => [name, await exists(path.join(cwd, name))]));
  return Object.fromEntries(entries);
}

function parseNodeVersion(version) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!match) {
    return { version, major: 0, minor: 0, patch: 0 };
  }

  return {
    version,
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3])
  };
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  collectProjectProfile,
  detectPackageManager,
  parseNodeVersion
};
