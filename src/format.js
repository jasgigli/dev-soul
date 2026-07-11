'use strict';

const { createColors } = require('./colors');

function formatDoctorReport(report, options = {}) {
  const color = createColors(options.color);
  const lines = [
    title('dev-soul doctor', color, options),
    '',
    ...report.checks.map((check) => {
      const marker = formatMarker(check.status, color, options);
      const advice = check.advice ? `\n      ${color.gray(check.advice)}` : '';
      return `  ${marker} ${check.name}${advice}`;
    }),
    '',
    `Summary: ${color.green(report.summary.passed)}/${report.summary.total} passed, ${color.yellow(report.summary.warned)} warnings, ${color.red(report.summary.failed)} failures`,
    `Score: ${formatScore(report.summary.score, color)}`
  ];

  return lines.join('\n');
}

function formatDoctorSummary(report, options = {}) {
  const color = createColors(options.color);
  const status = report.ok ? statusWord('passed', 'OK', color, options) : statusWord('failed', 'NEEDS WORK', color, options);

  return [
    title('dev-soul summary', color, options),
    '',
    `  status: ${status}`,
    `  score: ${formatScore(report.summary.score, color)}`,
    `  passed: ${report.summary.passed}/${report.summary.total}`,
    `  warnings: ${color.yellow(report.summary.warned)}`,
    `  failures: ${color.red(report.summary.failed)}`,
    '',
    report.ok ? '  next: npx dev-soul ready' : '  next: npx dev-soul plan'
  ].join('\n');
}

function formatProjectProfile(profile, options = {}) {
  const color = createColors(options.color);
  return [
    title('dev-soul project info', color, options),
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
    return `${title('dev-soul setup', color, options)}\n\n  ${statusWord('passed', 'Nothing to change.', color, options)} Project already has the managed defaults.`;
  }

  return [
    title('dev-soul setup', color, options),
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
    title('dev-soul insights', color, options),
    '',
    `  package: ${insights.package.name || '(none)'}`,
    `  version: ${insights.package.version || '(none)'}`,
    `  license: ${insights.package.license || '(none)'}`,
    `  package manager: ${insights.packageManager.name || '(unknown)'}`,
    `  dependencies: ${insights.dependencies.production} prod, ${insights.dependencies.development} dev`,
    `  duplicate deps: ${insights.dependencies.duplicates.length ? color.yellow(insights.dependencies.duplicates.join(', ')) : color.green('none')}`,
    '',
    title('scripts', color, options),
    ...scripts
  ].join('\n');
}

function formatEnvReport(env, options = {}) {
  const color = createColors(options.color);
  return [
    title('dev-soul env', color, options),
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
    return `${title(heading, color, options)}\n\n  ${statusWord('passed', 'Nothing to clean.', color, options)}`;
  }

  return [
    title(heading, color, options),
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
    title('dev-soul ready', color, options),
    '',
    `  status: ${status}`,
    `  score: ${formatScore(result.doctor.summary.score, color)}`,
    `  failures: ${color.red(result.doctor.summary.failed)}`,
    `  warnings: ${color.yellow(result.doctor.summary.warned)}`,
    `  env missing keys: ${result.env.missing.length ? color.yellow(result.env.missing.join(', ')) : color.green('none')}`
  ].join('\n');
}

function formatPlan(plan, options = {}) {
  const color = createColors(options.color);
  if (plan.items.length === 0) {
    return [
      title('dev-soul plan', color, options),
      '',
      `${statusWord('passed', 'No action needed.', color, options)} Score: ${formatScore(plan.score, color)}`
    ].join('\n');
  }

  return [
    title('dev-soul plan', color, options),
    '',
    `Score: ${formatScore(plan.score, color)}`,
    '',
    ...plan.items.map((item, index) => {
      const priority = item.priority === 'high' ? color.red('HIGH') : color.yellow('MEDIUM');
      const command = item.command ? `\n      try: ${color.cyan(item.command)}` : '';
      return `  ${index + 1}. ${priority} ${item.title}\n      ${color.gray(item.advice)}${command}`;
    })
  ].join('\n');
}

function formatAudit(audit, options = {}) {
  const color = createColors(options.color);
  return [
    title('dev-soul audit', color, options),
    '',
    `  package: ${audit.package.name || '(none)'}`,
    `  version: ${audit.package.version || '(none)'}`,
    '',
    ...audit.findings.map((finding) => {
      const marker = formatMarker(finding.status, color, options);
      const advice = finding.advice ? `\n      ${color.gray(finding.advice)}` : '';
      return `  ${marker} ${finding.name}${advice}`;
    }),
    '',
    `Summary: ${color.green(audit.summary.passed)}/${audit.summary.total} passed, ${color.yellow(audit.summary.warned)} warnings, ${color.red(audit.summary.failed)} failures`
  ].join('\n');
}

function formatBadges(badges, options = {}) {
  const color = createColors(options.color);
  return [
    title('dev-soul badges', color, options),
    '',
    ...badges.markdown.map((badge) => `  ${badge}`)
  ].join('\n');
}

function formatMarker(status, color, options = {}) {
  if (options.plain) {
    if (status === 'passed') {
      return 'PASS';
    }

    if (status === 'warned') {
      return 'WARN';
    }

    return 'FAIL';
  }

  if (status === 'passed') {
    return color.green('✓ PASS');
  }

  if (status === 'warned') {
    return color.yellow('! WARN');
  }

  return color.red('✕ FAIL');
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

function title(value, color, options = {}) {
  if (options.plain) {
    return value;
  }

  return color.bold(`◆ ${value}`);
}

function statusWord(status, value, color, options = {}) {
  if (options.plain) {
    return value;
  }

  if (status === 'passed') {
    return color.green(`✓ ${value}`);
  }

  if (status === 'warned') {
    return color.yellow(`! ${value}`);
  }

  return color.red(`✕ ${value}`);
}

module.exports = {
  formatAudit,
  formatBadges,
  formatCleanResult,
  formatDoctorReport,
  formatDoctorSummary,
  formatEnvReport,
  formatInsights,
  formatPlan,
  formatProjectProfile,
  formatReadyReport,
  formatSetupResult
};
