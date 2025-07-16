import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';
import { uploadData } from 'aws-amplify/storage';

import Recorder from '../../screens/Recorder';
import NameSoundModal from '../../components/modals/NameSoundModal';
import { renderWithProviders, simulateAudioRecording, simulateStorageOperations } from '../helpers/testUtils';
import { mockAuthStates } from '../fixtures/userData';
import { mockAudioPermissions, mockRecordingStates } from '../fixtures/audioData';
import '../helpers/integrationSetup';

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Mock fetch for blob creation
const mockFetch = jest.fn(() =>
  Promise.resolve({
    blob: () => Promise.resolve(new Blob(['mock audio data'], { type: 'audio/m4a' })),
  })
);
global.fetch = mockFetch;

describe('Audio Recording Flow Integration Tests', () => {
  let mockSetLoadingStatus;
  let mockRecording;
  let mockStorage;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSetLoadingStatus = jest.fn();
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

  describe('Complete Recording Flow', () => {
    it('should complete full recording flow: start -> stop -> name -> save', async () => {
      const { getByTestId, queryByText, getByDisplayValue } = renderWithProviders(
        <Recorder 
          user="test-user-123" 
          setLoadingStatus={mockSetLoadingStatus}
          testID="recorder-screen"
        />,
        { authState: mockAuthStates.authenticated }
      );

      // 1. Start recording
      const microphoneButton = getByTestId('recorder-screen').findByProps({ 
        onPress: expect.any(Function) 
      });
      
      await act(async () => {
        fireEvent.press(microphoneButton);
      });

      // Verify recording started
      await waitFor(() => {
        expect(Audio.requestPermissionsAsync).toHaveBeenCalled();
        expect(Audio.setAudioModeAsync).toHaveBeenCalledWith({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        expect(Audio.Recording.createAsync).toHaveBeenCalledWith(
          Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
        );
        expect(mockRecording.prepareToRecordAsync).toHaveBeenCalled();
      });

      // 2. Stop recording
      await act(async () => {
        fireEvent.press(microphoneButton);
      });

      // Verify recording stopped and modal appeared
      await waitFor(() => {
        expect(mockRecording.stopAndUnloadAsync).toHaveBeenCalled();
        expect(mockRecording.getURI).toHaveBeenCalled();
        expect(queryByText('Name your new sample!')).toBeTruthy();
      });

      // 3. Name the recording
      const nameInput = getByDisplayValue(expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)); // ISO date format
      await act(async () => {
        fireEvent.changeText(nameInput, 'My Test Recording');
      });

      // 4. Save the recording
      const submitButton = queryByText('Submit Name');
      await act(async () => {
        fireEvent.press(submitButton);
      });

      // Verify upload process
      await waitFor(() => {
        expect(mockSetLoadingStatus).toHaveBeenCalledWith({
          loading: true,
          processingSound: true,
        });
        expect(uploadData).toHaveBeenCalledWith({
          key: expect.stringMatching(/^unprocessed\/test-user-123\/My Test Recording\./),
          data: expect.any(Blob),
        });
      });

      // Verify UI state reset
      expect(queryByText('Name your new sample!')).toBeFalsy();
    });

    it('should handle recording permission denial gracefully', async () => {
      Audio.requestPermissionsAsync.mockResolvedValue(mockAudioPermissions.denied);

      const { getByTestId } = renderWithProviders(
        <Recorder 
          user="test-user-123" 
          setLoadingStatus={mockSetLoadingStatus}
          testID="recorder-screen"
        />,
        { authState: mockAuthStates.authenticated }
      );

      const microphoneButton = getByTestId('recorder-screen').findByProps({ 
        onPress: expect.any(Function) 
      });

      await act(async () => {
        fireEvent.press(microphoneButton);
      });

      await waitFor(() => {
        expect(Audio.requestPermissionsAsync).toHaveBeenCalled();
        // Recording should not start if permissions denied
        expect(Audio.Recording.createAsync).not.toHaveBeenCalled();
      });
    });

    it('should handle recording errors during start', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      Audio.Recording.createAsync.mockRejectedValue(new Error('Microphone not available'));

      const { getByTestId } = renderWithProviders(
        <Recorder 
          user="test-user-123" 
          setLoadingStatus={mockSetLoadingStatus}
          testID="recorder-screen"
        />,
        { authState: mockAuthStates.authenticated }
      );

      const microphoneButton = getByTestId('recorder-screen').findByProps({ 
        onPress: expect.any(Function) 
      });

      await act(async () => {
        fireEvent.press(microphoneButton);
      });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to start recording',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle upload errors during save', async () => {
      uploadData.mockRejectedValue(new Error('Network error'));

      const { getByTestId, queryByText, getByDisplayValue } = renderWithProviders(
        <Recorder 
          user="test-user-123" 
          setLoadingStatus={mockSetLoadingStatus}
          testID="recorder-screen"
        />,
        { authState: mockAuthStates.authenticated }
      );

      // Complete recording flow until save
      const microphoneButton = getByTestId('recorder-screen').findByProps({ 
        onPress: expect.any(Function) 
      });

      // Start recording
      await act(async () => {
        fireEvent.press(microphoneButton);
      });

      // Stop recording
      await act(async () => {
        fireEvent.press(microphoneButton);
      });

      // Wait for modal
      await waitFor(() => {
        expect(queryByText('Name your new sample!')).toBeTruthy();
      });

      // Name and save
      const nameInput = getByDisplayValue(expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/));
      await act(async () => {
        fireEvent.changeText(nameInput, 'Test Recording');
      });

      const submitButton = queryByText('Submit Name');
      await act(async () => {
        fireEvent.press(submitButton);
      });

      // Verify upload was attempted
      await waitFor(() => {
        expect(uploadData).toHaveBeenCalled();
      });
    });
  });

  describe('NameSoundModal Integration', () => {
    it('should validate empty recording names', async () => {
      const mockSaveRecording = jest.fn();
      const mockSetModalVisible = jest.fn();

      const { getByText, getByDisplayValue } = render(
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
  });

  describe('Recording State Management', () => {
    it('should handle multiple start/stop cycles correctly', async () => {
      const { getByTestId } = renderWithProviders(
        <Recorder 
          user="test-user-123" 
          setLoadingStatus={mockSetLoadingStatus}
          testID="recorder-screen"
        />,
        { authState: mockAuthStates.authenticated }
      );

      const microphoneButton = getByTestId('recorder-screen').findByProps({ 
        onPress: expect.any(Function) 
      });

      // First recording cycle
      await act(async () => {
        fireEvent.press(microphoneButton); // Start
      });

      await waitFor(() => {
        expect(Audio.Recording.createAsync).toHaveBeenCalledTimes(1);
      });

      await act(async () => {
        fireEvent.press(microphoneButton); // Stop
      });

      await waitFor(() => {
        expect(mockRecording.stopAndUnloadAsync).toHaveBeenCalledTimes(1);
      });

      // Reset mocks for second cycle
      jest.clearAllMocks();
      mockRecording = simulateAudioRecording();
      Audio.Recording.createAsync.mockResolvedValue({ recording: mockRecording });

      // Second recording cycle
      await act(async () => {
        fireEvent.press(microphoneButton); // Start again
      });

      await waitFor(() => {
        expect(Audio.Recording.createAsync).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle file format detection correctly', async () => {
      mockRecording.getURI.mockReturnValue('file://path/to/recording.m4a');

      const { getByTestId, queryByText } = renderWithProviders(
        <Recorder 
          user="test-user-123" 
          setLoadingStatus={mockSetLoadingStatus}
          testID="recorder-screen"
        />,
        { authState: mockAuthStates.authenticated }
      );

      const microphoneButton = getByTestId('recorder-screen').findByProps({ 
        onPress: expect.any(Function) 
      });

      // Start and stop recording
      await act(async () => {
        fireEvent.press(microphoneButton);
      });

      await act(async () => {
        fireEvent.press(microphoneButton);
      });

      // Verify modal appears (indicating format was detected)
      await waitFor(() => {
        expect(queryByText('Name your new sample!')).toBeTruthy();
      });

      // Name and save
      const submitButton = queryByText('Submit Name');
      await act(async () => {
        fireEvent.press(submitButton);
      });

      // Verify upload includes correct format
      await waitFor(() => {
        expect(uploadData).toHaveBeenCalledWith({
          key: expect.stringMatching(/\.m4a$/),
          data: expect.any(Blob),
        });
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle blob creation failure', async () => {
      mockFetch.mockRejectedValue(new Error('Failed to create blob'));

      const { getByTestId } = renderWithProviders(
        <Recorder 
          user="test-user-123" 
          setLoadingStatus={mockSetLoadingStatus}
          testID="recorder-screen"
        />,
        { authState: mockAuthStates.authenticated }
      );

      const microphoneButton = getByTestId('recorder-screen').findByProps({ 
        onPress: expect.any(Function) 
      });

      await act(async () => {
        fireEvent.press(microphoneButton); // Start
      });

      await act(async () => {
        fireEvent.press(microphoneButton); // Stop
      });

      // Modal should still appear even if blob creation fails
      // The component should handle this gracefully
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      }, { timeout: 5000 });
    });

    it('should generate unique filenames for recordings', async () => {
      const { getByTestId, queryByText } = renderWithProviders(
        <Recorder 
          user="test-user-123" 
          setLoadingStatus={mockSetLoadingStatus}
          testID="recorder-screen"
        />,
        { authState: mockAuthStates.authenticated }
      );

      const microphoneButton = getByTestId('recorder-screen').findByProps({ 
        onPress: expect.any(Function) 
      });

      // Complete first recording
      await act(async () => {
        fireEvent.press(microphoneButton);
        fireEvent.press(microphoneButton);
      });

      await waitFor(() => {
        expect(queryByText('Name your new sample!')).toBeTruthy();
      });

      const firstSubmitButton = queryByText('Submit Name');
      await act(async () => {
        fireEvent.press(firstSubmitButton);
      });

      const firstUploadCall = uploadData.mock.calls[0];

      // Reset for second recording
      jest.clearAllMocks();
      mockRecording = simulateAudioRecording();
      Audio.Recording.createAsync.mockResolvedValue({ recording: mockRecording });
      uploadData.mockImplementation(mockStorage.uploadData);

      // Complete second recording
      await act(async () => {
        fireEvent.press(microphoneButton);
        fireEvent.press(microphoneButton);
      });

      await waitFor(() => {
        expect(queryByText('Name your new sample!')).toBeTruthy();
      });

      const secondSubmitButton = queryByText('Submit Name');
      await act(async () => {
        fireEvent.press(secondSubmitButton);
      });

      const secondUploadCall = uploadData.mock.calls[0];

      // Verify filenames are different (due to timestamp)
      expect(firstUploadCall[0].key).not.toEqual(secondUploadCall[0].key);
    });
  });
});