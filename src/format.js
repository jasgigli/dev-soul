'use strict';

function formatDoctorReport(report) {
  const lines = [
    'dev-soul doctor',
    '',
    ...report.checks.map((check) => {
      const marker = check.status === 'passed' ? 'PASS' : check.status === 'warned' ? 'WARN' : 'FAIL';
      const advice = check.advice ? `\n      ${check.advice}` : '';
      return `  ${marker} ${check.name}${advice}`;
    }),
    '',
    `Summary: ${report.summary.passed}/${report.summary.total} passed, ${report.summary.warned} warnings, ${report.summary.failed} failures`,
    `Score: ${report.summary.score}/100`
  ];

  return lines.join('\n');
}

function formatProjectProfile(profile) {
  return [
    'dev-soul project info',
    '',
    `  cwd: ${profile.cwd}`,
    `  node: ${profile.node.version}`,
    `  package: ${profile.packageJson.name || '(none)'}`,
    `  package manager: ${profile.packageManager.name || '(unknown)'}`,
    `  lockfile: ${profile.packageManager.lockfile || '(missing)'}`,
    `  git repository: ${profile.git.exists ? 'yes' : 'no'}`
  ].join('\n');
}

function formatSetupResult(result) {
  if (result.actions.length === 0) {
    return 'dev-soul setup\n\n  Nothing to change. Project already has the managed defaults.';
  }

  return [
    'dev-soul setup',
    '',
    ...result.actions.map((action) => `  ${action.type.toUpperCase()} ${action.target}`)
  ].join('\n');
}

module.exports = {
  formatDoctorReport,
  formatProjectProfile,
  formatSetupResult
};
