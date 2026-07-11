'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { CONFIG_FILE, createConfig } = require('./config');

async function setupProject(cwd, options = {}) {
  const actions = [];

  await createFileIfMissing(cwd, '.gitignore', 'node_modules/\n.env\n.DS_Store\n', actions, options);
  await createFileIfMissing(cwd, '.editorconfig', editorConfig(), actions, options);
  await createFileIfMissing(cwd, '.env.example', '# Add required environment variables here.\n', actions, options);
  await createFileIfMissing(cwd, '.nvmrc', `${process.versions.node.split('.')[0]}\n`, actions, options);
  await createReadmeIfMissing(cwd, actions, options);
  await createConfigIfMissing(cwd, actions, options);
  await ensurePackageScripts(cwd, actions, options);

  return { cwd, dryRun: Boolean(options.dryRun), actions };
}

async function createCiWorkflow(cwd, options = {}) {
  const actions = [];
  const packageManager = await detectPackageManager(cwd);
  await createFileIfMissing(cwd, '.github/workflows/dev-soul.yml', workflow(packageManager), actions, options);
  return { cwd, dryRun: Boolean(options.dryRun), actions };
}

async function createReadmeIfMissing(cwd, actions, options) {
  const packageJson = await readPackageJson(cwd);
  const name = packageJson.name || path.basename(cwd);
  await createFileIfMissing(cwd, 'README.md', `# ${name}\n\nProject notes, setup steps, and developer commands belong here.\n`, actions, options);
}

async function createConfigIfMissing(cwd, actions, options) {
  if (await exists(path.join(cwd, CONFIG_FILE))) {
    return;
  }

  if (!options.dryRun) {
    await createConfig(cwd);
  }

  actions.push({ type: options.dryRun ? 'would create' : 'created', target: CONFIG_FILE });
}

async function ensurePackageScripts(cwd, actions, options) {
  const packagePath = path.join(cwd, 'package.json');

  if (!await exists(packagePath)) {
    return;
  }

  const packageJson = await readPackageJson(cwd);
  packageJson.scripts = packageJson.scripts || {};

  const wanted = {
    doctor: 'dev-soul doctor',
    'doctor:strict': 'dev-soul doctor --strict',
    'doctor:json': 'dev-soul doctor --json'
  };

  let changed = false;
  for (const [name, command] of Object.entries(wanted)) {
    if (!packageJson.scripts[name]) {
      packageJson.scripts[name] = command;
      actions.push({ type: options.dryRun ? 'would update' : 'updated', target: `package.json scripts.${name}` });
      changed = true;
    }
  }

  if (changed && !options.dryRun) {
    await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  }
}

async function createFileIfMissing(cwd, relativePath, contents, actions, options) {
  const filePath = path.join(cwd, relativePath);
  if (await exists(filePath)) {
    return;
  }

  if (!options.dryRun) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, contents, { flag: 'wx' });
  }

  actions.push({ type: options.dryRun ? 'would create' : 'created', target: relativePath });
}

async function readPackageJson(cwd) {
  try {
    return JSON.parse(await fs.readFile(path.join(cwd, 'package.json'), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {};
    }

    if (error instanceof SyntaxError) {
      throw new Error('package.json contains invalid JSON.');
    }

    throw error;
  }
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function detectPackageManager(cwd) {
  const lockfiles = [
    ['pnpm', 'pnpm-lock.yaml'],
    ['yarn', 'yarn.lock'],
    ['bun', 'bun.lockb'],
    ['npm', 'package-lock.json']
  ];

  for (const [name, lockfile] of lockfiles) {
    if (await exists(path.join(cwd, lockfile))) {
      return name;
    }
  }

  return 'npm';
}

function editorConfig() {
  return [
    'root = true',
    '',
    '[*]',
    'charset = utf-8',
    'end_of_line = lf',
    'insert_final_newline = true',
    'indent_style = space',
    'indent_size = 2',
    'trim_trailing_whitespace = true',
    ''
  ].join('\n');
}

function workflow(packageManager) {
  const setup = {
    npm: [],
    pnpm: ['      - run: corepack enable'],
    yarn: ['      - run: corepack enable'],
    bun: ['      - uses: oven-sh/setup-bun@v2']
  }[packageManager] || [];

  const install = {
    npm: 'npm ci',
    pnpm: 'pnpm install --frozen-lockfile',
    yarn: 'yarn install --immutable',
    bun: 'bun install --frozen-lockfile'
  }[packageManager] || 'npm ci';

  return [
    'name: dev-soul',
    '',
    'on:',
    '  pull_request:',
    '  push:',
    '    branches: [main, master]',
    '',
    'jobs:',
    '  doctor:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    '      - uses: actions/checkout@v4',
    '      - uses: actions/setup-node@v4',
    '        with:',
    '          node-version-file: .nvmrc',
    ...(packageManager === 'bun' ? [] : [`          cache: ${packageManager}`]),
    ...setup,
    `      - run: ${install}`,
    '      - run: npx dev-soul doctor',
    ''
  ].join('\n');
}

module.exports = {
  createCiWorkflow,
  setupProject
};
