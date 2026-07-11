'use strict';

const { collectProjectProfile } = require('./project-profile');

async function auditPackage(cwd) {
  const profile = await collectProjectProfile(cwd);
  const packageJson = profile.packageJson.data || {};
  const findings = [];

  requireField(packageJson, 'name', findings);
  requireField(packageJson, 'version', findings);
  requireField(packageJson, 'description', findings, 'warning');
  requireField(packageJson, 'license', findings);
  requireField(packageJson, 'main', findings, 'warning');

  if (!packageJson.private && !packageJson.repository) {
    findings.push(warn('package repository', 'Add repository metadata so users can find the source code.'));
  }

  if (!packageJson.private && !packageJson.keywords) {
    findings.push(warn('package keywords', 'Add keywords so npm search can understand the package.'));
  }

  if (packageJson.files && Array.isArray(packageJson.files) && packageJson.files.length > 0) {
    findings.push(pass('package files allowlist'));
  } else {
    findings.push(warn('package files allowlist', 'Add a files array to avoid publishing accidental files.'));
  }

  if (packageJson.bin || packageJson.main) {
    findings.push(pass('package entry points'));
  } else {
    findings.push(fail('package entry points', 'Add main or bin so consumers can use the package.'));
  }

  return {
    cwd,
    package: {
      name: packageJson.name || null,
      version: packageJson.version || null,
      private: Boolean(packageJson.private)
    },
    findings,
    summary: summarize(findings)
  };
}

function requireField(packageJson, field, findings, severity = 'error') {
  if (packageJson[field]) {
    findings.push(pass(`package ${field}`));
    return;
  }

  const message = `Add "${field}" to package.json.`;
  findings.push(severity === 'error' ? fail(`package ${field}`, message) : warn(`package ${field}`, message));
}

function summarize(findings) {
  return findings.reduce((summary, finding) => {
    summary.total += 1;
    summary[finding.status] += 1;
    return summary;
  }, { total: 0, passed: 0, warned: 0, failed: 0 });
}

function pass(name) {
  return { name, status: 'passed' };
}

function warn(name, advice) {
  return { name, status: 'warned', advice };
}

function fail(name, advice) {
  return { name, status: 'failed', advice };
}

module.exports = {
  auditPackage
};
