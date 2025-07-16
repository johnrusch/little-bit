import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Hub } from 'aws-amplify/utils';
import Navigator from '../Navigator';
import { AUTH } from '../../api';

// Mock the navigation modules
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    NavigationContainer: ({ children }) => <>{children}</>,
  };
});

jest.mock('@react-navigation/native-stack', () => {
  const mockReact = require('react');
  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ children }) => mockReact.createElement('Navigator', {}, children),
      Screen: ({ name, component, children }) => {
        // If children is a function (render prop), call it with empty props
        if (typeof children === 'function') {
          return children({});
        }
        // Otherwise render the component
        return component ? mockReact.createElement(component, {}) : null;
      },
    }),
  };
});

// Mock screens
jest.mock('../../screens/Login', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, {}, 'Login');
});

jest.mock('../../screens/Signup', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, {}, 'Signup');
});

jest.mock('../../screens/ConfirmSignup', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, {}, 'ConfirmSignup');
});

jest.mock('../../screens/Home', () => {
  const React = require('react');
  const { View } = require('react-native');
  return ({ user }) => React.createElement(View, { testID: 'home-screen', user });
});

// Mock FontAwesome
jest.mock('react-native-vector-icons/FontAwesome', () => ({
  Button: 'FontAwesome.Button',
}));

// Mock the AUTH API
jest.mock('../../api', () => ({
  AUTH: {
    isLoggedIn: jest.fn(),
    getUsername: jest.fn(data => data),
  },
}));

describe('Navigator', () => {
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
      
      // Return unsubscribe function
      return () => {
        hubListeners[channel] = hubListeners[channel].filter(cb => cb !== callback);
      };
    });
  });

  const triggerHubEvent = (channel, event, data) => {
    if (hubListeners[channel]) {
      hubListeners[channel].forEach(callback => {
        callback({ payload: { event, data } });
      });
    }
  };

  describe('Initial state', () => {
    it('should show login screen when user is not authenticated', async () => {
      AUTH.isLoggedIn.mockResolvedValue(null);

      const { getByText } = render(<Navigator />);

      await waitFor(() => {
        expect(getByText('Login')).toBeTruthy();
      });

      expect(AUTH.isLoggedIn).toHaveBeenCalled();
    });

    it('should show home screen when user is authenticated', async () => {
      AUTH.isLoggedIn.mockResolvedValue('user-123');

      const { getByTestId } = render(<Navigator />);

      await waitFor(() => {
        expect(getByTestId('home-screen')).toBeTruthy();
      });
    });
  });

  describe('Hub event handling', () => {
    it('should update state when user signs in', async () => {
      AUTH.isLoggedIn.mockResolvedValue(null);

      const { getByText, getByTestId, rerender } = render(<Navigator />);

      // Initially show login
      await waitFor(() => {
        expect(getByText('Login')).toBeTruthy();
      });

      // Simulate sign in event
      await act(async () => {
        triggerHubEvent('auth', 'signedIn', { userId: 'new-user-123' });
      });

      // Force rerender to see the update
      rerender(<Navigator />);

      await waitFor(() => {
        expect(getByTestId('home-screen')).toBeTruthy();
      });

      expect(AUTH.getUsername).toHaveBeenCalledWith({ userId: 'new-user-123' });
    });

    it('should handle sign in errors gracefully', async () => {
      AUTH.isLoggedIn.mockResolvedValue(null);
      AUTH.getUsername.mockRejectedValue(new Error('Username fetch failed'));

      const { getByText } = render(<Navigator />);

      await waitFor(() => {
        expect(getByText('Login')).toBeTruthy();
      });

      // Simulate sign in event with error
      await act(async () => {
        triggerHubEvent('auth', 'signedIn', { userId: 'error-user' });
      });

      // Should remain on login screen
      await waitFor(() => {
        expect(getByText('Login')).toBeTruthy();
      });
    });

    it('should update state when user signs out', async () => {
      AUTH.isLoggedIn.mockResolvedValue('user-123');

      const { getByTestId, getByText, rerender } = render(<Navigator />);

      // Initially show home
      await waitFor(() => {
        expect(getByTestId('home-screen')).toBeTruthy();
      });

      // Simulate sign out event
      await act(async () => {
        triggerHubEvent('auth', 'signedOut', {});
      });

      // Force rerender to see the update
      rerender(<Navigator />);

      await waitFor(() => {
        expect(getByText('Login')).toBeTruthy();
      });
    });
  });

  describe('Lifecycle management', () => {
    it('should set up Hub listener on mount', () => {
      render(<Navigator />);

      expect(Hub.listen).toHaveBeenCalledWith('auth', expect.any(Function));
    });

    it('should clean up Hub listener on unmount', () => {
      const { unmount } = render(<Navigator />);

      expect(Hub.listen).toHaveBeenCalled();
      const unsubscribe = Hub.listen.mock.results[0].value;
      
      unmount();

      // Verify the listener is removed
      expect(hubListeners['auth'].length).toBe(0);
    });

    it('should check authentication status on mount', async () => {
      AUTH.isLoggedIn.mockResolvedValue('user-123');

      render(<Navigator />);

      await waitFor(() => {
        expect(AUTH.isLoggedIn).toHaveBeenCalled();
      });
    });
  });

  describe('User prop passing', () => {
    it('should pass user prop to Home screen when authenticated', async () => {
      AUTH.isLoggedIn.mockResolvedValue('user-123');

      const { getByTestId } = render(<Navigator />);

      await waitFor(() => {
        const homeScreen = getByTestId('home-screen');
        expect(homeScreen).toBeTruthy();
        expect(homeScreen.props.user).toBe('user-123');
      });
    });
  });
});