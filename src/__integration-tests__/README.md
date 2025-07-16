# Integration Testing Guide

This directory contains the integration testing infrastructure for the Little Bit app. Integration tests validate that different parts of the application work correctly together, including AWS Amplify services, audio recording/playback, and user flows.

## Directory Structure

```
src/__integration-tests__/
├── README.md                    # This guide
├── helpers/                     # Test utilities and setup
│   ├── integrationSetup.js     # Global test setup and configuration
│   ├── mswServer.js            # Mock Service Worker configuration
│   └── testUtils.js            # Test helper functions
├── fixtures/                   # Mock data and test fixtures
│   ├── userData.js             # User authentication mock data
│   └── audioData.js            # Audio sample mock data
└── flows/                      # Integration test suites
    ├── audioRecordingFlow.test.js     # Audio recording flow tests
    └── sampleManagementFlow.test.js   # Sample management flow tests
```

## Getting Started

### Running Integration Tests

```bash
# Run all tests (unit + integration)
npm test

# Run only integration tests
npm run test:integration

# Run integration tests in watch mode
npm run test:integration:watch

# Run only unit tests (excluding integration)
npm run test:unit

# Run tests with coverage
npm run test:coverage
```

### Environment Variables

You can enable additional debugging during integration tests:

```bash
# Enable debug logs
INTEGRATION_TEST_DEBUG=true npm run test:integration

# Enable network request/response logs
INTEGRATION_TEST_NETWORK=true npm run test:integration

# Enable performance logs
INTEGRATION_TEST_PERF=true npm run test:integration
```

## Writing Integration Tests

### Basic Test Structure

Integration tests follow this basic pattern:

```javascript
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { renderWithProviders } from '../helpers/testUtils';
import { mockAuthStates } from '../fixtures/userData';
import '../helpers/integrationSetup'; // Import setup

describe('My Integration Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Additional setup per test
  });

  it('should complete a user flow', async () => {
    const { getByText, getByTestId } = renderWithProviders(
      <MyComponent />,
      { authState: mockAuthStates.authenticated }
    );

    // Interact with the component
    await act(async () => {
      fireEvent.press(getByText('Button'));
    });

    // Assert the expected outcome
    await waitFor(() => {
      expect(getByText('Success')).toBeTruthy();
    });
  });
});
```

### Using Test Helpers

#### renderWithProviders

Use `renderWithProviders` instead of the standard `render` function to automatically wrap components with necessary providers:

```javascript
import { renderWithProviders } from '../helpers/testUtils';
import { mockAuthStates } from '../fixtures/userData';

const { getByText } = renderWithProviders(
  <MyScreen />,
  { 
    authState: mockAuthStates.authenticated,
    navigationOptions: { initialRouteName: 'Home' }
  }
);
```

#### Mock Data

Use pre-defined mock data from fixtures:

```javascript
import { mockUsers, mockAuthStates } from '../fixtures/userData';
import { mockAudioSamples, mockRecordingStates } from '../fixtures/audioData';

// Use in tests
const testUser = mockUsers.validUser;
const testSample = mockAudioSamples.sample1;
```

#### Simulation Helpers

Use simulation helpers for complex operations:

```javascript
import { 
  simulateAuthentication,
  simulateAudioRecording,
  simulateStorageOperations 
} from '../helpers/testUtils';

// Mock authentication flow
const authMocks = simulateAuthentication({
  signIn: jest.fn(),
  signUp: jest.fn(),
  confirmSignUp: jest.fn()
});

// Mock audio recording
const mockRecording = simulateAudioRecording();

// Mock AWS Storage operations
const mockStorage = simulateStorageOperations();
```

### Testing Patterns

#### 1. Complete User Flows

Test entire user journeys from start to finish:

```javascript
it('should complete audio recording flow: start -> stop -> name -> save', async () => {
  // Start recording
  await act(async () => {
    fireEvent.press(getByTestId('microphone-button'));
  });

  // Verify recording started
  await waitFor(() => {
    expect(Audio.Recording.createAsync).toHaveBeenCalled();
  });

  // Stop recording
  await act(async () => {
    fireEvent.press(getByTestId('microphone-button'));
  });

  // Name the recording
  await act(async () => {
    fireEvent.changeText(getByTestId('name-input'), 'My Recording');
    fireEvent.press(getByText('Submit Name'));
  });

  // Verify upload
  await waitFor(() => {
    expect(uploadData).toHaveBeenCalledWith({
      key: expect.stringMatching(/My Recording/),
      data: expect.any(Blob)
    });
  });
});
```

