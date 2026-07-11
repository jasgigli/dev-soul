'use strict';

const { createColors } = require('./colors');

const frames = ['[=     ]', '[==    ]', '[===   ]', '[ ==== ]', '[  ===]', '[   ==]', '[    =]'];

async function withProgress(label, work, options = {}) {
  if (!shouldAnimate(options)) {
    return work();
  }

  const color = createColors(options.color);
  let index = 0;
  process.stdout.write(`${color.cyan(frames[index])} ${label}`);

  const timer = setInterval(() => {
    index = (index + 1) % frames.length;
    process.stdout.write(`\r${color.cyan(frames[index])} ${label}`);
  }, 80);

  try {
    const result = await work();
    clearInterval(timer);
    process.stdout.write(`\r${color.green('[done ]')} ${label}\n`);
    return result;
  } catch (error) {
    clearInterval(timer);
    process.stdout.write(`\r${color.red('[fail ]')} ${label}\n`);
    throw error;
  }
}

function shouldAnimate(options = {}) {
  if (options.json || options.plain || options.animate === false || process.env.CI) {
    return false;
  }

  if (options.animate === true || process.env.DEV_SOUL_ANIMATE === '1') {
    return true;
  }

  return Boolean(process.stdout && process.stdout.isTTY);
}

module.exports = {
  shouldAnimate,
  withProgress
};
