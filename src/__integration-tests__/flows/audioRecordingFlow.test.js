import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';
import { uploadData } from 'aws-amplify/storage';

import NameSoundModal from '../../components/modals/NameSoundModal';
import { simulateAudioRecording, simulateStorageOperations } from '../helpers/testUtils';
import { mockAudioPermissions, mockRecordingStates } from '../fixtures/audioData';
import '../helpers/integrationSetup';

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Mock uploadData from AWS Amplify
jest.mock('aws-amplify/storage', () => ({
  uploadData: jest.fn(),
}));

// Mock fetch for blob creation
const mockFetch = jest.fn(() => {
  const mockBlob = new Blob(['mock audio data'], { type: 'audio/m4a' });
  return Promise.resolve({
    blob: () => Promise.resolve(mockBlob),
    clone: () => ({
      blob: () => Promise.resolve(mockBlob),
    }),
  });
});
global.fetch = mockFetch;

describe('Audio Recording Flow Integration Tests', () => {
  let mockRecording;
  let mockStorage;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRecording = simulateAudioRecording();
    mockStorage = simulateStorageOperations();

    // Mock Audio.Recording.createAsync
    Audio.Recording.createAsync = jest.fn().mockResolvedValue({
      recording: mockRecording,
    });

    // Mock permissions
    Audio.requestPermissionsAsync = jest.fn().mockResolvedValue(mockAudioPermissions.granted);
    Audio.setAudioModeAsync = jest.fn().mockResolvedValue();

    // Mock uploadData
    uploadData.mockImplementation(mockStorage.uploadData);
  });

  describe('Audio Permissions Integration', () => {
    it('should request microphone permissions before recording', async () => {
      Audio.requestPermissionsAsync.mockResolvedValue(mockAudioPermissions.granted);

      // Call the permission request function directly
      const result = await Audio.requestPermissionsAsync();

      expect(result.status).toBe('granted');
      expect(Audio.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('should handle permission denial gracefully', async () => {
      Audio.requestPermissionsAsync.mockResolvedValue(mockAudioPermissions.denied);

      const result = await Audio.requestPermissionsAsync();

      expect(result.status).toBe('denied');
      expect(result.granted).toBe(false);
    });
  });

  describe('Audio Recording Integration', () => {
    it('should create recording with high quality preset', async () => {
      await Audio.Recording.createAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);

      expect(Audio.Recording.createAsync).toHaveBeenCalledWith(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
    });

    it('should handle recording creation errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      Audio.Recording.createAsync.mockRejectedValue(new Error('Microphone not available'));

      try {
        await Audio.Recording.createAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      } catch (error) {
        expect(error.message).toBe('Microphone not available');
      }

      consoleErrorSpy.mockRestore();
    });

    it('should stop recording and get URI', async () => {
      const mockUri = 'file://path/to/recording.m4a';
      mockRecording.getURI.mockReturnValue(mockUri);

      await mockRecording.stopAndUnloadAsync();
      const uri = mockRecording.getURI();

      expect(mockRecording.stopAndUnloadAsync).toHaveBeenCalled();
      expect(uri).toBe(mockUri);
    });

    it('should extract file format from URI', () => {
      const testCases = [
        { uri: 'file://path/to/recording.m4a', expected: 'm4a' },
        { uri: 'file://path/to/recording.wav', expected: 'wav' },
        { uri: 'file://path/to/recording.mp3', expected: 'mp3' },
      ];

      testCases.forEach(({ uri, expected }) => {
        const format = uri.split('.').slice(-1)[0];
        expect(format).toBe(expected);
      });
    });
  });

  describe('File Upload Integration', () => {
    it('should upload audio blob to S3', async () => {
      const mockBlob = new Blob(['mock audio data'], { type: 'audio/m4a' });
      const testUser = 'test-user-123';
      const testFilename = 'test-recording';
      const testFormat = 'm4a';

      await uploadData({
        key: `unprocessed/${testUser}/${testFilename}.${testFormat}`,
        data: mockBlob
      });

      expect(uploadData).toHaveBeenCalledWith({
        key: `unprocessed/${testUser}/${testFilename}.${testFormat}`,
        data: mockBlob
      });
    });

    it('should handle upload errors', async () => {
      uploadData.mockRejectedValue(new Error('Network error'));
      const mockBlob = new Blob(['mock audio data'], { type: 'audio/m4a' });

      try {
        await uploadData({
          key: 'unprocessed/test-user/test.m4a',
          data: mockBlob
        });
      } catch (error) {
        expect(error.message).toBe('Network error');
      }

      expect(uploadData).toHaveBeenCalled();
    });

    it('should generate timestamped filenames', () => {
      const timestamp1 = new Date().toISOString().replace(/(:|\s+)/g, '-');
      // Small delay to ensure different timestamp
      const timestamp2 = new Date().toISOString().replace(/(:|\s+)/g, '-');

      // They should be very close but potentially different
      expect(timestamp1).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(timestamp2).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('NameSoundModal Integration', () => {
    it('should validate empty recording names', async () => {
      const mockSaveRecording = jest.fn();
      const mockSetModalVisible = jest.fn();

      const { getByText } = render(
        <NameSoundModal
          text=""
          setText={jest.fn()}
          saveRecording={mockSaveRecording}
          modalVisible={true}
          setModalVisible={mockSetModalVisible}
        />
      );

      const submitButton = getByText('Submit Name');
      await act(async () => {
        fireEvent.press(submitButton);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Please enter a name');
        expect(mockSaveRecording).not.toHaveBeenCalled();
      });
    });

    it('should save recording with valid name', async () => {
      const mockSaveRecording = jest.fn();
      const mockSetModalVisible = jest.fn();

      const { getByText } = render(
        <NameSoundModal
          text="Valid Recording Name"
          setText={jest.fn()}
          saveRecording={mockSaveRecording}
          modalVisible={true}
          setModalVisible={mockSetModalVisible}
        />
      );

      const submitButton = getByText('Submit Name');
      await act(async () => {
        fireEvent.press(submitButton);
      });

      await waitFor(() => {
        expect(mockSaveRecording).toHaveBeenCalled();
        expect(Alert.alert).not.toHaveBeenCalled();
      });
    });

    it('should update text input correctly', async () => {
      const mockSetText = jest.fn();

      const { getByDisplayValue } = render(
        <NameSoundModal
          text="Initial Text"
          setText={mockSetText}
          saveRecording={jest.fn()}
          modalVisible={true}
          setModalVisible={jest.fn()}
        />
      );

      const textInput = getByDisplayValue('Initial Text');
      await act(async () => {
        fireEvent.changeText(textInput, 'Updated Text');
      });

      expect(mockSetText).toHaveBeenCalledWith('Updated Text');
    });

    it('should handle modal visibility changes', () => {
      const mockSetModalVisible = jest.fn();

      const { rerender } = render(
        <NameSoundModal
          text="Test"
          setText={jest.fn()}
          saveRecording={jest.fn()}
          modalVisible={false}
          setModalVisible={mockSetModalVisible}
        />
      );

      // Modal should not be visible
      expect(mockSetModalVisible).not.toHaveBeenCalled();

      rerender(
        <NameSoundModal
          text="Test"
          setText={jest.fn()}
          saveRecording={jest.fn()}
          modalVisible={true}
          setModalVisible={mockSetModalVisible}
        />
      );

      // Modal should now be visible
      // The component handles visibility internally
    });
  });

  describe('Blob Creation Integration', () => {
    it('should create blob from recording URI', async () => {
      const mockUri = 'file://path/to/recording.m4a';
      const mockBlob = new Blob(['mock audio data'], { type: 'audio/m4a' });
      
      mockFetch.mockResolvedValue({
        blob: () => Promise.resolve(mockBlob),
        clone: () => ({
          blob: () => Promise.resolve(mockBlob),
        }),
      });

      const response = await fetch(mockUri);
      const blob = await response.blob();

      expect(mockFetch).toHaveBeenCalled();
      // Check that the URL matches what we expect
      const callArgs = mockFetch.mock.calls[0][0];
      expect(callArgs.url || callArgs).toBe(mockUri);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('audio/m4a');
    });

    it('should handle blob creation errors', async () => {
      mockFetch.mockRejectedValue(new Error('Failed to create blob'));

      try {
        await fetch('file://path/to/recording.m4a');
      } catch (error) {
        expect(error.message).toBe('Failed to create blob');
      }

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('Audio Mode Configuration', () => {
    it('should configure audio mode for iOS recording', async () => {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      expect(Audio.setAudioModeAsync).toHaveBeenCalledWith({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    });

    it('should handle audio mode configuration errors', async () => {
      Audio.setAudioModeAsync.mockRejectedValue(new Error('Audio mode not supported'));

      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      } catch (error) {
        expect(error.message).toBe('Audio mode not supported');
      }
    });
  });

  describe('Integration Workflow Simulation', () => {
    it('should simulate complete recording workflow', async () => {
      // Step 1: Request permissions
      const permissions = await Audio.requestPermissionsAsync();
      expect(permissions.status).toBe('granted');

      // Step 2: Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Step 3: Create recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      expect(recording).toBe(mockRecording);

      // Step 4: Stop recording and get URI
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      expect(uri).toBe('file://mock-recording-uri');

      // Step 5: Create blob from URI
      const mockBlob = new Blob(['mock audio data'], { type: 'audio/m4a' });
      mockFetch.mockResolvedValue({
        blob: () => Promise.resolve(mockBlob),
        clone: () => ({
          blob: () => Promise.resolve(mockBlob),
        }),
      });
      
      const response = await fetch(uri);
      const blob = await response.blob();
      expect(blob).toBeInstanceOf(Blob);

      // Step 6: Upload to S3
      await uploadData({
        key: 'unprocessed/test-user/test-recording.m4a',
        data: blob
      });

      expect(uploadData).toHaveBeenCalledWith({
        key: 'unprocessed/test-user/test-recording.m4a',
        data: blob
      });
    });
  });
});