'use strict';

const { collectProjectProfile } = require('./project-profile');

async function collectInsights(cwd) {
  const profile = await collectProjectProfile(cwd);
  const packageJson = profile.packageJson.data || {};
  const scripts = packageJson.scripts || {};
  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};
  const duplicateDependencies = Object.keys(dependencies).filter((name) => devDependencies[name]);

  return {
    cwd,
    package: {
      name: packageJson.name || null,
      version: packageJson.version || null,
      private: Boolean(packageJson.private),
      type: packageJson.type || 'commonjs',
      license: packageJson.license || null
    },
    scripts: Object.keys(scripts).sort().map((name) => ({ name, command: scripts[name] })),
    dependencies: {
      production: Object.keys(dependencies).length,
      development: Object.keys(devDependencies).length,
      duplicates: duplicateDependencies
    },
    packageManager: profile.packageManager,
    files: profile.files
  };
}

module.exports = {
  collectInsights
};
