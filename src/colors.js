'use strict';

const codes = {
  reset: '\u001b[0m',
  bold: '\u001b[1m',
  dim: '\u001b[2m',
  red: '\u001b[31m',
  green: '\u001b[32m',
  yellow: '\u001b[33m',
  cyan: '\u001b[36m',
  gray: '\u001b[90m'
};

function createColors(enabled = shouldUseColor()) {
  const paint = (name, value) => enabled ? `${codes[name]}${value}${codes.reset}` : String(value);

  return {
    enabled,
    bold: (value) => paint('bold', value),
    dim: (value) => paint('dim', value),
    red: (value) => paint('red', value),
    green: (value) => paint('green', value),
    yellow: (value) => paint('yellow', value),
    cyan: (value) => paint('cyan', value),
    gray: (value) => paint('gray', value)
  };
}

function shouldUseColor() {
  if (process.env.NO_COLOR || process.env.FORCE_COLOR === '0') {
    return false;
  }

  if (process.env.FORCE_COLOR) {
    return true;
  }

  return Boolean(process.stdout && process.stdout.isTTY);
}

module.exports = {
  createColors,
  shouldUseColor
};
