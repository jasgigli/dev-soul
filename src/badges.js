'use strict';

const { runDoctor } = require('./doctor');

async function createBadges(cwd) {
  const report = await runDoctor(cwd);
  const score = report.summary.score;
  const color = score >= 90 ? 'brightgreen' : score >= 70 ? 'yellow' : 'red';

  return {
    score,
    markdown: [
      `![dev-soul score](https://img.shields.io/badge/dev--soul-${score}%2F100-${color})`,
      '![node](https://img.shields.io/badge/node-%3E%3D18.18.0-brightgreen)'
    ]
  };
}

module.exports = {
  createBadges
};
