# CI/CD Troubleshooting Guide

This guide helps you resolve common CI/CD check failures in pull requests.

## Table of Contents

- [Pre-commit Hooks](#pre-commit-hooks)
- [Lint & Format Check](#lint--format-check)
- [Test Suite](#test-suite)
- [Bundle Size Analysis](#bundle-size-analysis)
- [Security Vulnerability Scan](#security-vulnerability-scan)
- [CDK Validation](#cdk-validation)
- [CDK Diff](#cdk-diff)

## Pre-commit Hooks

Pre-commit hooks run automatically before each commit to catch issues early.

### Setup

```bash
npm install  # This runs husky prepare automatically
```

### Common Issues

- **Hook not running**: Ensure you have run `npm install` after cloning
- **Hook fails**: Run `npm run ci:local` to see detailed errors

### Bypass (use sparingly)

```bash
git commit --no-verify
```

## Lint & Format Check

### Purpose

Ensures code follows project style guidelines using ESLint and Prettier.

### Run Locally

```bash
npm run lint        # Check for linting errors
npm run lint:fix    # Auto-fix linting errors
npm run format:check # Check formatting
npm run format      # Auto-fix formatting
```

### Common Failures

- **Unused variables**: Remove or use them
- **Missing semicolons**: Run `npm run lint:fix`
- **Formatting issues**: Run `npm run format`

## Test Suite

### Purpose

Runs unit and integration tests to ensure code quality.

### Run Locally

```bash
npm test                    # Run all tests
npm run test:unit          # Run unit tests only
npm run test:integration   # Run integration tests only
npm run test:coverage      # Generate coverage report
```

### Common Failures

- **Snapshot mismatches**: Update with `npm test -- -u`
- **Timeout errors**: Increase timeout in test files
- **Module not found**: Check imports and install missing dependencies

## Bundle Size Analysis

### Purpose

Monitors JavaScript bundle size to prevent performance regressions.

### Run Locally

```bash
npm run build
# Check build directory size manually
```

### Common Issues

- **No build directory**: Ensure `npm run build` completes successfully
- **Large bundle size**: Review recent dependency additions

## Security Vulnerability Scan

### Purpose

Checks for known vulnerabilities in dependencies.

### Run Locally

```bash
npm audit
npm audit fix  # Auto-fix vulnerabilities
```

### Common Issues

- **High severity vulnerabilities**: Update affected packages
- **Breaking changes**: Review changelog before major updates

## CDK Validation

### Purpose

Validates AWS CDK infrastructure code.

### Run Locally

```bash
cd cdk
npm test
npx cdk synth --quiet
```

### Common Failures

- **Test failures**: Fix failing CDK tests
- **Synth errors**: Check CDK code for syntax errors
- **Missing dependencies**: Run `cd cdk && npm install`

## CDK Diff

### Purpose

Shows infrastructure changes for PR review.

### Notes

- **Forked PRs**: CDK diff is skipped due to security (no AWS credentials)
- **No changes**: Normal for PRs that don't modify CDK code

### Run Locally

```bash
cd cdk
npx cdk diff --all
```

## Quick Fix Commands

Run all CI checks locally before pushing:

```bash
npm run ci:local
```

Fix common issues:

```bash
npm run lint:fix && npm run format
```

## Need Help?

1. Check the error message in the failed CI check
2. Run the corresponding local command
3. Fix the issues
4. Commit and push your changes

If you're still stuck, ask for help in the PR comments!
