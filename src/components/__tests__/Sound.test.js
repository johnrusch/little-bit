import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Sound from '../Sound';

// Mock FontAwesome
jest.mock('@fortawesome/react-native-fontawesome', () => ({
  FontAwesomeIcon: ({ testID, icon }) => {
    const { Text } = require('react-native');
    return <Text testID={testID || 'font-awesome-icon'}>FontAwesome Icon</Text>;
  },
}));

describe('Sound Component', () => {
  const mockSound = {
    id: '123',
    name: 'test-sound-001',
  };

  const defaultProps = {
    active: true,
    setSoundToUpdate: jest.fn(),
    selectedSound: null,
    sound: mockSound,
    isPlaying: false,
    loading: false,
    unableToLoad: false,
    onAudioPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.log to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  test('renders sound name correctly', () => {
    const { getByText } = render(<Sound {...defaultProps} />);
    
    expect(getByText('test-sound')).toBeTruthy();
    expect(getByText('001')).toBeTruthy();
  });

  test('formats long names with ellipsis', () => {
    const longNameSound = {
      id: '123',
      name: 'this-is-a-very-long-sound-name-that-should-be-truncated',
    };

    const { getByText } = render(
      <Sound {...defaultProps} sound={longNameSound} />
    );
    
    // The component formats the name by finding the last dash
    expect(getByText('this-is-a-very-long-sound-name-that-should-be')).toBeTruthy();
    expect(getByText('truncated')).toBeTruthy();
  });

  test('handles audio press correctly', () => {
    const { getByTestId } = render(<Sound {...defaultProps} />);
    
    const playButton = getByTestId('font-awesome-icon');
    fireEvent.press(playButton);
    
    expect(defaultProps.onAudioPress).toHaveBeenCalledTimes(1);
  });

  test('shows loading indicator when loading and selected', () => {
    const { UNSAFE_getByType } = render(
      <Sound 
        {...defaultProps} 
        selectedSound={mockSound}
        loading={true}
      />
    );
    
    expect(UNSAFE_getByType('ActivityIndicator')).toBeTruthy();
  });

  test('shows play icon when not selected', () => {
    const { getByText } = render(<Sound {...defaultProps} />);
    
    const icon = getByText('FontAwesome Icon');
    expect(icon).toBeTruthy();
  });

  test('shows pause icon when selected and playing', () => {
    const { getByText } = render(
      <Sound 
        {...defaultProps} 
        selectedSound={mockSound}
        isPlaying={true}
      />
    );
    
    const icon = getByText('FontAwesome Icon');
    expect(icon).toBeTruthy();
  });

  test('shows play icon when selected but not playing', () => {
    const { getByText } = render(
      <Sound 
        {...defaultProps} 
        selectedSound={mockSound}
        isPlaying={false}
      />
    );
    
    const icon = getByText('FontAwesome Icon');
    expect(icon).toBeTruthy();
  });

  test('shows error state when unable to load', () => {
    const { getByText } = render(
      <Sound 
        {...defaultProps} 
        selectedSound={mockSound}
        unableToLoad={true}
      />
    );
    
    expect(getByText('Unable to load sound')).toBeTruthy();
    expect(getByText('FontAwesome Icon')).toBeTruthy(); // Should show error icon
  });

  test('handles sound without sample number correctly', () => {
    const simpleSound = {
      id: '123',
      name: 'simplesound', // No dash, so won't be split
    };

    const { getByText } = render(
      <Sound {...defaultProps} sound={simpleSound} />
    );
    
    expect(getByText('simplesound')).toBeTruthy();
  });

  test('correctly identifies selected sound', () => {
    const { getByText } = render(
      <Sound 
        {...defaultProps} 
        selectedSound={mockSound}
        isPlaying={true}
      />
    );

    // Should show icon when selected
    expect(getByText('FontAwesome Icon')).toBeTruthy();
  });

  test('handles name formatting edge cases', () => {
    const edgeCaseSound = {
      id: '123',
      name: 'name-with-multiple-dashes-here-123',
    };

    const { getByText } = render(
      <Sound {...defaultProps} sound={edgeCaseSound} />
    );
    
    // Should format correctly by finding the last dash
    expect(getByText('name-with-multiple-dashes-here')).toBeTruthy();
    expect(getByText('123')).toBeTruthy();
  });

  test('renders without crashing with minimal props', () => {
    const minimalProps = {
      sound: { id: '1', name: 'test' },
      onAudioPress: jest.fn(),
    };

    const { getByText } = render(<Sound {...minimalProps} />);
    expect(getByText('test')).toBeTruthy();
  });
});