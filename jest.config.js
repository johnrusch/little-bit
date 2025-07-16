module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|aws-amplify|@aws-amplify|react-native-vector-icons|expo-.*|@fortawesome)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/graphql/**',
    '!src/models/**',
    '!src/aws-exports.js',
    '!src/amplifyconfiguration.json'
  ],
  testMatch: [
    '**/__tests__/**/*.(js|jsx)',
    '**/__integration-tests__/**/*.test.(js|jsx)',
    '**/?(*.)+(spec|test).(js|jsx)'
  ],
  moduleDirectories: ['node_modules', 'src'],
  testPathIgnorePatterns: ['/node_modules/', '/amplify/', '/amplify-backup/', '/worktrees/'],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  clearMocks: true,
  resetMocks: true,
  modulePathIgnorePatterns: [
    '<rootDir>/amplify/#current-cloud-backend/',
    '<rootDir>/amplify-backup/',
    '<rootDir>/amplify/.*/node_modules/',
    '<rootDir>/amplify-backup/.*/node_modules/',
    '<rootDir>/worktrees/'
  ],
  globals: {
    __DEV__: true
  }
};