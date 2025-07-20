# E2E Tests for EasePM

This directory contains end-to-end tests for the EasePM Electron application using Playwright.

## Setup

The tests are already configured and ready to run. Make sure you have built the application first:

```bash
npm run build
```

## Running Tests

```bash
# Run tests in headless mode
npm run test:e2e

# Run tests with browser window visible
npm run test:e2e:headed

# Run tests in debug mode (step through tests)
npm run test:e2e:debug
```

## Writing Tests

- Add new test files with `.spec.ts` extension in this directory
- Use data-test attributes in components for reliable element selection
- Follow the existing patterns in `app.spec.ts`

## Test Structure

- Tests launch the built Electron app
- Each test gets a fresh app instance
- Tests verify navigation, UI elements, and basic functionality

## Tips

- Always build the app before running tests
- Use `data-test` attributes instead of text selectors when possible
- Add waits for dynamic content loading
- Keep tests focused and independent