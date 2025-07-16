// Jest setup file

// Global mocks for React Native and Expo
global.__DEV__ = true;

// Mock Expo import meta registry before any imports
global.__ExpoImportMetaRegistry = {};

// Mock expo-modules-core before other modules
jest.mock('expo-modules-core', () => ({
  NativeModulesProxy: {},
  EventEmitter: jest.fn(),
  createWebModule: jest.fn(),
  requireNativeModule: jest.fn(() => ({})),
}));

// Mock Expo winter runtime to prevent import errors
jest.mock('expo/src/winter/runtime.native', () => ({}), { virtual: true });

// Mock Expo modules
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn(),
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    Recording: jest.fn().mockImplementation(() => ({
      prepareToRecordAsync: jest.fn(),
      startAsync: jest.fn(),
      stopAndUnloadAsync: jest.fn(),
      getStatusAsync: jest.fn(() => ({ durationMillis: 1000 })),
      getURI: jest.fn(() => 'mock-uri'),
    })),
    Sound: jest.fn().mockImplementation(() => ({
      loadAsync: jest.fn(),
      playAsync: jest.fn(),
      pauseAsync: jest.fn(),
      stopAsync: jest.fn(),
      unloadAsync: jest.fn(),
      getStatusAsync: jest.fn(() => ({ isPlaying: false, positionMillis: 0, durationMillis: 1000 })),
      setOnPlaybackStatusUpdate: jest.fn(),
    })),
  },
}));

// Mock AWS Amplify
jest.mock('aws-amplify', () => ({
  Amplify: {
    configure: jest.fn(),
  },
}));

// Mock AWS Amplify auth module completely
jest.mock('aws-amplify/auth', () => ({
  signUp: jest.fn(),
  signIn: jest.fn(),
  confirmSignUp: jest.fn(),
  signOut: jest.fn(),
  fetchAuthSession: jest.fn(),
  getCurrentUser: jest.fn(),
}));

// Mock new Amplify v6 structure for API and Storage services
jest.mock('aws-amplify/storage', () => ({
  uploadData: jest.fn(),
  downloadData: jest.fn(),
  remove: jest.fn(),
  list: jest.fn(),
  getUrl: jest.fn(),
}));

jest.mock('aws-amplify/api', () => ({
  generateClient: jest.fn(() => ({
    graphql: jest.fn(),
  })),
}));

// Mock AWS Amplify utils
jest.mock('aws-amplify/utils', () => ({
  Hub: {
    listen: jest.fn(() => jest.fn()), // returns unsubscribe function
    dispatch: jest.fn(),
  },
}));

// Keep legacy mocks for compatibility
jest.mock('@aws-amplify/auth', () => ({
  signUp: jest.fn(),
  signIn: jest.fn(),
  confirmSignUp: jest.fn(),
  signOut: jest.fn(),
  fetchAuthSession: jest.fn(),
  getCurrentUser: jest.fn(),
}));

jest.mock('@aws-amplify/storage', () => ({
  uploadData: jest.fn(),
  downloadData: jest.fn(),
  remove: jest.fn(),
  list: jest.fn(),
  getUrl: jest.fn(),
}));

jest.mock('@aws-amplify/api', () => ({
  generateClient: jest.fn(() => ({
    graphql: jest.fn(),
  })),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: jest.fn(),
  };
});

// Silence the warning: Animated: `useNativeDriver` is not supported by mocking NativeAnimatedHelper

// Setup fetch for tests
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
  })
);

// Mock global alert function
global.alert = jest.fn();

// Suppress console warnings in tests
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Require cycle:')
    ) {
      return;
    }
    originalWarn(...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
});

// Mock Metro configuration
jest.mock('expo/metro-config', () => ({
  getDefaultConfig: jest.fn(() => ({
    resolver: {},
    transformer: {},
    serializer: {},
    server: {},
  })),
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/FontAwesome', () => {
  const React = require('react');
  return {
    Button: ({ children, ...props }) => React.createElement('FontAwesome.Button', props, children),
  };
});