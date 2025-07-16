// Test user data fixtures for integration tests

export const mockUsers = {
  validUser: {
    id: 'test-user-123',
    username: 'testuser',
    email: 'test@example.com',
    password: 'TempPassword123!',
    confirmationCode: '123456',
  },
  
  existingUser: {
    id: 'existing-user-456',
    username: 'existinguser',
    email: 'existing@example.com',
    password: 'ExistingPassword123!',
  },
  
  invalidUser: {
    username: 'invalid',
    email: 'invalid-email',
    password: '123', // Too weak
  },
};

export const mockAuthStates = {
  authenticated: {
    user: {
      userId: mockUsers.validUser.id,
      username: mockUsers.validUser.username,
      email: mockUsers.validUser.email,
    },
    tokens: {
      accessToken: 'mock-access-token',
      idToken: 'mock-id-token',
      refreshToken: 'mock-refresh-token',
    },
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
      AccessToken: 'mock-access-token',
      IdToken: 'mock-id-token',
      RefreshToken: 'mock-refresh-token',
      ExpiresIn: 3600,
    },
  },
  
  signInFailure: {
    __type: 'NotAuthorizedException',
    message: 'Incorrect username or password.',
  },
};