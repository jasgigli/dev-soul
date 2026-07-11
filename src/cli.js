'use strict';

const path = require('node:path');
const { collectProjectProfile } = require('./project-profile');
const { createConfig, loadConfig } = require('./config');
const { runDoctor } = require('./doctor');
const { createCiWorkflow, setupProject } = require('./setup');
const { formatDoctorReport, formatProjectProfile, formatSetupResult } = require('./format');

async function run(argv, options = {}) {
  const cwd = options.cwd || process.cwd();
  const parsed = parseArgs(argv);
  const command = parsed.command || inferCommandFromFlags(parsed.flags);

  switch (command) {
    case 'doctor': {
      const report = await runDoctor(cwd, { strict: parsed.flags.strict });
      print(parsed, report, () => formatDoctorReport(report));
      process.exitCode = report.ok ? 0 : 1;
      return report;
    }

    case 'score': {
      const report = await runDoctor(cwd, { strict: parsed.flags.strict });
      print(parsed, report.summary, () => `dev-soul score\n\n  ${report.summary.score}/100`);
      process.exitCode = report.ok ? 0 : 1;
      return report.summary;
    }

    case 'info':
    case 'env': {
      const profile = await collectProjectProfile(cwd);
      print(parsed, profile, () => formatProjectProfile(profile));
      return profile;
    }

    case 'setup':
    case 'fix': {
      const result = await setupProject(cwd, { dryRun: parsed.flags['dry-run'] });
      print(parsed, result, () => formatSetupResult(result));
      return result;
    }

    case 'ci': {
      const result = await createCiWorkflow(cwd, { dryRun: parsed.flags['dry-run'] });
      print(parsed, result, () => formatSetupResult(result));
      return result;
    }

    case 'init': {
      const configPath = await createConfig(cwd);
      const result = { path: configPath, relativePath: path.relative(cwd, configPath) };
      print(parsed, result, () => `Created ${result.relativePath}`);
      return configPath;
    }

    case 'config': {
      const config = await loadConfig(cwd);
      console.log(JSON.stringify(config, null, 2));
      return config;
    }

    case 'help':
    case '--help':
    case '-h':
      console.log(helpText());
      return null;

    case '--version':
    case '-v':
      console.log(require('../package.json').version);
      return null;

    default:
      throw new Error(`Unknown command "${command}". Run "dev-soul help" for usage.`);
  }
}

function parseArgs(argv) {
  const flags = {};
  const positionals = [];

  for (const arg of argv) {
    if (arg.startsWith('--')) {
      flags[arg.slice(2)] = true;
    } else {
      positionals.push(arg);
    }
  }

  return {
    command: positionals[0],
    args: positionals.slice(1),
    flags
  };
}

function print(parsed, value, textFactory) {
  if (parsed.flags.json) {
    console.log(JSON.stringify(value, null, 2));
    return;
  }

  console.log(textFactory());
}

function inferCommandFromFlags(flags) {
  if (flags.version || flags.v) {
    return '--version';
  }

  if (flags.help || flags.h) {
    return 'help';
  }

  return 'help';
}

function helpText() {
  return [
    'dev-soul - a portable developer environment companion',
    '',
    'Usage:',
    '  dev-soul doctor [--strict] [--json]   Check whether the current Node project is healthy',
    '  dev-soul score [--json]               Print the project health score',
    '  dev-soul setup [--dry-run]            Create safe project defaults and npm scripts',
    '  dev-soul fix [--dry-run]              Alias for setup',
    '  dev-soul ci [--dry-run]               Create a GitHub Actions quality gate',
    '  dev-soul info [--json]                Print detected project and runtime details',
    '  dev-soul init                         Create a dev-soul.config.json file',
    '  dev-soul config                       Print merged config',
    '  dev-soul --version                    Print version',
    '',
    'Install:',
    '  npm install -D dev-soul',
    '  npx dev-soul setup',
    '  npx dev-soul doctor'
  ].join('\n');
}

module.exports = {
  helpText,
  inferCommandFromFlags,
  parseArgs,
  run
};
