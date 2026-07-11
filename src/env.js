'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

async function inspectEnv(cwd) {
  const examplePath = path.join(cwd, '.env.example');
  const localPath = path.join(cwd, '.env');
  const [example, local] = await Promise.all([
    readEnvFile(examplePath),
    readEnvFile(localPath)
  ]);

  const exampleKeys = [...example.keys].sort();
  const localKeys = [...local.keys].sort();
  const missing = exampleKeys.filter((key) => !local.keys.has(key));
  const extra = localKeys.filter((key) => !example.keys.has(key));

  return {
    cwd,
    example: {
      exists: example.exists,
      path: examplePath,
      keys: exampleKeys
    },
    local: {
      exists: local.exists,
      path: localPath,
      keys: localKeys
    },
    missing,
    extra,
    ok: !example.exists || !local.exists || missing.length === 0
  };
}

async function readEnvFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return {
      exists: true,
      keys: parseEnvKeys(raw)
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { exists: false, keys: new Set() };
    }

    throw error;
  }
}

function parseEnvKeys(raw) {
  const keys = new Set();

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue;
    }

    const key = trimmed.slice(0, trimmed.indexOf('=')).trim();
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      keys.add(key);
    }
  }

  return keys;
}

module.exports = {
  inspectEnv,
  parseEnvKeys
};
