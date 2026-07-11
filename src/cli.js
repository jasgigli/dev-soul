'use strict';

const path = require('node:path');
const { collectProjectProfile } = require('./project-profile');
const { createConfig, loadConfig } = require('./config');
const { runDoctor } = require('./doctor');
const { collectInsights } = require('./insights');
const { createCiWorkflow, setupProject } = require('./setup');
const { formatDoctorReport, formatInsights, formatProjectProfile, formatSetupResult } = require('./format');

async function run(argv, options = {}) {
  const cwd = options.cwd || process.cwd();
  const parsed = parseArgs(argv);
  const command = parsed.command || inferCommandFromFlags(parsed.flags);

  switch (command) {
    case 'doctor': {
      const report = await runDoctor(cwd, { strict: parsed.flags.strict });
      print(parsed, report, () => formatDoctorReport(report, colorOptions(parsed)));
      process.exitCode = report.ok ? 0 : 1;
      return report;
    }

    case 'score': {
      const report = await runDoctor(cwd, { strict: parsed.flags.strict });
      print(parsed, report.summary, () => `dev-soul score\n\n  ${report.summary.score}/100`);
      process.exitCode = report.ok ? 0 : 1;
      return report.summary;
    }

    case 'insights':
    case 'overview': {
      const insights = await collectInsights(cwd);
      print(parsed, insights, () => formatInsights(insights, colorOptions(parsed)));
      return insights;
    }

    case 'scripts': {
      const insights = await collectInsights(cwd);
      const value = insights.scripts;
      print(parsed, value, () => formatScriptList(value));
      return value;
    }

    case 'deps':
    case 'dependencies': {
      const insights = await collectInsights(cwd);
      const value = insights.dependencies;
      print(parsed, value, () => formatDependencySummary(value));
      return value;
    }

    case 'info':
    case 'env': {
      const profile = await collectProjectProfile(cwd);
      print(parsed, profile, () => formatProjectProfile(profile, colorOptions(parsed)));
      return profile;
    }

    case 'setup':
    case 'fix': {
      const result = await setupProject(cwd, { dryRun: parsed.flags['dry-run'] });
      print(parsed, result, () => formatSetupResult(result, colorOptions(parsed)));
      return result;
    }

    case 'ci': {
      const result = await createCiWorkflow(cwd, { dryRun: parsed.flags['dry-run'] });
      print(parsed, result, () => formatSetupResult(result, colorOptions(parsed)));
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
      const [name, value] = arg.slice(2).split('=');
      flags[name] = value || true;
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

function colorOptions(parsed) {
  return {
    color: parsed.flags.color ? true : parsed.flags['no-color'] ? false : undefined
  };
}

function formatScriptList(scripts) {
  if (scripts.length === 0) {
    return 'dev-soul scripts\n\n  No scripts found.';
  }

  return [
    'dev-soul scripts',
    '',
    ...scripts.map((script) => `  ${script.name}: ${script.command}`)
  ].join('\n');
}

function formatDependencySummary(dependencies) {
  return [
    'dev-soul deps',
    '',
    `  production: ${dependencies.production}`,
    `  development: ${dependencies.development}`,
    `  duplicates: ${dependencies.duplicates.length ? dependencies.duplicates.join(', ') : 'none'}`
  ].join('\n');
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
    '  dev-soul doctor --no-color            Disable colored output',
    '  dev-soul score [--json]               Print the project health score',
    '  dev-soul insights [--json]            Print project scripts, dependencies, and package facts',
    '  dev-soul scripts [--json]             List package scripts',
    '  dev-soul deps [--json]                Summarize dependencies',
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
