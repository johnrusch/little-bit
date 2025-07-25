import StorageAdapter from './StorageAdapter';
import { getUrl as amplifyGetUrl } from 'aws-amplify/storage';

// Feature flag to enable/disable new storage implementation
const USE_NEW_STORAGE = process.env.REACT_APP_USE_NEW_STORAGE !== 'false';

let storageAdapter = null;

/**
 * Initialize the storage service
 * @param {Object} config - Configuration object
 */
export function initializeStorage(config) {
  if (USE_NEW_STORAGE && config) {
    storageAdapter = new StorageAdapter(config);
  }
}

/**
 * Get URL for a file - uses either new S3Service or Amplify Storage
 * @param {Object} params - Parameters for getUrl
 * @returns {Promise<Object>} URL result
 */
export async function getUrl(params) {
  if (USE_NEW_STORAGE && storageAdapter) {
    return storageAdapter.getUrl(params);
  }
  
  // Fallback to Amplify Storage
  return amplifyGetUrl(params);
}

/**
 * Upload a file - uses either new S3Service or Amplify Storage
 * @param {Object} params - Parameters for put
 * @returns {Promise<Object>} Upload result
 */
export async function put(params) {
  if (USE_NEW_STORAGE && storageAdapter) {
    return storageAdapter.put(params);
  }
  
  // Fallback to Amplify Storage
  const { put: amplifyPut } = await import('aws-amplify/storage');
  return amplifyPut(params);
}

/**
 * Remove a file - uses either new S3Service or Amplify Storage
 * @param {Object} params - Parameters for remove
 * @returns {Promise<Object>} Remove result
 */
export async function remove(params) {
  if (USE_NEW_STORAGE && storageAdapter) {
    return storageAdapter.remove(params);
  }
  
  // Fallback to Amplify Storage
  const { remove: amplifyRemove } = await import('aws-amplify/storage');
  return amplifyRemove(params);
}

/**
 * Update storage credentials
 * @param {Object} credentials - New credentials
 */
export function updateStorageCredentials(credentials) {
  if (USE_NEW_STORAGE && storageAdapter) {
    storageAdapter.updateCredentials(credentials);
  }
}

// Export the storage adapter for direct access if needed
export { storageAdapter };

// Export storage service status
export function isNewStorageEnabled() {
  return USE_NEW_STORAGE && storageAdapter !== null;
}