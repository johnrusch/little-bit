// Integration test setup file
// This file sets up the environment for integration tests

import { server, mockHandlers } from './mswServer';
import { cleanupAfterTest } from './testUtils';

// Extend Jest matchers for React Native
import '@testing-library/jest-native/extend-expect';

// Setup MSW server before all tests
beforeAll(() => {
  // Start MSW server
  server.listen({
    onUnhandledRequest: 'warn', // Warn about unhandled requests in tests
  });
  
  // Mock console.warn to reduce noise during tests
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Require cycle:') ||
       args[0].includes('componentWillReceiveProps') ||
       args[0].includes('componentWillUpdate'))
    ) {
      return;
    }
    originalWarn(...args);
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
  
  // Restore console.warn
  console.warn = console.warn.__original || console.warn;
});

// Global test configuration
export const integrationTestConfig = {
  // Default timeout for async operations
  defaultTimeout: 10000,
  
  // Default props for components under test
  defaultProps: {
    testID: 'integration-test-component',
  },
  
  // Common test data
  testUser: {
    id: 'integration-test-user',
    username: 'integrationtest',
    email: 'integration@test.com',
    password: 'IntegrationTest123!',
  },
  
  // Test environment flags
  flags: {
    enableDebugLogs: process.env.INTEGRATION_TEST_DEBUG === 'true',
    enableNetworkLogs: process.env.INTEGRATION_TEST_NETWORK === 'true',
    enablePerformanceLogs: process.env.INTEGRATION_TEST_PERF === 'true',
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