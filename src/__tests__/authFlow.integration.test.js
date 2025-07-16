import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import Navigator from '../navigation/Navigator';
import { AUTH } from '../api';
import { Hub } from 'aws-amplify/utils';
import { createAmplifyAuthMocks, AuthTestScenarios } from '../utils/testUtils/authMocks';

jest.mock('../api', () => ({
  AUTH: {
    logIn: jest.fn(),
    isLoggedIn: jest.fn(),
    getUsername: jest.fn(),
    signUp: jest.fn(),
    logOut: jest.fn(),
  },
}));

// Mock components that aren't essential for auth flow testing
jest.mock('../components/ConfigurationError', () => {
  const React = require('react');
  return () => React.createElement('ConfigurationError');
});

jest.mock('../screens/Home', () => {
  const React = require('react');
  return ({ user }) => React.createElement('Home', { testID: 'home-screen', user });
});

jest.mock('../screens/Signup', () => {
  const React = require('react');
  return () => React.createElement('Signup', { testID: 'signup-screen' });
});

jest.mock('../screens/ConfirmSignup', () => {
  const React = require('react');
  return () => React.createElement('ConfirmSignup', { testID: 'confirm-signup-screen' });
});

jest.mock('../components/FormButton', () => {
  const React = require('react');
  return ({ title, onPress }) => (
    React.createElement('FormButton', {
      testID: 'form-button',
      onPress,
      children: title,
    })
  );
});

jest.mock('../components/FormInput', () => {
  const React = require('react');
  return ({ labelValue, onChangeText, placeholderText }) => (
    React.createElement('FormInput', {
      testID: `form-input-${placeholderText?.toLowerCase()}`,
      value: labelValue,
      onChangeText,
      placeholderText,
    })
  );
});

