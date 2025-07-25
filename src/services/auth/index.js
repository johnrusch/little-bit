import AuthAdapter from './AuthAdapter';
import { 
  signIn as amplifySignIn, 
  signUp as amplifySignUp, 
  signOut as amplifySignOut, 
  getCurrentUser as amplifyGetCurrentUser,
  fetchAuthSession as amplifyFetchAuthSession
} from 'aws-amplify/auth';
import { Hub as AmplifyHub } from 'aws-amplify/utils';

// Feature flag to enable/disable new auth implementation
const USE_NEW_AUTH = process.env.REACT_APP_USE_NEW_AUTH === 'true';

let authAdapter = null;

/**
 * Initialize the auth service
 * @param {Object} config - Configuration object
 */
export function initializeAuth(config) {
  if (USE_NEW_AUTH && config) {
    authAdapter = new AuthAdapter(config);
  }
}

/**
 * Sign in - uses either new CognitoAuthService or Amplify Auth
 * @param {Object} params - Sign in parameters
 * @returns {Promise<Object>} Sign in result
 */
export async function signIn(params) {
  if (USE_NEW_AUTH && authAdapter) {
    return authAdapter.signIn(params);
  }
  
  // Fallback to Amplify Auth
  return amplifySignIn(params);
}

/**
 * Sign up - uses either new CognitoAuthService or Amplify Auth
 * @param {Object} params - Sign up parameters
 * @returns {Promise<Object>} Sign up result
 */
export async function signUp(params) {
  if (USE_NEW_AUTH && authAdapter) {
    return authAdapter.signUp(params);
  }
  
  // Fallback to Amplify Auth
  return amplifySignUp(params);
}

/**
 * Sign out - uses either new CognitoAuthService or Amplify Auth
 * @returns {Promise<void>}
 */
export async function signOut() {
  if (USE_NEW_AUTH && authAdapter) {
    return authAdapter.signOut();
  }
  
  // Fallback to Amplify Auth
  return amplifySignOut();
}

/**
 * Get current user - uses either new CognitoAuthService or Amplify Auth
 * @returns {Promise<Object>} Current user
 */
export async function getCurrentUser() {
  if (USE_NEW_AUTH && authAdapter) {
    return authAdapter.getCurrentUser();
  }
  
  // Fallback to Amplify Auth
  return amplifyGetCurrentUser();
}

/**
 * Fetch auth session - uses either new CognitoAuthService or Amplify Auth
 * @returns {Promise<Object>} Auth session
 */
export async function fetchAuthSession() {
  if (USE_NEW_AUTH && authAdapter) {
    return authAdapter.fetchAuthSession();
  }
  
  // Fallback to Amplify Auth
  return amplifyFetchAuthSession();
}

/**
 * Hub object for event handling
 */
export const Hub = {
  dispatch: (channel, event) => {
    if (USE_NEW_AUTH && authAdapter) {
      authAdapter.dispatch(channel, event);
    } else {
      AmplifyHub.dispatch(channel, event);
    }
  },
  
  listen: (channel, callback) => {
    if (USE_NEW_AUTH && authAdapter) {
      return authAdapter.listen(channel, callback);
    } else {
      return AmplifyHub.listen(channel, callback);
    }
  }
};

/**
 * Update auth credentials (for storage service)
 * @returns {Promise<Object>} Credentials
 */
export async function getAuthCredentials() {
  if (USE_NEW_AUTH && authAdapter) {
    return authAdapter.getCredentials();
  }
  
  // For Amplify, credentials are handled internally
  return null;
}

// Export the auth adapter for direct access if needed
export { authAdapter };

// Export auth service status
export function isNewAuthEnabled() {
  return USE_NEW_AUTH && authAdapter !== null;
}