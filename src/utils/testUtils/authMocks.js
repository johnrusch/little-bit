// Centralized mock utilities for AWS Amplify Auth testing

export const createMockAuthSession = (overrides = {}) => ({
  tokens: {
    idToken: 'mock-id-token',
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  },
  userSub: 'mock-user-sub',
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  userId: 'mock-user-id',
  username: 'test@example.com',
  signInDetails: {
    loginId: 'test@example.com',
    authFlowType: 'USER_PASSWORD_AUTH',
  },
  ...overrides,
});

export const createMockSignInResult = (isSignedIn = true, nextStep = null) => ({
  isSignedIn,
  nextStep: nextStep || { signInStep: 'DONE' },
});

export const createMockSignUpResult = (overrides = {}) => ({
  isSignUpComplete: false,
  userId: 'mock-new-user-id',
  nextStep: {
    signUpStep: 'CONFIRM_SIGN_UP',
    codeDeliveryDetails: {
      deliveryMedium: 'EMAIL',
      destination: 'test@example.com',
    },
  },
  ...overrides,
});

// Mock error factories
export const AuthErrors = {
  UserNotFound: () => new Error('User does not exist'),
  IncorrectPassword: () => new Error('Incorrect username or password'),
  UserNotConfirmed: () => new Error('User is not confirmed'),
  UsernameExists: () => new Error('User already exists'),
  InvalidPassword: () => new Error('Password does not meet requirements'),
  InvalidCode: () => new Error('Invalid verification code provided'),
  ExpiredCode: () => new Error('Verification code has expired'),
  NetworkError: () => new Error('Network error'),
  SessionExpired: () => new Error('Your session has expired'),
  TooManyAttempts: () => new Error('Too many failed attempts'),
  MFARequired: () => new Error('MFA is required'),
};

// Mock Hub event dispatcher
export class MockHubDispatcher {
  constructor() {
    this.events = [];
  }

  dispatch(channel, payload) {
    this.events.push({ channel, payload, timestamp: Date.now() });
  }

  getEvents(channel = null) {
    if (channel) {
      return this.events.filter(e => e.channel === channel);
    }
    return this.events;
  }

  getLastEvent(channel = null) {
    const events = this.getEvents(channel);
    return events[events.length - 1] || null;
  }

  clear() {
    this.events = [];
  }
}

// Mock auth state manager for integration tests
export class MockAuthStateManager {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.tokens = null;
  }

  signIn(user, tokens = null) {
    this.currentUser = user;
    this.isAuthenticated = true;
    this.tokens = tokens || createMockAuthSession();
    return createMockSignInResult(true);
  }

  signOut() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.tokens = null;
  }

  getCurrentUser() {
    if (!this.isAuthenticated) {
      throw AuthErrors.SessionExpired();
    }
    return this.currentUser;
  }

  getTokens() {
    if (!this.isAuthenticated) {
      throw AuthErrors.SessionExpired();
    }
    return this.tokens;
  }

  isSignedIn() {
    return this.isAuthenticated;
  }
}

// Test data generators
export const generateTestUser = (index = 1) => ({
  userId: `test-user-${index}`,
  username: `testuser${index}@example.com`,
  email: `testuser${index}@example.com`,
  attributes: {
    email: `testuser${index}@example.com`,
    email_verified: true,
    sub: `test-user-sub-${index}`,
  },
});

export const generateTestCredentials = (index = 1) => ({
  username: `testuser${index}@example.com`,
  password: `TestPassword${index}!`,
});

// Helper to create mock Amplify auth methods
export const createAmplifyAuthMocks = () => {
  const authState = new MockAuthStateManager();
  const hubDispatcher = new MockHubDispatcher();

  return {
    signIn: jest.fn(async ({ username, password }) => {
      // Simulate validation
      if (!username || !password) {
        throw new Error('Username and password are required');
      }
      
      const user = createMockUser({ username });
      return authState.signIn(user);
    }),

    signUp: jest.fn(async ({ username, password }) => {
      // Simulate validation
      if (!username || !password) {
        throw new Error('Username and password are required');
      }
      
      if (password.length < 8) {
        throw AuthErrors.InvalidPassword();
      }
      
      return createMockSignUpResult({ username });
    }),

    signOut: jest.fn(async () => {
      authState.signOut();
      return {};
    }),

    getCurrentUser: jest.fn(async () => {
      return authState.getCurrentUser();
    }),

    fetchAuthSession: jest.fn(async () => {
      return authState.getTokens();
    }),

    confirmSignUp: jest.fn(async ({ username, confirmationCode }) => {
      if (!confirmationCode || confirmationCode.length !== 6) {
        throw AuthErrors.InvalidCode();
      }
      
      return { isSignUpComplete: true };
    }),

    resendSignUpCode: jest.fn(async ({ username }) => {
      return {
        codeDeliveryDetails: {
          deliveryMedium: 'EMAIL',
          destination: username,
        },
      };
    }),

    // State helpers
    authState,
    hubDispatcher,
  };
};

// Test scenario builders
export const AuthTestScenarios = {
  // Successful authentication flow
  successfulSignIn: (authMocks) => {
    const user = createMockUser();
    authMocks.signIn.mockResolvedValueOnce(createMockSignInResult(true));
    authMocks.getCurrentUser.mockResolvedValueOnce(user);
    return { user };
  },

  // Failed authentication scenarios
  incorrectPassword: (authMocks) => {
    authMocks.signIn.mockRejectedValueOnce(AuthErrors.IncorrectPassword());
  },

  userNotFound: (authMocks) => {
    authMocks.signIn.mockRejectedValueOnce(AuthErrors.UserNotFound());
  },

  userNotConfirmed: (authMocks) => {
    authMocks.signIn.mockResolvedValueOnce(
      createMockSignInResult(false, { 
        signInStep: 'CONFIRM_SIGN_UP',
        codeDeliveryDetails: {
          deliveryMedium: 'EMAIL',
          destination: 'test@example.com',
        },
      })
    );
  },

  // MFA scenarios
  mfaRequired: (authMocks) => {
    authMocks.signIn.mockResolvedValueOnce(
      createMockSignInResult(false, {
        signInStep: 'CONFIRM_SIGN_IN_WITH_SMS_MFA_CODE',
        codeDeliveryDetails: {
          deliveryMedium: 'SMS',
          destination: '+1234567890',
        },
      })
    );
  },

  // Session scenarios
  sessionExpired: (authMocks) => {
    authMocks.getCurrentUser.mockRejectedValueOnce(AuthErrors.SessionExpired());
    authMocks.fetchAuthSession.mockRejectedValueOnce(AuthErrors.SessionExpired());
  },

  validSession: (authMocks) => {
    const user = createMockUser();
    const session = createMockAuthSession();
    authMocks.getCurrentUser.mockResolvedValueOnce(user);
    authMocks.fetchAuthSession.mockResolvedValueOnce(session);
    return { user, session };
  },
};

export default {
  createMockAuthSession,
  createMockUser,
  createMockSignInResult,
  createMockSignUpResult,
  AuthErrors,
  MockHubDispatcher,
  MockAuthStateManager,
  generateTestUser,
  generateTestCredentials,
  createAmplifyAuthMocks,
  AuthTestScenarios,
};