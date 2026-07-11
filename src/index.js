'use strict';

const { collectProjectProfile } = require('./project-profile');
const { collectInsights } = require('./insights');
const { runDoctor } = require('./doctor');
const { createConfig } = require('./config');
const { createCiWorkflow, setupProject } = require('./setup');

module.exports = {
  collectInsights,
  collectProjectProfile,
  createConfig,
  createCiWorkflow,
  setupProject,
  runDoctor
};
