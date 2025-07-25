import { initializeStorage, updateStorageCredentials } from './storage';
import { initializeAuth, getAuthCredentials } from './auth';
import { initializeAPI, updateAPIAuthToken } from './api';

/**
 * Initialize all services with the given configuration
 * @param {Object} config - Application configuration
 * @returns {Object} Initialized services
 */
export async function initializeServices(config) {
  // Initialize services
  initializeStorage(config);
  initializeAuth(config);
  initializeAPI(config);

  // Set up auth state change listeners if using new services
  if (process.env.REACT_APP_USE_NEW_AUTH !== 'false') {
    try {
      // Get initial credentials and update storage
      const credentials = await getAuthCredentials();
      if (credentials) {
        updateStorageCredentials(credentials);
      }
    } catch (error) {
      // User might not be logged in, which is okay
      console.log('No initial auth credentials available');
    }
  }

  return {
    storage: true,
    auth: true,
    api: true
  };
}

/**
 * Check if all new services are enabled
 * @returns {boolean} True if all services are using new implementation
 */
export function areNewServicesEnabled() {
  return process.env.REACT_APP_USE_NEW_STORAGE !== 'false' &&
         process.env.REACT_APP_USE_NEW_AUTH !== 'false' &&
         process.env.REACT_APP_USE_NEW_API !== 'false';
}

// Re-export individual service functions for convenience
export * from './storage';
export * from './auth';
export * from './api';