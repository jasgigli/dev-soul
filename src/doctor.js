'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { loadConfig } = require('./config');
const { inspectEnv } = require('./env');
const { collectProjectProfile } = require('./project-profile');

async function runDoctor(cwd, options = {}) {
  const [config, profile, env] = await Promise.all([
    loadConfig(cwd),
    collectProjectProfile(cwd),
    inspectEnv(cwd)
  ]);

  const checks = await Promise.all([
    ...await checkRequiredFiles(cwd, config.requiredFiles || []),
    ...await checkRecommendedFiles(cwd, config.recommendedFiles || []),
    checkNodeVersion(profile.node, config.node.minimumMajor),
    checkPackageJson(profile.packageJson),
    ...checkPackageFields(profile.packageJson, config.requiredPackageFields || []),
    ...checkPackageFields(profile.packageJson, config.recommendedPackageFields || [], 'recommended'),
    ...checkScripts(profile.packageJson, config.requiredPackageScripts || []),
    ...checkRecommendedScripts(profile.packageJson, config.recommendedPackageScripts || []),
    checkUsefulTestScript(profile.packageJson),
    checkPackageManager(profile, config.packageManager.allowMissingLockfile),
    checkSingleLockfile(profile),
    ...await checkForbiddenFiles(cwd, config.forbiddenFiles || []),
    checkEnvExample(env),
    checkGitIgnoreCoversNodeModules(cwd),
    checkEnginesNode(profile.packageJson),
    checkDuplicateDependencies(profile.packageJson),
    checkWorkflow(profile, config.ci && config.ci.workflow)
  ]);

  const summary = summarize(checks, options.strict);

  return {
    cwd,
    config,
    profile,
    env,
    checks,
    summary,
    ok: summary.failed === 0 && (!options.strict || summary.warned === 0)
  };
}

async function checkRequiredFiles(cwd, files) {
  return Promise.all(files.map(async (file) => {
    try {
      await fs.access(path.join(cwd, file));
      return pass(`required file: ${file}`);
    } catch {
      return fail(`required file: ${file}`, `Create ${file} or remove it from dev-soul.config.json.`);
    }
  }));
}

async function checkRecommendedFiles(cwd, files) {
  return Promise.all(files.map(async (file) => {
    try {
      await fs.access(path.join(cwd, file));
      return pass(`recommended file: ${file}`);
    } catch {
      return warn(`recommended file: ${file}`, `Create ${file} when this project needs shared examples or editor conventions.`);
    }
  }));
}

function checkNodeVersion(node, minimumMajor) {
  if (node.major >= minimumMajor) {
    return pass(`node version >= ${minimumMajor}`);
  }

  return fail(
    `node version >= ${minimumMajor}`,
    `Current Node is ${node.version}. Upgrade Node or lower node.minimumMajor in config.`
  );
}

function checkPackageJson(packageJson) {
  if (packageJson.exists) {
    return pass('package.json exists');
  }

  return fail('package.json exists', 'Run npm init or move to a Node project root.');
}

function checkPackageFields(packageJson, fields, level = 'required') {
  if (!packageJson.exists) {
    return fields.map((field) => fail(`package field: ${field}`, 'package.json is missing.'));
  }

  return fields.map((field) => {
    if (readPackageField(packageJson.data, field)) {
      return pass(`package field: ${field}`);
    }

    const advice = `Add "${field}" to package.json.`;
    return level === 'required' ? warn(`package field: ${field}`, advice) : warn(`recommended package field: ${field}`, advice);
  });
}

function checkScripts(packageJson, requiredScripts) {
  if (!packageJson.exists) {
    return requiredScripts.map((script) => fail(`package script: ${script}`, 'package.json is missing.'));
  }

  const scripts = packageJson.data.scripts || {};
  return requiredScripts.map((script) => {
    if (scripts[script]) {
      return pass(`package script: ${script}`);
    }

    return fail(`package script: ${script}`, `Add a "${script}" script to package.json.`);
  });
}

function checkRecommendedScripts(packageJson, recommendedScripts) {
  if (!packageJson.exists) {
    return recommendedScripts.map((script) => warn(`package script: ${script}`, 'package.json is missing.'));
  }

  const scripts = packageJson.data.scripts || {};
  return recommendedScripts.map((script) => {
    if (scripts[script]) {
      return pass(`package script: ${script}`);
    }

    return warn(`package script: ${script}`, `Add a "${script}" script if this project supports it.`);
  });
}

function checkPackageManager(profile, allowMissingLockfile) {
  if (allowMissingLockfile || profile.packageManager.lockfile) {
    return pass('package manager lockfile');
  }

  return fail('package manager lockfile', 'Commit package-lock.json, pnpm-lock.yaml, yarn.lock, or bun.lockb.');
}