#### 2. Error Handling

Test how your components handle errors:

```javascript
it('should handle upload errors gracefully', async () => {
  // Mock upload failure
  uploadData.mockRejectedValue(new Error('Network error'));

  // Complete recording flow
  // ... recording steps ...

  // Verify error handling
  await waitFor(() => {
    expect(uploadData).toHaveBeenCalled();
    // Component should handle error gracefully
  });
});
```

#### 3. State Management

Test component state changes:

```javascript
it('should track active audio correctly', async () => {
  // Play first audio
  await act(async () => {
    fireEvent.press(getByTestId('play-button-1'));
  });

  // Switch to second audio
  await act(async () => {
    fireEvent.press(getByTestId('play-button-2'));
  });

  // Verify state transition
  await waitFor(() => {
    expect(PLAYBACK.playNext).toHaveBeenCalledWith(
      expect.any(Object),
      mockAudioSamples.sample2.url
    );
  });
});
```

### API Mocking with MSW

The Mock Service Worker (MSW) is configured to intercept API calls. You can customize responses for specific tests:

```javascript
import { server, mockHandlers } from '../helpers/mswServer';

it('should handle API errors', async () => {
  // Mock API failure
  mockHandlers.mockNetworkError();

  // Test component behavior
  // ...

  // Reset to defaults
  mockHandlers.resetToDefaults();
});
```

Available mock handlers:
- `mockHandlers.mockAuthFailure()` - Mock authentication failures
- `mockHandlers.mockNetworkError()` - Mock network errors
- `mockHandlers.mockEmptySamples()` - Mock empty sample list
- `mockHandlers.mockS3UploadFailure()` - Mock S3 upload failures
- `mockHandlers.resetToDefaults()` - Reset all handlers

### Testing AWS Amplify Services

#### Authentication

```javascript
import { signIn, signUp, confirmSignUp } from '@aws-amplify/auth';

it('should handle sign up flow', async () => {
  // Mock successful signup
  signUp.mockResolvedValue({
    userSub: 'test-user-123',
    codeDeliveryDetails: { deliveryMedium: 'EMAIL' }
  });

  // Test signup
  await act(async () => {
    fireEvent.press(getByText('Sign Up'));
  });

  // Verify
  await waitFor(() => {
    expect(signUp).toHaveBeenCalledWith({
      username: expect.any(String),
      password: expect.any(String),
      options: { userAttributes: { email: expect.any(String) } }
    });
  });
});
```

#### Storage

```javascript
import { uploadData, downloadData } from 'aws-amplify/storage';

it('should upload audio file', async () => {
  uploadData.mockResolvedValue({
    result: { key: 'audio-samples/test-user/recording.m4a' }
  });

  // Test upload
  await act(async () => {
    fireEvent.press(getByText('Save Recording'));
  });

  // Verify
  await waitFor(() => {
    expect(uploadData).toHaveBeenCalledWith({
      key: expect.stringMatching(/\.m4a$/),
      data: expect.any(Blob)
    });
  });
});
```

#### GraphQL API

```javascript
import { generateClient } from '@aws-amplify/api';

it('should fetch samples from API', async () => {
  const mockClient = { graphql: jest.fn() };
  generateClient.mockReturnValue(mockClient);

  mockClient.graphql.mockResolvedValue({
    data: { listSamples: { items: [mockAudioSamples.sample1] } }
  });

  // Test API call
  // ...

  // Verify
  expect(mockClient.graphql).toHaveBeenCalledWith({
    query: expect.any(String),
    variables: expect.any(Object)
  });
});
```

### Testing Audio Features

#### Recording

