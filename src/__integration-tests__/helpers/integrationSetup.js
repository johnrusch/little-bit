// Integration test setup file
// This file sets up the environment for integration tests

import { server, mockHandlers } from './mswServer';
import { cleanupAfterTest } from './testUtils';

// Extend Jest matchers for React Native
import '@testing-library/jest-native/extend-expect';

// Store original console methods
const originalConsole = {
  warn: console.warn,
  error: console.error,
  log: console.log,
};

// Validate test environment variables
const validateTestEnvironment = () => {
  // Check for production environment variables that shouldn't be present in tests
  const dangerousEnvVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AMPLIFY_ENV',
    'PRODUCTION_API_KEY',
    'PROD_DATABASE_URL',
  ];
  
  const foundDangerousVars = dangerousEnvVars.filter(varName => process.env[varName]);
  
  if (foundDangerousVars.length > 0) {
    console.warn(`[TEST SAFETY WARNING] Found production environment variables in test environment: ${foundDangerousVars.join(', ')}`);
    console.warn('These should not be present during testing to avoid accidental production access.');
  }
  
  // Ensure we're in test environment
  if (process.env.NODE_ENV !== 'test') {
    console.warn(`[TEST SAFETY WARNING] NODE_ENV is not set to 'test' (current: ${process.env.NODE_ENV})`);
  }
};

// Setup MSW server before all tests
beforeAll(() => {
  // Validate test environment
  validateTestEnvironment();
  
  // Log CI mode if detected
  if (isCI) {
    console.log('[CI MODE] Running tests in CI environment with extended timeouts and retries');
  }
  
  // Start MSW server
  server.listen({
    onUnhandledRequest: 'warn', // Warn about unhandled requests in tests
  });
  
  // Mock console.warn to reduce noise during tests
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Require cycle:') ||
       args[0].includes('componentWillReceiveProps') ||
       args[0].includes('componentWillUpdate'))
    ) {
      return;
    }
    originalConsole.warn(...args);
  };
});

// Reset handlers and cleanup after each test
afterEach(() => {
  // Reset MSW handlers to initial state
  server.resetHandlers();
  mockHandlers.resetToDefaults();
  
  // Clean up test state
  cleanupAfterTest();
});

// Clean up after all tests
afterAll(() => {
  // Stop MSW server
  server.close();
  
  // Restore console methods safely
  try {
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.log = originalConsole.log;
  } catch (error) {
    // If restoration fails, at least ensure we have working console methods
    if (!console.warn) console.warn = originalConsole.warn || ((...args) => process.stderr.write(args.join(' ') + '\n'));
    if (!console.error) console.error = originalConsole.error || ((...args) => process.stderr.write(args.join(' ') + '\n'));
    if (!console.log) console.log = originalConsole.log || ((...args) => process.stdout.write(args.join(' ') + '\n'));
  }
});

// Detect CI environment
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

// Global test configuration
export const integrationTestConfig = {
  // Default timeout for async operations - longer in CI
  defaultTimeout: isCI ? 20000 : 10000,
  
  // Default props for components under test
  defaultProps: {
    testID: 'integration-test-component',
  },
  
  // Common test data - generates dynamic values for security
  get testUser() {
    return {
      id: `integration-test-user-${Math.random().toString(36).substr(2, 9)}`,
      username: `integrationtest${Math.random().toString(36).substr(2, 6)}`,
      email: `integration${Math.random().toString(36).substr(2, 6)}@test.com`,
      password: `IntegrationTest${Math.random().toString(36).substr(2, 8)}!`,
    };
  },
  
  // Test environment flags
  flags: {
    enableDebugLogs: process.env.INTEGRATION_TEST_DEBUG === 'true' || (isCI && process.env.DEBUG === 'true'),
    enableNetworkLogs: process.env.INTEGRATION_TEST_NETWORK === 'true',
    enablePerformanceLogs: process.env.INTEGRATION_TEST_PERF === 'true',
    isCI,
  },
  
  // CI-specific settings
  ci: {
    // Disable animations in CI
    disableAnimations: true,
    // More verbose logging in CI
    verboseErrors: true,
    // Retry failed tests in CI
    retryAttempts: isCI ? 2 : 0,
  },
};

// Utility function to log debug information during tests
export const debugLog = (message, data = null) => {
  if (integrationTestConfig.flags.enableDebugLogs) {
    console.log(`[INTEGRATION TEST DEBUG] ${message}`, data || '');
  }
};

// Utility function to measure test performance
export const measurePerformance = (testName, fn) => {
  return async (...args) => {
    if (integrationTestConfig.flags.enablePerformanceLogs) {
      const startTime = performance.now();
      const result = await fn(...args);
      const endTime = performance.now();
      console.log(`[PERFORMANCE] ${testName} took ${endTime - startTime} milliseconds`);
      return result;
    }
    return fn(...args);
  };
};

// Helper to setup test environment for specific test suites
export const setupTestEnvironment = (suiteName, customConfig = {}) => {
  const config = { ...integrationTestConfig, ...customConfig };
  
  debugLog(`Setting up test environment for: ${suiteName}`, config);
  
  return config;
};

export default {
  server,
  mockHandlers,
  integrationTestConfig,
  debugLog,
  measurePerformance,
  setupTestEnvironment,
};