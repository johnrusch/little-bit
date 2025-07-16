import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Audio } from 'expo-av';

import Sounds from '../../screens/Sounds';
import Sound from '../../components/Sound';
import { renderWithProviders, simulateAudioPlayback } from '../helpers/testUtils';
import { mockAuthStates } from '../fixtures/userData';
import { mockAudioSamples, mockPlaybackStates } from '../fixtures/audioData';
import PLAYBACK from '../../api/playback';
import '../helpers/integrationSetup';

// Mock the PLAYBACK API
jest.mock('../../api/playback', () => ({
  play: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  playNext: jest.fn(),
}));

describe('Sample Management Flow Integration Tests', () => {
  let mockSetLoadingStatus;
  let mockSetSounds;
  let mockSetRefreshing;
  let mockSounds;
  let mockSound;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSetLoadingStatus = jest.fn();
    mockSetSounds = jest.fn();
    mockSetRefreshing = jest.fn();
    mockSound = simulateAudioPlayback();
    
    mockSounds = [
      mockAudioSamples.sample1,
      mockAudioSamples.sample2,
      mockAudioSamples.longSample,
    ];

    // Mock Audio.Sound constructor
    Audio.Sound = jest.fn().mockImplementation(() => mockSound);

    // Mock PLAYBACK service methods
    PLAYBACK.play.mockResolvedValue(mockPlaybackStates.playing);
    PLAYBACK.pause.mockResolvedValue(mockPlaybackStates.paused);
    PLAYBACK.resume.mockResolvedValue(mockPlaybackStates.playing);
    PLAYBACK.playNext.mockResolvedValue(mockPlaybackStates.playing);
  });

  describe('Sample List Rendering', () => {
    it('should render all samples in the list', () => {
      const { getByText } = renderWithProviders(
        <Sounds
          user="test-user-123"
          sounds={mockSounds}
          setLoadingStatus={mockSetLoadingStatus}
          setSounds={mockSetSounds}
          setRefreshing={mockSetRefreshing}
          refreshing={false}
        />,
        { authState: mockAuthStates.authenticated }
      );

      // Verify all sample names are rendered
      expect(getByText('Test Recording 1')).toBeTruthy();
      expect(getByText('Test Recording 2')).toBeTruthy();
      expect(getByText('Long Test Recording')).toBeTruthy();
    });

    it('should handle empty sample list gracefully', () => {
      const { queryByText } = renderWithProviders(
        <Sounds
          user="test-user-123"
          sounds={[]}
          setLoadingStatus={mockSetLoadingStatus}
          setSounds={mockSetSounds}
          setRefreshing={mockSetRefreshing}
          refreshing={false}
        />,
        { authState: mockAuthStates.authenticated }
      );

      // Should not crash and should not render any samples
      expect(queryByText('Test Recording 1')).toBeFalsy();
    });

    it('should handle null/undefined samples in the list', () => {
      const soundsWithNulls = [
        mockAudioSamples.sample1,
        null,
        undefined,
        mockAudioSamples.sample2,
      ];

      const { getByText, queryByText } = renderWithProviders(
        <Sounds
          user="test-user-123"
          sounds={soundsWithNulls}
          setLoadingStatus={mockSetLoadingStatus}
          setSounds={mockSetSounds}
          setRefreshing={mockSetRefreshing}
          refreshing={false}
        />,
        { authState: mockAuthStates.authenticated }
      );

      // Should render valid samples and skip null/undefined
      expect(getByText('Test Recording 1')).toBeTruthy();
      expect(getByText('Test Recording 2')).toBeTruthy();
    });
  });

  describe('Audio Playback Integration', () => {
    it('should play audio sample for the first time', async () => {
      const { getByText } = renderWithProviders(
        <Sounds
          user="test-user-123"
          sounds={mockSounds}
          setLoadingStatus={mockSetLoadingStatus}
          setSounds={mockSetSounds}
          setRefreshing={mockSetRefreshing}
          refreshing={false}
        />,
        { authState: mockAuthStates.authenticated }
      );

      // Find and press the first sample's play button
      const firstSampleElement = getByText('Test Recording 1').parent.parent;
      const playButton = firstSampleElement.findByProps({ onPress: expect.any(Function) });

      await act(async () => {
        fireEvent.press(playButton);
      });

      await waitFor(() => {
        expect(Audio.Sound).toHaveBeenCalled();
        expect(mockSound.setOnPlaybackStatusUpdate).toHaveBeenCalled();
        expect(PLAYBACK.play).toHaveBeenCalledWith(
          expect.any(Object),
          mockAudioSamples.sample1.url
        );
      });
    });

    it('should pause currently playing audio', async () => {
      const { getByText } = renderWithProviders(
        <Sounds
          user="test-user-123"
          sounds={mockSounds}
          setLoadingStatus={mockSetLoadingStatus}
          setSounds={mockSetSounds}
          setRefreshing={mockSetRefreshing}
          refreshing={false}
        />,
        { authState: mockAuthStates.authenticated }
      );

      const firstSampleElement = getByText('Test Recording 1').parent.parent;
      const playButton = firstSampleElement.findByProps({ onPress: expect.any(Function) });

      // Start playing
      await act(async () => {
        fireEvent.press(playButton);
      });

      // Mock that audio is now loaded and playing
      mockSound.isLoaded = true;
      mockSound.isPlaying = true;

      // Press again to pause
      await act(async () => {
        fireEvent.press(playButton);
      });

      await waitFor(() => {
        expect(PLAYBACK.pause).toHaveBeenCalled();
      });
    });

    it('should resume paused audio', async () => {
      const { getByText } = renderWithProviders(
        <Sounds
          user="test-user-123"
          sounds={mockSounds}
          setLoadingStatus={mockSetLoadingStatus}
          setSounds={mockSetSounds}
          setRefreshing={mockSetRefreshing}
          refreshing={false}
        />,
        { authState: mockAuthStates.authenticated }
      );

      const firstSampleElement = getByText('Test Recording 1').parent.parent;
      const playButton = firstSampleElement.findByProps({ onPress: expect.any(Function) });

      // Start playing
      await act(async () => {
        fireEvent.press(playButton);
      });

      // Mock that audio is loaded but paused
      mockSound.isLoaded = true;
      mockSound.isPlaying = false;

      // Press again to resume
      await act(async () => {
        fireEvent.press(playButton);
      });

      await waitFor(() => {
        expect(PLAYBACK.resume).toHaveBeenCalled();
      });
    });

    it('should switch to playing a different audio sample', async () => {
      const { getByText } = renderWithProviders(
        <Sounds
          user="test-user-123"
          sounds={mockSounds}
          setLoadingStatus={mockSetLoadingStatus}
          setSounds={mockSetSounds}
          setRefreshing={mockSetRefreshing}
          refreshing={false}
        />,
        { authState: mockAuthStates.authenticated }
      );

      // Start playing first sample
      const firstSampleElement = getByText('Test Recording 1').parent.parent;
      const firstPlayButton = firstSampleElement.findByProps({ onPress: expect.any(Function) });

      await act(async () => {
        fireEvent.press(firstPlayButton);
      });

      // Mock that first audio is loaded and playing
      mockSound.isLoaded = true;
      mockSound.isPlaying = true;

      // Switch to second sample
      const secondSampleElement = getByText('Test Recording 2').parent.parent;
      const secondPlayButton = secondSampleElement.findByProps({ onPress: expect.any(Function) });

      await act(async () => {
        fireEvent.press(secondPlayButton);
      });

      await waitFor(() => {
        expect(PLAYBACK.playNext).toHaveBeenCalledWith(
          expect.any(Object),
          mockAudioSamples.sample2.url
        );
      });
    });
  });

  describe('Individual Sound Component Integration', () => {
    it('should format sample names correctly', () => {
      const { getByText } = render(
        <Sound
          sound={{
            ...mockAudioSamples.sample1,
            name: 'Very Long Sample Name That Should Be Truncated',
          }}
          active={false}
          onAudioPress={jest.fn()}
          setSoundToUpdate={jest.fn()}
          refreshing={false}
        />
      );

      // Should truncate long names
      expect(getByText('Very Long Sample N...')).toBeTruthy();
    });

    it('should display play icon for inactive samples', () => {
      const { UNSAFE_getByProps } = render(
        <Sound
          sound={mockAudioSamples.sample1}
          active={false}
          isPlaying={false}
          onAudioPress={jest.fn()}
          setSoundToUpdate={jest.fn()}
          refreshing={false}
        />
      );

      // Should render FontAwesome play icon
      const iconComponent = UNSAFE_getByProps({ icon: expect.objectContaining({ iconName: 'play' }) });
      expect(iconComponent).toBeTruthy();
    });

    it('should display pause icon for playing samples', () => {
      const { UNSAFE_getByProps } = render(
        <Sound
          sound={mockAudioSamples.sample1}
          active={true}
          selectedSound={mockAudioSamples.sample1}
          isPlaying={true}
          onAudioPress={jest.fn()}
          setSoundToUpdate={jest.fn()}
          refreshing={false}
        />
      );

      // Should render FontAwesome pause icon
      const iconComponent = UNSAFE_getByProps({ icon: expect.objectContaining({ iconName: 'pause' }) });
      expect(iconComponent).toBeTruthy();
    });

    it('should display loading indicator when loading', () => {
      const { UNSAFE_getByType } = render(
        <Sound
          sound={mockAudioSamples.sample1}
          active={true}
          selectedSound={mockAudioSamples.sample1}
          loading={true}
          onAudioPress={jest.fn()}
          setSoundToUpdate={jest.fn()}
          refreshing={false}
        />
      );

      // Should render ActivityIndicator
      const activityIndicator = UNSAFE_getByType('ActivityIndicator');
      expect(activityIndicator).toBeTruthy();
      expect(activityIndicator.props.animating).toBe(true);
    });

    it('should display error state for unable to load samples', () => {
      const { getByText, UNSAFE_getByProps } = render(
        <Sound
          sound={mockAudioSamples.sample1}
          active={true}
          selectedSound={mockAudioSamples.sample1}
          unableToLoad={true}
          onAudioPress={jest.fn()}
          setSoundToUpdate={jest.fn()}
          refreshing={false}
        />
      );

      // Should show error message
      expect(getByText('Unable to load sound')).toBeTruthy();
      
      // Should render frown icon with error color
      const iconComponent = UNSAFE_getByProps({ 
        icon: expect.objectContaining({ iconName: 'frown' }),
        color: '#AD2D26'
      });
      expect(iconComponent).toBeTruthy();
    });

    it('should handle sample name parsing with dashes', () => {
      const { getByText } = render(
        <Sound
          sound={{
            ...mockAudioSamples.sample1,
            name: 'Sample-Name-123',
          }}
          active={false}
          onAudioPress={jest.fn()}
          setSoundToUpdate={jest.fn()}
          refreshing={false}
        />
      );

      // Should split name at last dash
      expect(getByText('Sample-Name')).toBeTruthy();
      expect(getByText('123')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle playback errors gracefully', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      PLAYBACK.play.mockResolvedValue(null); // Simulate error

      const { getByText } = renderWithProviders(
        <Sounds
          user="test-user-123"
          sounds={mockSounds}
          setLoadingStatus={mockSetLoadingStatus}
          setSounds={mockSetSounds}
          setRefreshing={mockSetRefreshing}
          refreshing={false}
        />,
        { authState: mockAuthStates.authenticated }
      );

      const firstSampleElement = getByText('Test Recording 1').parent.parent;
      const playButton = firstSampleElement.findByProps({ onPress: expect.any(Function) });

      await act(async () => {
        fireEvent.press(playButton);
      });

      // Should not crash and should handle null return gracefully
      await waitFor(() => {
        expect(PLAYBACK.play).toHaveBeenCalled();
      });

      consoleLogSpy.mockRestore();
    });

    it('should handle pause errors gracefully', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      PLAYBACK.pause.mockResolvedValue(null); // Simulate error

      const { getByText } = renderWithProviders(
        <Sounds
          user="test-user-123"
          sounds={mockSounds}
          setLoadingStatus={mockSetLoadingStatus}
          setSounds={mockSetSounds}
          setRefreshing={mockSetRefreshing}
          refreshing={false}
        />,
        { authState: mockAuthStates.authenticated }
      );

      const firstSampleElement = getByText('Test Recording 1').parent.parent;
      const playButton = firstSampleElement.findByProps({ onPress: expect.any(Function) });

      // Start playing first
      await act(async () => {
        fireEvent.press(playButton);
      });

      // Mock loaded and playing state
      mockSound.isLoaded = true;
      mockSound.isPlaying = true;

      // Try to pause
      await act(async () => {
        fireEvent.press(playButton);
      });

      await waitFor(() => {
        expect(PLAYBACK.pause).toHaveBeenCalled();
      });

      consoleLogSpy.mockRestore();
    });

    it('should handle playNext errors gracefully', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      PLAYBACK.playNext.mockResolvedValue(null); // Simulate error

      const { getByText } = renderWithProviders(
        <Sounds
          user="test-user-123"
          sounds={mockSounds}
          setLoadingStatus={mockSetLoadingStatus}
          setSounds={mockSetSounds}
          setRefreshing={mockSetRefreshing}
          refreshing={false}
        />,
        { authState: mockAuthStates.authenticated }
      );

      // Start with first sample
      const firstSampleElement = getByText('Test Recording 1').parent.parent;
      const firstPlayButton = firstSampleElement.findByProps({ onPress: expect.any(Function) });

      await act(async () => {
        fireEvent.press(firstPlayButton);
      });

      // Mock loaded state
      mockSound.isLoaded = true;

      // Switch to second sample
      const secondSampleElement = getByText('Test Recording 2').parent.parent;
      const secondPlayButton = secondSampleElement.findByProps({ onPress: expect.any(Function) });

      await act(async () => {
        fireEvent.press(secondPlayButton);
      });

      await waitFor(() => {
        expect(PLAYBACK.playNext).toHaveBeenCalled();
      });

      consoleLogSpy.mockRestore();
    });
  });

  describe('State Management', () => {
    it('should track active list item correctly', async () => {
      const { getByText } = renderWithProviders(
        <Sounds
          user="test-user-123"
          sounds={mockSounds}
          setLoadingStatus={mockSetLoadingStatus}
          setSounds={mockSetSounds}
          setRefreshing={mockSetRefreshing}
          refreshing={false}
        />,
        { authState: mockAuthStates.authenticated }
      );

      // Play first sample
      const firstSampleElement = getByText('Test Recording 1').parent.parent;
      const firstPlayButton = firstSampleElement.findByProps({ onPress: expect.any(Function) });

      await act(async () => {
        fireEvent.press(firstPlayButton);
      });

      // Mock loaded state
      mockSound.isLoaded = true;

      // Switch to second sample
      const secondSampleElement = getByText('Test Recording 2').parent.parent;
      const secondPlayButton = secondSampleElement.findByProps({ onPress: expect.any(Function) });

      await act(async () => {
        fireEvent.press(secondPlayButton);
      });

      await waitFor(() => {
        expect(PLAYBACK.playNext).toHaveBeenCalledWith(
          expect.any(Object),
          mockAudioSamples.sample2.url
        );
      });
    });

    it('should handle refresh state correctly', () => {
      const { rerender } = renderWithProviders(
        <Sounds
          user="test-user-123"
          sounds={mockSounds}
          setLoadingStatus={mockSetLoadingStatus}
          setSounds={mockSetSounds}
          setRefreshing={mockSetRefreshing}
          refreshing={true}
        />,
        { authState: mockAuthStates.authenticated }
      );

      // Should render without errors when refreshing
      rerender(
        <Sounds
          user="test-user-123"
          sounds={mockSounds}
          setLoadingStatus={mockSetLoadingStatus}
          setSounds={mockSetSounds}
          setRefreshing={mockSetRefreshing}
          refreshing={false}
        />
      );

      // Should render without errors when not refreshing
    });
  });
});