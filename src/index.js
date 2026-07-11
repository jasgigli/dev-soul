'use strict';

const { collectProjectProfile } = require('./project-profile');
const { collectInsights } = require('./insights');
const { cleanProject, inspectClean } = require('./clean');
const { inspectEnv } = require('./env');
const { createReport, formatMarkdownReport } = require('./report');
const { runDoctor } = require('./doctor');
const { createConfig } = require('./config');
const { createCiWorkflow, setupProject } = require('./setup');

module.exports = {
  collectInsights,
  collectProjectProfile,
  cleanProject,
  createConfig,
  createCiWorkflow,
  createReport,
  formatMarkdownReport,
  inspectClean,
  inspectEnv,
  setupProject,
  runDoctor
};
