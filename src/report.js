'use strict';

const { runDoctor } = require('./doctor');
const { inspectEnv } = require('./env');
const { collectInsights } = require('./insights');

async function createReport(cwd) {
  const [doctor, env, insights] = await Promise.all([
    runDoctor(cwd),
    inspectEnv(cwd),
    collectInsights(cwd)
  ]);

  return {
    cwd,
    createdAt: new Date().toISOString(),
    doctor,
    env,
    insights
  };
}

function formatMarkdownReport(report) {
  return [
    '# dev-soul Report',
    '',
    `Generated: ${report.createdAt}`,
    `Project: ${report.insights.package.name || report.cwd}`,
    '',
    '## Health',
    '',
    `Score: ${report.doctor.summary.score}/100`,
    `Passed: ${report.doctor.summary.passed}/${report.doctor.summary.total}`,
    `Warnings: ${report.doctor.summary.warned}`,
    `Failures: ${report.doctor.summary.failed}`,
    '',
    '## Checks',
    '',
    ...report.doctor.checks.map((check) => `- ${check.status.toUpperCase()}: ${check.name}${check.advice ? ` - ${check.advice}` : ''}`),
    '',
    '## Environment',
    '',
    `Example file: ${report.env.example.exists ? 'yes' : 'no'}`,
    `Local file: ${report.env.local.exists ? 'yes' : 'no'}`,
    `Missing keys: ${report.env.missing.length ? report.env.missing.join(', ') : 'none'}`,
    '',
    '## Dependencies',
    '',
    `Production: ${report.insights.dependencies.production}`,
    `Development: ${report.insights.dependencies.development}`,
    `Duplicates: ${report.insights.dependencies.duplicates.length ? report.insights.dependencies.duplicates.join(', ') : 'none'}`,
    ''
  ].join('\n');
}

module.exports = {
  createReport,
  formatMarkdownReport
};
