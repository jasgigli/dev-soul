'use strict';

const { createColors } = require('./colors');

function formatDoctorReport(report, options = {}) {
  const color = createColors(options.color);
  const lines = [
    color.bold('dev-soul doctor'),
    '',
    ...report.checks.map((check) => {
      const marker = formatMarker(check.status, color);
      const advice = check.advice ? `\n      ${color.gray(check.advice)}` : '';
      return `  ${marker} ${check.name}${advice}`;
    }),
    '',
    `Summary: ${color.green(report.summary.passed)}/${report.summary.total} passed, ${color.yellow(report.summary.warned)} warnings, ${color.red(report.summary.failed)} failures`,
    `Score: ${formatScore(report.summary.score, color)}`
  ];

  return lines.join('\n');
}

function formatProjectProfile(profile, options = {}) {
  const color = createColors(options.color);
  return [
    color.bold('dev-soul project info'),
    '',
    `  cwd: ${profile.cwd}`,
    `  node: ${profile.node.version}`,
    `  package: ${profile.packageJson.name || '(none)'}`,
    `  package manager: ${profile.packageManager.name || '(unknown)'}`,
    `  lockfile: ${profile.packageManager.lockfile || '(missing)'}`,
    `  git repository: ${profile.git.exists ? 'yes' : 'no'}`
  ].join('\n');
}

function formatSetupResult(result, options = {}) {
  const color = createColors(options.color);
  if (result.actions.length === 0) {
    return `${color.bold('dev-soul setup')}\n\n  ${color.green('Nothing to change.')} Project already has the managed defaults.`;
  }

  return [
    color.bold('dev-soul setup'),
    '',
    ...result.actions.map((action) => `  ${color.cyan(action.type.toUpperCase())} ${action.target}`)
  ].join('\n');
}

function formatInsights(insights, options = {}) {
  const color = createColors(options.color);
  const scripts = insights.scripts.length === 0
    ? ['  (no scripts)']
    : insights.scripts.map((script) => `  ${color.cyan(script.name)}: ${script.command}`);

  return [
    color.bold('dev-soul insights'),
    '',
    `  package: ${insights.package.name || '(none)'}`,
    `  version: ${insights.package.version || '(none)'}`,
    `  license: ${insights.package.license || '(none)'}`,
    `  package manager: ${insights.packageManager.name || '(unknown)'}`,
    `  dependencies: ${insights.dependencies.production} prod, ${insights.dependencies.development} dev`,
    `  duplicate deps: ${insights.dependencies.duplicates.length ? color.yellow(insights.dependencies.duplicates.join(', ')) : color.green('none')}`,
    '',
    color.bold('scripts'),
    ...scripts
  ].join('\n');
}

function formatEnvReport(env, options = {}) {
  const color = createColors(options.color);
  return [
    color.bold('dev-soul env'),
    '',
    `  .env.example: ${env.example.exists ? color.green('found') : color.yellow('missing')}`,
    `  .env: ${env.local.exists ? color.green('found') : color.yellow('missing')}`,
    `  required keys: ${env.example.keys.length}`,
    `  local keys: ${env.local.keys.length}`,
    `  missing keys: ${env.missing.length ? color.yellow(env.missing.join(', ')) : color.green('none')}`,
    `  extra local keys: ${env.extra.length ? env.extra.join(', ') : 'none'}`
  ].join('\n');
}

function formatCleanResult(result, options = {}) {
  const color = createColors(options.color);
  const heading = result.applied ? 'dev-soul clean' : 'dev-soul clean plan';

  if (result.entries.length === 0) {
    return `${color.bold(heading)}\n\n  ${color.green('Nothing to clean.')}`;
  }

  return [
    color.bold(heading),
    '',
    ...result.entries.map((entry) => `  ${result.applied ? color.red('REMOVED') : color.yellow('WOULD REMOVE')} ${entry.target} (${entry.type})`),
    '',
    result.applied ? color.green(`Removed ${result.entries.length} item(s).`) : 'Run "dev-soul clean --apply" to remove these items.'
  ].join('\n');
}

function formatReadyReport(result, options = {}) {
  const color = createColors(options.color);
  const status = result.ready ? color.green('READY') : color.red('NOT READY');

  return [
    color.bold('dev-soul ready'),
    '',
    `  status: ${status}`,
    `  score: ${formatScore(result.doctor.summary.score, color)}`,
    `  failures: ${color.red(result.doctor.summary.failed)}`,
    `  warnings: ${color.yellow(result.doctor.summary.warned)}`,
    `  env missing keys: ${result.env.missing.length ? color.yellow(result.env.missing.join(', ')) : color.green('none')}`
  ].join('\n');
}

function formatMarker(status, color) {
  if (status === 'passed') {
    return color.green('PASS');
  }

  if (status === 'warned') {
    return color.yellow('WARN');
  }

  return color.red('FAIL');
}

function formatScore(score, color) {
  const value = `${score}/100`;
  if (score >= 90) {
    return color.green(value);
  }

  if (score >= 70) {
    return color.yellow(value);
  }

  return color.red(value);
}

module.exports = {
  formatCleanResult,
  formatDoctorReport,
  formatEnvReport,
  formatInsights,
  formatProjectProfile,
  formatReadyReport,
  formatSetupResult
};
