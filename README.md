# dev-soul

`dev-soul` is a zero-dependency developer companion for Node.js projects. It gives every project the same colorful health check, prioritized fix plan, setup helper, package audit, project score, environment validator, cleanup assistant, dependency overview, script explorer, report generator, badges, and CI quality gate.

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
dev-soul doctor --no-color  # plain output for logs
dev-soul score              # print a 0-100 project health score
dev-soul ready              # check if the project is ready for work
dev-soul plan               # show what to fix next
dev-soul audit              # audit package metadata before publishing
dev-soul badges             # print README badges
dev-soul insights           # show package, script, and dependency overview
dev-soul scripts            # list package scripts
dev-soul deps               # summarize dependency counts and duplicates
dev-soul env                # compare .env.example with local .env
dev-soul clean              # preview removable build/cache output
dev-soul clean --apply      # remove generated build/cache output
dev-soul report --markdown  # print a markdown project report
dev-soul report --write     # save dev-soul-report.md
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
- npm scripts for `score`, `ready`, `plan`, `insights`, `env`, `report`, and `audit:package`

## Health checks

`dev-soul doctor` checks:

- required files exist
- recommended files exist
- Node.js version is acceptable
- `package.json` exists
- important package fields exist
- required npm scripts exist
- recommended npm scripts exist
- the default placeholder npm test script has been replaced
- package metadata such as `description` exists
- `engines.node` is configured
- package manager lockfile exists
- only one lockfile is present
- `.env` is not committed
- `.env` is protected by `.gitignore` when it exists locally
- local `.env` matches required keys from `.env.example`
- dependencies are not duplicated between `dependencies` and `devDependencies`
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

In supported terminals, `PASS` is green, `WARN` is yellow, and `FAIL` is red. Use `--no-color` or the `NO_COLOR=1` environment variable for plain text output.

## Insights

Use this when you quickly want to understand a project:

```bash
npx dev-soul insights
npx dev-soul scripts
npx dev-soul deps
```

These commands help during onboarding, project reviews, and debugging strange Node.js setups.

## Environment

Keep secrets local while still documenting what a project needs:

```bash
npx dev-soul env
```

`dev-soul` reads key names from `.env.example` and compares them with local `.env`. It never prints secret values.

## Ready Check

Use this before starting work or before opening a pull request:

```bash
npx dev-soul ready
```

It combines the project health check with environment readiness.

## Fix Plan

Use this when the project is noisy and you want the next best actions:

```bash
npx dev-soul plan
```

The plan lists failed checks first, then warnings, with suggested commands where possible.

## Package Audit

Before publishing an npm package:

```bash
npx dev-soul audit
```

It checks package metadata, entry points, publish allowlists, repository metadata, keywords, and common npm-readiness problems.

## Cleanup

Preview generated files that can be removed:

```bash
npx dev-soul clean
```

Apply the cleanup:

```bash
npx dev-soul clean --apply
```

Include `node_modules` only when you really want a full reset:

```bash
npx dev-soul clean --node-modules --apply
```

## Reports

Generate a markdown project report:

```bash
npx dev-soul report --markdown
```

Save it:

```bash
npx dev-soul report --write
```

## Badges

Print badge markdown for your README:

```bash
npx dev-soul badges
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
  "recommendedPackageFields": ["description"],
  "forbiddenFiles": [".env"],
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
    "doctor:json": "dev-soul doctor --json",
    "score": "dev-soul score",
    "ready": "dev-soul ready",
    "plan": "dev-soul plan",
    "insights": "dev-soul insights",
    "env": "dev-soul env",
    "report": "dev-soul report --markdown",
    "report:write": "dev-soul report --write",
    "audit:package": "dev-soul audit"
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
