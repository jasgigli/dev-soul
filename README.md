# dev-soul

`dev-soul` is a zero-dependency developer companion for Node.js projects. It gives every project the same health check, setup helper, project score, and CI quality gate.

## Install

```bash
npm install -D dev-soul
```

Run the full project check:

```bash
npx dev-soul doctor
```

## What it solves

Node projects often drift. One project has no lockfile, another has no README, another has no test command, another uses the wrong Node version, and every developer has to remember the rules manually.

`dev-soul` turns those rules into one shared command:

```bash
npm run doctor
```

It is useful for:

- new project setup
- onboarding developers
- pull request quality checks
- CI gates
- keeping many Node.js projects consistent

## Commands

```bash
dev-soul doctor             # validate project health
dev-soul doctor --strict    # fail on warnings too
dev-soul doctor --json      # machine-readable report
dev-soul score              # print a 0-100 project health score
dev-soul setup              # create safe project defaults
dev-soul setup --dry-run    # preview setup changes
dev-soul fix                # alias for setup
dev-soul ci                 # create .github/workflows/dev-soul.yml
dev-soul info               # print detected project/runtime details
dev-soul init               # create dev-soul.config.json only
dev-soul config             # print merged config
```

## Fast start

In any Node.js project:

```bash
npm install -D dev-soul
npx dev-soul setup
npx dev-soul ci
npm run doctor
```

`setup` safely creates missing defaults only. It will not overwrite existing files.

It can add:

- `.gitignore`
- `.editorconfig`
- `.env.example`
- `.nvmrc`
- `README.md`
- `dev-soul.config.json`
- npm scripts for `doctor`, `doctor:strict`, and `doctor:json`

## Health checks

`dev-soul doctor` checks:

- required files exist
- recommended files exist
- Node.js version is acceptable
- `package.json` exists
- important package fields exist
- required npm scripts exist
- recommended npm scripts exist
- package manager lockfile exists
- `.gitignore` ignores `node_modules`
- GitHub Actions workflow exists

Example:

```text
dev-soul doctor

  PASS required file: package.json
  PASS required file: .gitignore
  PASS required file: README.md
  WARN recommended file: .env.example
      Create .env.example when this project needs shared examples or editor conventions.

Summary: 12/15 passed, 3 warnings, 0 failures
Score: 80/100
```

## CI

Create a GitHub Actions quality gate:

```bash
npx dev-soul ci
```

Then CI runs:

```bash
npx dev-soul doctor
```

Normal CI mode fails on real failures. Use `dev-soul doctor --strict` when your team wants warnings to fail too.

## Configuration

Create a config file:

```bash
npx dev-soul init
```

Default config:

```json
{
  "requiredFiles": ["package.json", ".gitignore", "README.md"],
  "recommendedFiles": [".editorconfig", ".env.example"],
  "requiredPackageScripts": ["test"],
  "recommendedPackageScripts": ["lint", "build"],
  "requiredPackageFields": ["name", "version", "license"],
  "node": {
    "minimumMajor": 18,
    "writeVersionFile": true
  },
  "packageManager": {
    "allowMissingLockfile": false
  },
  "ci": {
    "workflow": true
  }
}
```

## Recommended package scripts

```json
{
  "scripts": {
    "doctor": "dev-soul doctor",
    "doctor:strict": "dev-soul doctor --strict",
    "doctor:json": "dev-soul doctor --json"
  }
}
```

## Publish

Before publishing a new version:

```bash
npm test
npm run prepare:local
npm publish --access public
```
