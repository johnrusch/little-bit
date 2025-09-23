import APIAdapter from './APIAdapter';
import { generateClient as amplifyGenerateClient } from 'aws-amplify/api';

// Feature flag to enable/disable new API implementation
const USE_NEW_API = process.env.REACT_APP_USE_NEW_API === 'true';

let apiAdapter = null;
let generatedClient = null;

/**
 * Initialize the API service
 * @param {Object} config - Configuration object
 */
export function initializeAPI(config) {
  if (USE_NEW_API && config) {
    apiAdapter = new APIAdapter(config);
    generatedClient = apiAdapter.generateClient();
  }
}

/**
 * Generate GraphQL client - uses either new GraphQLService or Amplify API
 * @returns {Object} Generated client
 */
export function generateClient() {
  if (USE_NEW_API && generatedClient) {
    return generatedClient;
  }
  
  // Fallback to Amplify API
  return amplifyGenerateClient();
}

/**
 * Execute GraphQL operation directly
 * @param {Object} params - GraphQL parameters
 * @returns {Promise<Object>} GraphQL result
 */
export async function graphql(params) {
  if (USE_NEW_API && apiAdapter) {
    return apiAdapter.graphql(params);
  }
  
  // Fallback to Amplify API
  const client = amplifyGenerateClient();
  return client.graphql(params);
}

/**
 * Update API auth token (for authenticated requests)
 * @param {string} token - Auth token
 */
export function updateAPIAuthToken(token) {
  if (USE_NEW_API && apiAdapter) {
    apiAdapter.updateAuthToken(token);
  }
}

/**
 * Get the API service for direct access
 * @returns {Object} API service
 */
export function getAPIService() {
  if (USE_NEW_API && generatedClient) {
    return generatedClient;
  }
  
  // Fallback to Amplify API
  return amplifyGenerateClient();
}

// Export the API adapter for direct access if needed
export { apiAdapter };

// Export API service status
export function isNewAPIEnabled() {
  return USE_NEW_API && apiAdapter !== null;
}