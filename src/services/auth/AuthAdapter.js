import CognitoAuthService from './CognitoAuthService';

/**
 * Auth Adapter that provides Amplify Auth API compatibility
 * while using CognitoAuthService under the hood
 */
class AuthAdapter {
  constructor(config) {
    this.cognitoService = new CognitoAuthService(config);
    this.config = config;
    
    // Hub compatibility
    this.hubListeners = new Map();
  }

  /**
   * Sign in (Amplify Auth.signIn replacement)
   * @param {Object} params - Sign in parameters
   * @returns {Promise<Object>} Sign in result matching Amplify format
   */
  async signIn(params) {
    const { username, password } = params;
    
    try {
      const userId = await this.cognitoService.signIn(username, password);
      
      // Dispatch Hub event for compatibility
      this._dispatchHubEvent('signedIn', { userId });
      
      return {
        isSignedIn: true,
        nextStep: { signInStep: 'DONE' }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Sign up (Amplify Auth.signUp replacement)
   * @param {Object} params - Sign up parameters
   * @returns {Promise<Object>} Sign up result matching Amplify format
   */
  async signUp(params) {
    const { username, password } = params;
    
    try {
      const result = await this.cognitoService.signUp({
        email: username,
        password
      });
      
      return {
        userId: result.userSub,
        isSignUpComplete: true,
        nextStep: { signUpStep: 'DONE' }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Sign out (Amplify Auth.signOut replacement)
   * @returns {Promise<void>}
   */
  async signOut() {
    const success = await this.cognitoService.signOut();
    
    if (success) {
      // Dispatch Hub event for compatibility
      this._dispatchHubEvent('signedOut', {});
    }
  }

  /**
   * Get current user (Amplify Auth.getCurrentUser replacement)
   * @returns {Promise<Object>} Current user matching Amplify format
   */
  async getCurrentUser() {
    const user = await this.cognitoService.getCurrentUser();
    
    if (!user) {
      throw new Error('No current user');
    }
    
    return {
      userId: user.userId,
      username: user.username
    };
  }

  /**
   * Fetch auth session (Amplify Auth.fetchAuthSession replacement)
   * @returns {Promise<Object>} Auth session
   */
  async fetchAuthSession() {
    const session = await this.cognitoService.getSession();
    
    if (!session) {
      return { isSignedIn: false };
    }
    
    return {
      isSignedIn: true,
      tokens: {
        idToken: { toString: () => session.idToken },
        accessToken: { toString: () => session.accessToken }
      }
    };
  }

  /**
   * Confirm sign up (Amplify Auth.confirmSignUp replacement)
   * @param {Object} params - Confirm sign up parameters
   * @returns {Promise<Object>} Confirm sign up result matching Amplify format
   */
  async confirmSignUp(params) {
    const { username, confirmationCode } = params;
    
    try {
      await this.cognitoService.confirmSignUp(username, confirmationCode);
      
      return {
        isSignUpComplete: true,
        nextStep: { signUpStep: 'DONE' }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Get credentials for AWS SDK usage
   * @returns {Promise<Object>} AWS credentials
   */
  async getCredentials() {
    return this.cognitoService.getCredentials();
  }

  /**
   * Hub dispatch for event compatibility
   * @param {string} channel - Hub channel (usually 'auth')
   * @param {Object} event - Event object
   */
  dispatch(channel, event) {
    const listeners = this.hubListeners.get(channel) || [];
    
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in Hub listener:', error);
      }
    });
  }

  /**
   * Hub listen for event compatibility
   * @param {string} channel - Hub channel
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  listen(channel, callback) {
    if (!this.hubListeners.has(channel)) {
      this.hubListeners.set(channel, []);
    }
    
    this.hubListeners.get(channel).push(callback);
    
    // Also register with CognitoAuthService if it's auth channel
    if (channel === 'auth') {
      this.cognitoService.addAuthStateListener((event) => {
        callback({ payload: event });
      });
    }
    
    // Return unsubscribe function
    return () => {
      const listeners = this.hubListeners.get(channel) || [];
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
      
      if (channel === 'auth' && this.cognitoService.removeAuthStateListener) {
        this.cognitoService.removeAuthStateListener(callback);
      }
    };
  }

  /**
   * Dispatch Hub event
   * @private
   */
  _dispatchHubEvent(eventName, data) {
    this.dispatch('auth', {
      event: eventName,
      data,
      payload: { event: eventName, data }
    });
  }
}

// Factory function to create auth adapter
export function createAuthAdapter(config) {
  return new AuthAdapter(config);
}

export default AuthAdapter;