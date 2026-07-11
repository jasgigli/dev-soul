'use strict';

const { collectProjectProfile } = require('./project-profile');
const { runDoctor } = require('./doctor');
const { createConfig } = require('./config');
const { createCiWorkflow, setupProject } = require('./setup');

module.exports = {
  collectProjectProfile,
  createConfig,
  createCiWorkflow,
  setupProject,
  runDoctor
};