describe('Authentication Flow Integration Tests', () => {
  let hubListeners = {};

  beforeEach(() => {
    jest.clearAllMocks();
    hubListeners = {};
    
    // Mock Hub.listen to capture listeners
    Hub.listen = jest.fn((channel, callback) => {
      if (!hubListeners[channel]) {
        hubListeners[channel] = [];
      }
      hubListeners[channel].push(callback);
      
      return () => {
        hubListeners[channel] = hubListeners[channel].filter(cb => cb !== callback);
      };
    });

    // Reset console mocks
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  const triggerHubEvent = (channel, event, data) => {
    if (hubListeners[channel]) {
      hubListeners[channel].forEach(callback => {
        callback({ payload: { event, data } });
      });
    }
  };

  describe('Complete Authentication Flow', () => {
    it('should complete full login flow from unauthenticated to authenticated state', async () => {
      // Start with no authenticated user
      AUTH.isLoggedIn.mockResolvedValue(null);
      AUTH.logIn.mockResolvedValue('user-123');
      AUTH.getUsername.mockReturnValue('user-123');

      const { getByTestId, getByText } = render(<Navigator />);

      // Should initially show login screen
      await waitFor(() => {
        expect(getByText('Login')).toBeTruthy();
      });

      // Fill in login credentials
      fireEvent.changeText(getByTestId('form-input-username'), 'test@example.com');
      fireEvent.changeText(getByTestId('form-input-password'), 'password123');

      // Submit login form
      fireEvent.press(getByTestId('form-button'));

      // Wait for login API call
      await waitFor(() => {
        expect(AUTH.logIn).toHaveBeenCalledWith('test@example.com', 'password123');
      });

      // Simulate successful authentication Hub event
      await act(async () => {
        triggerHubEvent('auth', 'signedIn', { userId: 'user-123' });
      });

      // Should now show home screen
      await waitFor(() => {
        expect(getByTestId('home-screen')).toBeTruthy();
      });
    });

    it('should handle logout flow from authenticated to unauthenticated state', async () => {
      // Start with authenticated user
      AUTH.isLoggedIn.mockResolvedValue('user-123');
      AUTH.getUsername.mockReturnValue('user-123');

      const { getByTestId, getByText } = render(<Navigator />);

      // Should initially show home screen
      await waitFor(() => {
        expect(getByTestId('home-screen')).toBeTruthy();
      });

      // Simulate logout Hub event
      await act(async () => {
        triggerHubEvent('auth', 'signedOut', {});
      });

      // Should now show login screen
      await waitFor(() => {
        expect(getByText('Login')).toBeTruthy();
      });
    });

    it('should persist authentication state across app restarts', async () => {
      // First render: user is authenticated
      AUTH.isLoggedIn.mockResolvedValue('user-123');

      const { getByTestId, unmount } = render(<Navigator />);

      await waitFor(() => {
        expect(getByTestId('home-screen')).toBeTruthy();
      });

      unmount();

      // Second render: simulating app restart with persisted auth
      const { getByTestId: getByTestId2 } = render(<Navigator />);

      await waitFor(() => {
        expect(getByTestId2('home-screen')).toBeTruthy();
      });

      expect(AUTH.isLoggedIn).toHaveBeenCalledTimes(2); // Called on each app start
    });
  });

  describe('Authentication Error Scenarios', () => {
    it('should handle session expiry gracefully', async () => {
      // Start authenticated
      AUTH.isLoggedIn.mockResolvedValue('user-123');
      AUTH.getUsername.mockReturnValue('user-123');

      const { getByTestId, getByText } = render(<Navigator />);

      await waitFor(() => {
        expect(getByTestId('home-screen')).toBeTruthy();
      });

      // Simulate session expiry
      AUTH.isLoggedIn.mockResolvedValue(null);

      // Trigger a re-check (this would normally happen on app focus or API call)
      await act(async () => {
        triggerHubEvent('auth', 'signedOut', {});
      });

      await waitFor(() => {
        expect(getByText('Login')).toBeTruthy();
      });
    });

    it('should handle network errors during authentication check', async () => {
      AUTH.isLoggedIn.mockRejectedValue(new Error('Network error'));

      const { getByText } = render(<Navigator />);

      // Should default to login screen when auth check fails
      await waitFor(() => {
        expect(getByText('Login')).toBeTruthy();
      });
    });

    it('should handle Hub event errors gracefully', async () => {
      AUTH.isLoggedIn.mockResolvedValue(null);
      AUTH.getUsername.mockRejectedValue(new Error('Failed to get username'));

      const { getByText } = render(<Navigator />);

      await waitFor(() => {
        expect(getByText('Login')).toBeTruthy();
      });

      // Simulate sign in event with error in getUsername
      await act(async () => {
        triggerHubEvent('auth', 'signedIn', { userId: 'user-123' });
      });

      // Should remain on login screen due to error
      await waitFor(() => {
        expect(getByText('Login')).toBeTruthy();
      });
    });
  });

  describe('Protected Route Access', () => {
    it('should redirect to login when accessing protected content while unauthenticated', async () => {
      AUTH.isLoggedIn.mockResolvedValue(null);

      const { getByText } = render(<Navigator />);

      // Should show login screen, not home
      await waitFor(() => {
        expect(getByText('Login')).toBeTruthy();
      });

      // Home screen should not be accessible
      expect(() => getByTestId('home-screen')).toThrow();
    });

    it('should allow access to protected content when authenticated', async () => {
      AUTH.isLoggedIn.mockResolvedValue('user-123');

      const { getByTestId } = render(<App />);

      // Should show home screen
      await waitFor(() => {
        expect(getByTestId('home-screen')).toBeTruthy();
      });

      // Login screen should not be accessible
      expect(() => getByText('Login')).toThrow();
    });
  });

  describe('Authentication State Transitions', () => {
    it('should handle rapid authentication state changes', async () => {
      AUTH.isLoggedIn.mockResolvedValue(null);
      AUTH.getUsername.mockReturnValue('user-123');

      const { getByText, getByTestId } = render(<App />);

      // Start unauthenticated
      await waitFor(() => {
        expect(getByText('Login')).toBeTruthy();
      });

      // Sign in
      await act(async () => {
        triggerHubEvent('auth', 'signedIn', { userId: 'user-123' });
      });

      await waitFor(() => {
        expect(getByTestId('home-screen')).toBeTruthy();
      });

      // Sign out
      await act(async () => {
        triggerHubEvent('auth', 'signedOut', {});
      });

      await waitFor(() => {
        expect(getByText('Login')).toBeTruthy();
      });

      // Sign in again
      await act(async () => {
        triggerHubEvent('auth', 'signedIn', { userId: 'user-456' });
      });

      await waitFor(() => {
        expect(getByTestId('home-screen')).toBeTruthy();
      });
    });
  });
});