```javascript
import { Audio } from 'expo-av';

beforeEach(() => {
  // Mock Audio Recording
  const mockRecording = {
    prepareToRecordAsync: jest.fn(),
    startAsync: jest.fn(),
    stopAndUnloadAsync: jest.fn(),
    getURI: jest.fn(() => 'file://recording.m4a')
  };

  Audio.Recording.createAsync = jest.fn().mockResolvedValue({
    recording: mockRecording
  });
});
```

#### Playback

```javascript
import PLAYBACK from '../../api/playback';

beforeEach(() => {
  // Mock playback operations
  PLAYBACK.play = jest.fn().mockResolvedValue({ isPlaying: true });
  PLAYBACK.pause = jest.fn().mockResolvedValue({ isPlaying: false });
  PLAYBACK.resume = jest.fn().mockResolvedValue({ isPlaying: true });
});
```

### Best Practices

1. **Use act() for state updates**:
   ```javascript
   await act(async () => {
     fireEvent.press(button);
   });
   ```

2. **Use waitFor() for async assertions**:
   ```javascript
   await waitFor(() => {
     expect(getByText('Success')).toBeTruthy();
   });
   ```

3. **Clean up after each test**:
   ```javascript
   afterEach(() => {
     jest.clearAllMocks();
     mockHandlers.resetToDefaults();
   });
   ```

4. **Test the happy path and error cases**:
   ```javascript
   describe('Feature', () => {
     it('should work correctly under normal conditions', () => {});
     it('should handle errors gracefully', () => {});
     it('should handle edge cases', () => {});
   });
   ```

5. **Use descriptive test names**:
   ```javascript
   it('should upload audio file and display success message when recording is saved', () => {});
   ```

6. **Mock external dependencies consistently**:
   ```javascript
   // Mock at the top of the file
   jest.mock('aws-amplify/storage', () => ({
     uploadData: jest.fn(),
     downloadData: jest.fn()
   }));
   ```

### Debugging Integration Tests

1. **Enable debug logs**:
   ```bash
   INTEGRATION_TEST_DEBUG=true npm run test:integration
   ```

2. **Use screen.debug() to see component tree**:
   ```javascript
   import { screen } from '@testing-library/react-native';
   
   it('should render correctly', () => {
     renderWithProviders(<Component />);
     screen.debug(); // Prints the component tree
   });
   ```

3. **Add console.log in tests**:
   ```javascript
   it('should work', async () => {
     console.log('Before action');
     await act(async () => {
       fireEvent.press(button);
     });
     console.log('After action');
   });
   ```

4. **Check mock function calls**:
   ```javascript
   console.log('Upload calls:', uploadData.mock.calls);
   console.log('Last call args:', uploadData.mock.calls[0]);
   ```

### Common Issues and Solutions

#### Issue: "Warning: Can't perform a React state update on an unmounted component"

**Solution**: Make sure to clean up properly and use act() for state updates:

```javascript
afterEach(() => {
  cleanup(); // From @testing-library/react-native
});
```

#### Issue: "Warning: You called act(async () => ...) without await"

**Solution**: Always await act calls:

```javascript
// ❌ Wrong
act(async () => {
  fireEvent.press(button);
});

// ✅ Correct
await act(async () => {
  fireEvent.press(button);
});
```

#### Issue: "Unable to find an element with text: ..."

**Solution**: Use waitFor() for elements that appear asynchronously:

```javascript
// ❌ Wrong
expect(getByText('Success')).toBeTruthy();

// ✅ Correct
await waitFor(() => {
  expect(getByText('Success')).toBeTruthy();
});
```

#### Issue: Mock functions not being called

**Solution**: Verify mocks are set up before component renders:

```javascript
beforeEach(() => {
  // Set up mocks BEFORE rendering component
  uploadData.mockResolvedValue({ result: { key: 'test' } });
});

it('should call upload', async () => {
  renderWithProviders(<Component />);
  // Now interact with component
});
```

### Contributing

When adding new integration tests:

1. Follow the existing patterns in this directory
2. Add new fixtures to `fixtures/` if needed
3. Update this README if you add new helpers or patterns
4. Ensure tests are isolated and don't depend on each other
5. Test both success and failure scenarios
6. Use descriptive test names and organize tests logically

For questions or issues with integration testing, check the existing tests for examples or refer to the project's testing documentation.