import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import NavBar from '../NavBar';

// Mock FontAwesome
jest.mock('@fortawesome/react-native-fontawesome', () => ({
  FontAwesomeIcon: ({ testID }) => {
    const MockIcon = 'FontAwesomeIcon';
    return <MockIcon testID={testID} />;
  },
}));

describe('NavBar Component', () => {
  const mockNavigation = {
    emit: jest.fn(() => ({ defaultPrevented: false })),
    navigate: jest.fn(),
  };

  const mockState = {
    index: 0,
    routes: [
      { key: 'recorder-tab', name: 'Recorder' },
      { key: 'sounds-tab', name: 'Sounds' },
    ],
  };

  const mockDescriptors = {
    'recorder-tab': {
      options: {
        tabBarAccessibilityLabel: 'Recorder Tab',
        tabBarTestID: 'recorder-tab-button',
      },
    },
    'sounds-tab': {
      options: {
        tabBarAccessibilityLabel: 'Sounds Tab',
        tabBarTestID: 'sounds-tab-button',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all navigation tabs', () => {
    const { getByTestId } = render(
      <NavBar
        state={mockState}
        descriptors={mockDescriptors}
        navigation={mockNavigation}
      />
    );

    expect(getByTestId('recorder-tab-button')).toBeTruthy();
    expect(getByTestId('sounds-tab-button')).toBeTruthy();
  });

  test('highlights active tab correctly', () => {
    const { getByTestId } = render(
      <NavBar
        state={mockState}
        descriptors={mockDescriptors}
        navigation={mockNavigation}
      />
    );

    const activeTab = getByTestId('recorder-tab-button');
    expect(activeTab.props.accessibilityState).toEqual({ selected: true });
  });

  test('handles tab press correctly', () => {
    const mockNavigationFixed = {
      emit: jest.fn(() => ({ defaultPrevented: false })),
      navigate: jest.fn(),
    };

    const { getByTestId } = render(
      <NavBar
        state={mockState}
        descriptors={mockDescriptors}
        navigation={mockNavigationFixed}
      />
    );

    const soundsTab = getByTestId('sounds-tab-button');
    fireEvent.press(soundsTab);

    expect(mockNavigationFixed.emit).toHaveBeenCalledWith({
      type: 'tabPress',
      target: 'sounds-tab',
      canPreventDefault: true,
    });

    expect(mockNavigationFixed.navigate).toHaveBeenCalledWith({
      name: 'Sounds',
      merge: true,
    });
  });

  test('handles tab long press correctly', () => {
    const { getByTestId } = render(
      <NavBar
        state={mockState}
        descriptors={mockDescriptors}
        navigation={mockNavigation}
      />
    );

    const recorderTab = getByTestId('recorder-tab-button');
    fireEvent(recorderTab, 'longPress');

    expect(mockNavigation.emit).toHaveBeenCalledWith({
      type: 'tabLongPress',
      target: 'recorder-tab',
    });
  });

  test('does not navigate if already focused', () => {
    const { getByTestId } = render(
      <NavBar
        state={mockState}
        descriptors={mockDescriptors}
        navigation={mockNavigation}
      />
    );

    // Press the already active tab (index 0 = recorder)
    const recorderTab = getByTestId('recorder-tab-button');
    fireEvent.press(recorderTab);

    expect(mockNavigation.emit).toHaveBeenCalled();
    expect(mockNavigation.navigate).not.toHaveBeenCalled();
  });

  test('respects custom tab colors when provided', () => {
    const customDescriptors = {
      'recorder-tab': {
        options: {
          tabBarAccessibilityLabel: 'Recorder Tab',
          tabBarTestID: 'recorder-tab-button',
          tabBarActiveTintColor: '#FF0000',
          tabBarInactiveTintColor: '#00FF00',
        },
      },
      'sounds-tab': {
        options: {
          tabBarAccessibilityLabel: 'Sounds Tab',
          tabBarTestID: 'sounds-tab-button',
          tabBarActiveTintColor: '#FF0000',
          tabBarInactiveTintColor: '#00FF00',
        },
      },
    };

    const { getByTestId } = render(
      <NavBar
        state={mockState}
        descriptors={customDescriptors}
        navigation={mockNavigation}
      />
    );

    // Component should render without errors with custom colors
    expect(getByTestId('recorder-tab-button')).toBeTruthy();
    expect(getByTestId('sounds-tab-button')).toBeTruthy();
  });

  test('handles navigation events being prevented', () => {
    const mockNavigationWithPrevention = {
      emit: jest.fn(() => ({ defaultPrevented: true })),
      navigate: jest.fn(),
    };

    const { getByTestId } = render(
      <NavBar
        state={mockState}
        descriptors={mockDescriptors}
        navigation={mockNavigationWithPrevention}
      />
    );

    const soundsTab = getByTestId('sounds-tab-button');
    fireEvent.press(soundsTab);

    expect(mockNavigationWithPrevention.emit).toHaveBeenCalled();
    expect(mockNavigationWithPrevention.navigate).not.toHaveBeenCalled();
  });
});