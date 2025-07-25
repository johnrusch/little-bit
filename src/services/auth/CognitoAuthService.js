import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute
} from 'amazon-cognito-identity-js';

/**
 * Authentication service using Amazon Cognito Identity SDK
 * Provides a lightweight alternative to Amplify Auth
 */
class CognitoAuthService {
  constructor(config) {
    if (!config || !config.aws || !config.aws.cognito) {
      throw new Error('Invalid configuration provided to CognitoAuthService');
    }

    const { cognito } = config.aws;
    
    if (!cognito.userPoolId || !cognito.clientId) {
      throw new Error('Missing required Cognito configuration');
    }

    // Initialize Cognito User Pool
    this.userPool = new CognitoUserPool({
      UserPoolId: cognito.userPoolId,
      ClientId: cognito.clientId
    });

    this.config = config;
    this.currentUser = null;
    
    // Event listeners for auth state changes
    this.authStateListeners = [];
  }

  /**
   * Sign in a user
   * @param {string} username - The username (email)
   * @param {string} password - The password
   * @returns {Promise<string|null>} User ID if successful, null otherwise
   */
  async signIn(username, password) {
    return new Promise((resolve, reject) => {
      const authenticationDetails = new AuthenticationDetails({
        Username: username,
        Password: password
      });

      const cognitoUser = new CognitoUser({
        Username: username,
        Pool: this.userPool
      });

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          this.currentUser = cognitoUser;
          const userId = result.getIdToken().payload.sub;
          
          // Notify listeners
          this._notifyAuthStateChange('signedIn', { userId, username });
          
          resolve(userId);
        },
        onFailure: (err) => {
          console.error('Sign in error:', err.message);
          reject(err);
        },
        newPasswordRequired: (userAttributes, requiredAttributes) => {
          // Handle new password requirement if needed
          reject(new Error('New password required'));
        }
      });
    });
  }

  /**
   * Sign up a new user
   * @param {Object} params - Sign up parameters
   * @param {string} params.email - User email
   * @param {string} params.password - User password
   * @returns {Promise<Object|null>} Sign up result or null
   */
  async signUp({ email, password }) {
    return new Promise((resolve, reject) => {
      const attributeList = [
        new CognitoUserAttribute({
          Name: 'email',
          Value: email
        })
      ];

      this.userPool.signUp(email, password, attributeList, null, (err, result) => {
        if (err) {
          console.error('Sign up error:', err.message);
          reject(err);
          return;
        }

        resolve({
          username: email,
          userSub: result.userSub
        });
      });
    });
  }

  /**
   * Sign out the current user
   * @returns {Promise<boolean>} True if successful
   */
  async signOut() {
    try {
      const cognitoUser = this.userPool.getCurrentUser();
      
      if (cognitoUser) {
        cognitoUser.signOut();
        this.currentUser = null;
        
        // Notify listeners
        this._notifyAuthStateChange('signedOut', {});
      }
      
      return true;
    } catch (error) {
      console.error('Sign out error:', error.message);
      return false;
    }
  }

  /**
   * Get the current authenticated user
   * @returns {Promise<Object|null>} Current user or null
   */
  async getCurrentUser() {
    return new Promise((resolve, reject) => {
      const cognitoUser = this.userPool.getCurrentUser();
      
      if (!cognitoUser) {
        resolve(null);
        return;
      }

      cognitoUser.getSession((err, session) => {
        if (err || !session.isValid()) {
          resolve(null);
          return;
        }

        const userId = session.getIdToken().payload.sub;
        const username = cognitoUser.getUsername();
        
        this.currentUser = cognitoUser;
        resolve({ userId, username });
      });
    });
  }

  /**
   * Get the current session
   * @returns {Promise<Object|null>} Session object or null
   */
  async getSession() {
    return new Promise((resolve, reject) => {
      const cognitoUser = this.userPool.getCurrentUser();
      
      if (!cognitoUser) {
        resolve(null);
        return;
      }

      cognitoUser.getSession((err, session) => {
        if (err) {
          reject(err);
          return;
        }

        if (!session.isValid()) {
          resolve(null);
          return;
        }

        resolve({
          idToken: session.getIdToken().getJwtToken(),
          accessToken: session.getAccessToken().getJwtToken(),
          refreshToken: session.getRefreshToken().getToken()
        });
      });
    });
  }

  /**
   * Get credentials for AWS SDK
   * @returns {Promise<Object>} AWS credentials
   */
  async getCredentials() {
    const session = await this.getSession();
    if (!session) {
      throw new Error('No valid session');
    }

    // Return credentials configuration for AWS SDK
    return {
      region: this.config.aws.cognito.region || this.config.aws.region,
      identityPoolId: this.config.aws.cognito.identityPoolId,
      logins: {
        [`cognito-idp.${this.config.aws.cognito.region || this.config.aws.region}.amazonaws.com/${this.config.aws.cognito.userPoolId}`]: session.idToken
      }
    };
  }

  /**
   * Add auth state change listener (for Hub compatibility)
   * @param {Function} listener - Listener function
   */
  addAuthStateListener(listener) {
    this.authStateListeners.push(listener);
  }

  /**
   * Remove auth state change listener
   * @param {Function} listener - Listener function
   */
  removeAuthStateListener(listener) {
    this.authStateListeners = this.authStateListeners.filter(l => l !== listener);
  }

  /**
   * Notify auth state change listeners
   * @private
   */
  _notifyAuthStateChange(event, data) {
    this.authStateListeners.forEach(listener => {
      try {
        listener({ event, data });
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }
}

export default CognitoAuthService;