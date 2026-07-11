'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const CONFIG_FILE = 'dev-soul.config.json';

const defaultConfig = Object.freeze({
  requiredFiles: ['package.json', '.gitignore', 'README.md'],
  recommendedFiles: ['.editorconfig', '.env.example'],
  requiredPackageScripts: ['test'],
  recommendedPackageScripts: ['lint', 'build'],
  requiredPackageFields: ['name', 'version', 'license'],
  recommendedPackageFields: ['description'],
  forbiddenFiles: ['.env'],
  node: {
    minimumMajor: 18,
    writeVersionFile: true
  },
  packageManager: {
    allowMissingLockfile: false
  },
  ci: {
    workflow: true
  },
  score: {
    minimum: 80
  }
});

async function createConfig(cwd) {
  const configPath = path.join(cwd, CONFIG_FILE);
  await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2) + '\n', { flag: 'wx' });
  return configPath;
}

async function loadConfig(cwd) {
  const configPath = path.join(cwd, CONFIG_FILE);

  try {
    const raw = await fs.readFile(configPath, 'utf8');
    return mergeConfig(defaultConfig, JSON.parse(raw));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { ...defaultConfig, source: 'defaults' };
    }

    if (error instanceof SyntaxError) {
      throw new Error(`${CONFIG_FILE} contains invalid JSON.`);
    }

    throw error;
  }
}

function mergeConfig(base, override) {
  return {
    ...base,
    ...override,
    node: {
      ...base.node,
      ...(override.node || {})
    },
    packageManager: {
      ...base.packageManager,
      ...(override.packageManager || {})
    },
    ci: {
      ...base.ci,
      ...(override.ci || {})
    },
    score: {
      ...base.score,
      ...(override.score || {})
    },
    source: CONFIG_FILE
  };
}

module.exports = {
  CONFIG_FILE,
  createConfig,
  defaultConfig,
  loadConfig,
  mergeConfig
};
