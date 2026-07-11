#!/usr/bin/env node
'use strict';

const { run } = require('../src/cli');

run(process.argv.slice(2)).catch((error) => {
  console.error(error && error.message ? error.message : error);
  process.exitCode = 1;
});