function checkSingleLockfile(profile) {
  const lockfiles = profile.packageManager.lockfiles || [];
  if (lockfiles.length <= 1) {
    return pass('single package manager lockfile');
  }

  return warn(
    'single package manager lockfile',
    `Multiple lockfiles found: ${lockfiles.map((item) => item.lockfile).join(', ')}. Keep one package manager per project.`
  );
}

async function checkForbiddenFiles(cwd, files) {
  const gitignore = await readGitIgnore(cwd);
  return Promise.all(files.map(async (file) => {
    try {
      await fs.access(path.join(cwd, file));
      if (gitignore.includes(file) || gitignore.includes(`${file}\n`)) {
        return pass(`secret file protected: ${file}`);
      }

      return fail(`secret file protected: ${file}`, `Add ${file} to .gitignore or remove it from the project root.`);
    } catch {
      return pass(`secret file absent: ${file}`);
    }
  }));
}

function checkEnvExample(env) {
  if (!env.example.exists) {
    return warn('environment example', 'Create .env.example so developers know which variables are required.');
  }

  if (env.example.keys.length === 0) {
    return pass('environment example');
  }

  if (!env.local.exists) {
    return warn('local environment file', 'Create a local .env when this project needs environment variables.');
  }

  if (env.missing.length > 0) {
    return warn('local environment matches example', `Missing local keys: ${env.missing.join(', ')}.`);
  }

  return pass('local environment matches example');
}

async function checkGitIgnoreCoversNodeModules(cwd) {
  try {
    const raw = await readGitIgnore(cwd);
    if (/^node_modules\/?$/m.test(raw)) {
      return pass('.gitignore ignores node_modules');
    }

    return warn('.gitignore ignores node_modules', 'Add node_modules/ to .gitignore.');
  } catch {
    return warn('.gitignore ignores node_modules', 'Create .gitignore with node_modules/.');
  }
}

async function readGitIgnore(cwd) {
  try {
    return await fs.readFile(path.join(cwd, '.gitignore'), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return '';
    }

    throw error;
  }
}

function checkWorkflow(profile, enabled) {
  if (!enabled || profile.files['.github/workflows/dev-soul.yml']) {
    return pass('ci workflow configured');
  }

  return warn('ci workflow configured', 'Run "dev-soul ci" to create a GitHub Actions quality gate.');
}

function checkUsefulTestScript(packageJson) {
  if (!packageJson.exists) {
    return warn('test script is useful', 'package.json is missing.');
  }

  const testScript = packageJson.data.scripts && packageJson.data.scripts.test;
  if (!testScript) {
    return fail('test script is useful', 'Add a real test script.');
  }

  if (/no test specified|exit 1/i.test(testScript)) {
    return warn('test script is useful', 'Replace the default npm test placeholder with a real test command.');
  }

  return pass('test script is useful');
}

function checkEnginesNode(packageJson) {
  if (!packageJson.exists) {
    return warn('package engines.node', 'package.json is missing.');
  }

  if (packageJson.data.engines && packageJson.data.engines.node) {
    return pass('package engines.node');
  }

  return warn('package engines.node', 'Add engines.node so developers and CI use compatible Node versions.');
}

function checkDuplicateDependencies(packageJson) {
  if (!packageJson.exists) {
    return warn('no duplicate dependencies', 'package.json is missing.');
  }

  const dependencies = packageJson.data.dependencies || {};
  const devDependencies = packageJson.data.devDependencies || {};
  const duplicates = Object.keys(dependencies).filter((name) => devDependencies[name]);

  if (duplicates.length === 0) {
    return pass('no duplicate dependencies');
  }

  return warn('no duplicate dependencies', `Move duplicate entries to one dependency section: ${duplicates.join(', ')}.`);
}

function readPackageField(data, field) {
  return field.split('.').reduce((value, key) => value && value[key], data);
}

function summarize(checks, strict = false) {
  const summary = checks.reduce((result, check) => {
    result.total += 1;
    result[check.status] += 1;
    result.points += check.status === 'passed' ? check.weight : 0;
    result.maxPoints += check.weight;
    return result;
  }, { total: 0, passed: 0, warned: 0, failed: 0, points: 0, maxPoints: 0, score: 0, strict });

  summary.score = summary.maxPoints === 0 ? 100 : Math.round((summary.points / summary.maxPoints) * 100);
  return summary;
}

function pass(name, weight = 1) {
  return { name, status: 'passed', weight };
}

function warn(name, advice, weight = 1) {
  return { name, status: 'warned', advice, weight };
}

function fail(name, advice, weight = 1) {
  return { name, status: 'failed', advice, weight };
}

module.exports = {
  runDoctor,
  summarize
};
