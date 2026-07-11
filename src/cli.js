'use strict';

const path = require('node:path');
const { collectProjectProfile } = require('./project-profile');
const { cleanProject } = require('./clean');
const { createConfig, loadConfig } = require('./config');
const { runDoctor } = require('./doctor');
const { inspectEnv } = require('./env');
const { collectInsights } = require('./insights');
const { createReport, formatMarkdownReport } = require('./report');
const { createCiWorkflow, setupProject } = require('./setup');
const {
  formatCleanResult,
  formatDoctorReport,
  formatEnvReport,
  formatInsights,
  formatProjectProfile,
  formatReadyReport,
  formatSetupResult
} = require('./format');

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

    case 'ready': {
      const [doctor, env] = await Promise.all([
        runDoctor(cwd, { strict: parsed.flags.strict }),
        inspectEnv(cwd)
      ]);
      const result = {
        ready: doctor.ok && env.ok,
        doctor,
        env
      };
      print(parsed, result, () => formatReadyReport(result, colorOptions(parsed)));
      process.exitCode = result.ready ? 0 : 1;
      return result;
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

    case 'env': {
      const env = await inspectEnv(cwd);
      print(parsed, env, () => formatEnvReport(env, colorOptions(parsed)));
      process.exitCode = env.ok ? 0 : 1;
      return env;
    }

    case 'clean': {
      const result = await cleanProject(cwd, {
        apply: parsed.flags.apply,
        nodeModules: parsed.flags['node-modules']
      });
      print(parsed, result, () => formatCleanResult(result, colorOptions(parsed)));
      return result;
    }

    case 'report': {
      const report = await createReport(cwd);
      if (parsed.flags.markdown || parsed.flags.md) {
        console.log(formatMarkdownReport(report));
      } else {
        print(parsed, report, () => formatMarkdownReport(report));
      }
      return report;
    }

    case 'info':
    case 'runtime': {
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
    '  dev-soul ready [--json]               Check if the project is ready to work on',
    '  dev-soul insights [--json]            Print project scripts, dependencies, and package facts',
    '  dev-soul scripts [--json]             List package scripts',
    '  dev-soul deps [--json]                Summarize dependencies',
    '  dev-soul env [--json]                 Compare .env.example with local .env',
    '  dev-soul clean [--apply]              Preview or remove generated caches/build output',
    '  dev-soul clean --node-modules         Include node_modules in the clean plan',
    '  dev-soul report --markdown            Print a markdown project report',
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
