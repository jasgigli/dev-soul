'use strict';

const { runDoctor } = require('./doctor');

async function createPlan(cwd, options = {}) {
  const report = await runDoctor(cwd, { strict: options.strict });
  const items = report.checks
    .filter((check) => check.status !== 'passed')
    .map((check) => ({
      priority: priorityFor(check),
      status: check.status,
      title: check.name,
      advice: check.advice || 'Review this project convention.',
      command: suggestCommand(check)
    }))
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));

  return {
    cwd,
    score: report.summary.score,
    ok: report.ok,
    items,
    next: items[0] || null
  };
}

function suggestCommand(check) {
  const name = check.name;

  if (name.includes('ci workflow')) {
    return 'npx dev-soul ci';
  }

  if (name.includes('required file') || name.includes('recommended file') || name.includes('package field')) {
    return 'npx dev-soul setup';
  }

  if (name.includes('environment') || name.includes('.env')) {
    return 'npx dev-soul env';
  }

  if (name.includes('package script')) {
    return 'npm pkg set scripts.<name>="<command>"';
  }

  if (name.includes('lockfile')) {
    return 'npm install --package-lock-only';
  }

  return null;
}

function priorityFor(check) {
  if (check.status === 'failed' || check.name.includes('required file') || check.name.includes('package script: test')) {
    return 'high';
  }

  return 'medium';
}

function priorityRank(priority) {
  return { high: 0, medium: 1, low: 2 }[priority] ?? 3;
}

module.exports = {
  createPlan
};
