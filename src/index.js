'use strict';

const { collectProjectProfile } = require('./project-profile');
const { auditPackage } = require('./audit');
const { createBadges } = require('./badges');
const { collectInsights } = require('./insights');
const { cleanProject, inspectClean } = require('./clean');
const { inspectEnv } = require('./env');
const { createReport, formatMarkdownReport, writeMarkdownReport } = require('./report');
const { createPlan } = require('./plan');
const { runDoctor } = require('./doctor');
const { createConfig } = require('./config');
const { createCiWorkflow, setupProject } = require('./setup');

module.exports = {
  auditPackage,
  collectInsights,
  collectProjectProfile,
  cleanProject,
  createBadges,
  createConfig,
  createCiWorkflow,
  createPlan,
  createReport,
  formatMarkdownReport,
  inspectClean,
  inspectEnv,
  setupProject,
  writeMarkdownReport,
  runDoctor
};
