// Test user data fixtures for integration tests

// Generate random test data to avoid static credentials
const generateTestUser = (suffix = '') => ({
  id: `test-user-${Math.random().toString(36).substr(2, 9)}${suffix}`,
  username: `testuser${Math.random().toString(36).substr(2, 6)}`,
  email: `test${Math.random().toString(36).substr(2, 6)}@example.com`,
  password: `TestPass${Math.random().toString(36).substr(2, 8)}!`,
  confirmationCode: Math.random().toString(10).substr(2, 6),
});

export const mockUsers = {
  validUser: generateTestUser('-valid'),
  existingUser: generateTestUser('-existing'),
  invalidUser: {
    username: 'invalid',
    email: 'invalid-email',
    password: '123', // Intentionally weak for testing
  },
};

// Generate random tokens to avoid static values
const generateTokens = () => ({
  accessToken: `mock-access-${Math.random().toString(36).substr(2, 20)}`,
  idToken: `mock-id-${Math.random().toString(36).substr(2, 20)}`,
  refreshToken: `mock-refresh-${Math.random().toString(36).substr(2, 20)}`,
});

export const mockAuthStates = {
  authenticated: {
    user: {
      userId: mockUsers.validUser.id,
      username: mockUsers.validUser.username,
      email: mockUsers.validUser.email,
    },
    tokens: generateTokens(),
    isAuthenticated: true,
  },
  
  unauthenticated: {
    user: null,
    tokens: null,
    isAuthenticated: false,
  },
  
  loading: {
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: true,
  },
};

export const mockCognitoResponses = {
  signUpSuccess: {
    UserSub: mockUsers.validUser.id,
    CodeDeliveryDetails: {
      DeliveryMedium: 'EMAIL',
      Destination: mockUsers.validUser.email,
    },
  },
  
  signUpFailure: {
    __type: 'UsernameExistsException',
    message: 'An account with the given email already exists.',
  },
  
  confirmSignUpSuccess: {},
  
  confirmSignUpFailure: {
    __type: 'CodeMismatchException',
    message: 'Invalid verification code provided, please try again.',
  },
  
  signInSuccess: {
    AuthenticationResult: {
      AccessToken: generateTokens().accessToken,
      IdToken: generateTokens().idToken,
      RefreshToken: generateTokens().refreshToken,
      ExpiresIn: 3600,
    },
  },
  
  signInFailure: {
    __type: 'NotAuthorizedException',
    message: 'Incorrect username or password.',
  },
};