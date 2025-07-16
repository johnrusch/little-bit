import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import UserContext from '../../contexts/UserContext';
import { mockAuthStates } from '../fixtures/userData';

// Custom render function that wraps components with necessary providers
export const renderWithProviders = (
  component,
  {
    authState = mockAuthStates.unauthenticated,
    navigationOptions = {},
    ...renderOptions
  } = {}
) => {
  // Mock UserContext Provider
  const MockUserProvider = ({ children }) => {
    const contextValue = {
      ...authState,
      signUp: jest.fn(),
      confirmSignUp: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      setUser: jest.fn(),
      setIsAuthenticated: jest.fn(),
    };

    return (
      <UserContext.Provider value={contextValue}>
        {children}
      </UserContext.Provider>
    );
  };

  // Wrapper component with all providers
  const AllTheProviders = ({ children }) => {
    return (
      <NavigationContainer {...navigationOptions}>
        <MockUserProvider>
          {children}
        </MockUserProvider>
      </NavigationContainer>
    );
  };

  return render(component, { wrapper: AllTheProviders, ...renderOptions });
};

// Helper to simulate user authentication flow
export const simulateAuthentication = (mockFunctions) => {
  const { signIn, signUp, confirmSignUp } = mockFunctions;
  
  // Mock successful sign up
  signUp.mockResolvedValue({
    userSub: 'test-user-123',
    codeDeliveryDetails: {
      deliveryMedium: 'EMAIL',
      destination: 'test@example.com',
    },
  });

  // Mock successful confirmation
  confirmSignUp.mockResolvedValue({});

  // Mock successful sign in
  signIn.mockResolvedValue({
    isSignedIn: true,
    nextStep: { signInStep: 'DONE' },
  });

  return { signIn, signUp, confirmSignUp };
};

// Helper to simulate authentication errors
export const simulateAuthenticationErrors = (mockFunctions) => {
  const { signIn, signUp, confirmSignUp } = mockFunctions;
  
  // Mock sign up error (user already exists)
  signUp.mockRejectedValue({
    name: 'UsernameExistsException',
    message: 'An account with the given email already exists.',
  });

  // Mock confirmation error (invalid code)
  confirmSignUp.mockRejectedValue({
    name: 'CodeMismatchException',
    message: 'Invalid verification code provided, please try again.',
  });

  // Mock sign in error (wrong credentials)
  signIn.mockRejectedValue({
    name: 'NotAuthorizedException',
    message: 'Incorrect username or password.',
  });

  return { signIn, signUp, confirmSignUp };
};

// Helper to wait for async operations in tests
export const waitForAsync = (timeout = 1000) => {
  return new Promise(resolve => setTimeout(resolve, timeout));
};

// Helper to simulate audio recording operations
export const simulateAudioRecording = () => {
  const mockRecording = {
    prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
    startAsync: jest.fn().mockResolvedValue(undefined),
    stopAndUnloadAsync: jest.fn().mockResolvedValue(undefined),
    getStatusAsync: jest.fn().mockResolvedValue({
      durationMillis: 5000,
      canRecord: true,
      isRecording: false,
      isDoneRecording: true,
    }),
    getURI: jest.fn().mockReturnValue('file://mock-recording-uri'),
  };

  return mockRecording;
};

// Helper to simulate audio playback operations
export const simulateAudioPlayback = () => {
  const mockSound = {
    loadAsync: jest.fn().mockResolvedValue({ isLoaded: true }),
    playAsync: jest.fn().mockResolvedValue(undefined),
    pauseAsync: jest.fn().mockResolvedValue(undefined),
    stopAsync: jest.fn().mockResolvedValue(undefined),
    unloadAsync: jest.fn().mockResolvedValue(undefined),
    getStatusAsync: jest.fn().mockResolvedValue({
      isPlaying: false,
      positionMillis: 0,
      durationMillis: 5000,
      isLoaded: true,
    }),
    setOnPlaybackStatusUpdate: jest.fn(),
  };

  return mockSound;
};

// Helper to simulate AWS Amplify Storage operations
export const simulateStorageOperations = () => {
  const mockStorage = {
    uploadData: jest.fn().mockResolvedValue({
      result: {
        key: 'audio-samples/test-user-123/recording-123.m4a',
      },
    }),
    downloadData: jest.fn().mockResolvedValue({
      result: {
        body: new Blob(['mock audio data'], { type: 'audio/m4a' }),
      },
    }),
    getUrl: jest.fn().mockResolvedValue({
      url: new URL('https://mock-s3-url.com/recording-123.m4a'),
    }),
    remove: jest.fn().mockResolvedValue({}),
    list: jest.fn().mockResolvedValue({
      results: [
        { key: 'audio-samples/test-user-123/recording-123.m4a', size: 1024 },
      ],
    }),
  };

  return mockStorage;
};

// Helper to simulate GraphQL API operations
export const simulateGraphQLOperations = () => {
  const mockGraphQL = {
    listSamples: jest.fn(),
    createSample: jest.fn(),
    updateSample: jest.fn(),
    deleteSample: jest.fn(),
    getSample: jest.fn(),
  };

  return mockGraphQL;
};

// Helper to create mock navigation props
export const createMockNavigation = (routeName = 'Home') => {
  return {
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    setParams: jest.fn(),
    dispatch: jest.fn(),
    setOptions: jest.fn(),
    isFocused: jest.fn(() => true),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    canGoBack: jest.fn(() => false),
    getParent: jest.fn(),
    getId: jest.fn(() => routeName),
    getState: jest.fn(() => ({
      key: 'test-key',
      index: 0,
      routeNames: [routeName],
      routes: [{ key: 'test-route', name: routeName }],
    })),
  };
};

// Helper to create mock route props
export const createMockRoute = (params = {}) => {
  return {
    key: 'test-route-key',
    name: 'TestRoute',
    params,
  };
};

// Helper to simulate network connectivity states
export const simulateNetworkStates = () => {
  const mockNetInfo = {
    online: {
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    },
    offline: {
      isConnected: false,
      isInternetReachable: false,
      type: 'none',
    },
    slowConnection: {
      isConnected: true,
      isInternetReachable: true,
      type: 'cellular',
      details: {
        isConnectionExpensive: true,
        cellularGeneration: '3g',
      },
    },
  };

  return mockNetInfo;
};

// Helper for asserting on async state changes
export const expectEventually = async (assertion, timeout = 5000) => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      await assertion();
      return; // Assertion passed
    } catch (error) {
      // Continue trying until timeout
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Final attempt - let it throw if it fails
  await assertion();
};

// Helper to clean up after integration tests
export const cleanupAfterTest = () => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset any global state if needed
  global.fetch?.mockClear?.();
  
  // Clear any timers
  jest.clearAllTimers();
};