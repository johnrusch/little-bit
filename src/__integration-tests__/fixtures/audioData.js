// Test audio data fixtures for integration tests

export const mockAudioSamples = {
  sample1: {
    id: 'sample-1',
    name: 'Test Recording 1',
    description: 'A test audio recording',
    filename: 'test-recording-1.m4a',
    duration: 5000, // 5 seconds in milliseconds
    userId: 'test-user-123',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  
  sample2: {
    id: 'sample-2',
    name: 'Test Recording 2',
    description: 'Another test audio recording',
    filename: 'test-recording-2.m4a',
    duration: 3000, // 3 seconds in milliseconds
    userId: 'test-user-123',
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
  
  longSample: {
    id: 'sample-long',
    name: 'Long Test Recording',
    description: 'A longer test audio recording',
    filename: 'test-recording-long.m4a',
    duration: 30000, // 30 seconds in milliseconds
    userId: 'test-user-123',
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z',
  },
};

export const mockAudioPermissions = {
  granted: {
    status: 'granted',
    canAskAgain: true,
    granted: true,
  },
  
  denied: {
    status: 'denied',
    canAskAgain: false,
    granted: false,
  },
  
  undetermined: {
    status: 'undetermined',
    canAskAgain: true,
    granted: false,
  },
};

export const mockRecordingStates = {
  initial: {
    canRecord: false,
    isRecording: false,
    isDoneRecording: false,
    durationMillis: 0,
  },
  
  canRecord: {
    canRecord: true,
    isRecording: false,
    isDoneRecording: false,
    durationMillis: 0,
  },
  
  recording: {
    canRecord: true,
    isRecording: true,
    isDoneRecording: false,
    durationMillis: 2500, // 2.5 seconds
  },
  
  doneRecording: {
    canRecord: false,
    isRecording: false,
    isDoneRecording: true,
    durationMillis: 5000, // 5 seconds final duration
  },
};

export const mockPlaybackStates = {
  initial: {
    isPlaying: false,
    positionMillis: 0,
    durationMillis: 0,
    shouldPlay: false,
    isLoaded: false,
  },
  
  loaded: {
    isPlaying: false,
    positionMillis: 0,
    durationMillis: 5000,
    shouldPlay: false,
    isLoaded: true,
  },
  
  playing: {
    isPlaying: true,
    positionMillis: 2500, // Playing at 2.5 seconds
    durationMillis: 5000,
    shouldPlay: true,
    isLoaded: true,
  },
  
  paused: {
    isPlaying: false,
    positionMillis: 2500, // Paused at 2.5 seconds
    durationMillis: 5000,
    shouldPlay: false,
    isLoaded: true,
  },
  
  finished: {
    isPlaying: false,
    positionMillis: 5000, // At the end
    durationMillis: 5000,
    shouldPlay: false,
    isLoaded: true,
  },
};

export const mockS3Operations = {
  uploadSuccess: {
    key: 'audio-samples/test-user-123/recording-123.m4a',
    bucket: 'littlebit-storage',
    region: 'us-east-1',
  },
  
  uploadProgress: [
    { loaded: 1024, total: 10240 }, // 10% progress
    { loaded: 5120, total: 10240 }, // 50% progress
    { loaded: 10240, total: 10240 }, // 100% complete
  ],
  
  downloadSuccess: {
    url: 'https://littlebit-storage.s3.amazonaws.com/audio-samples/test-user-123/recording-123.m4a',
    expiresIn: 3600,
  },
};

export const mockGraphQLResponses = {
  listSamplesSuccess: {
    data: {
      listSamples: {
        items: [mockAudioSamples.sample1, mockAudioSamples.sample2],
        nextToken: null,
      },
    },
  },
  
  listSamplesEmpty: {
    data: {
      listSamples: {
        items: [],
        nextToken: null,
      },
    },
  },
  
  createSampleSuccess: {
    data: {
      createSample: {
        ...mockAudioSamples.sample1,
        id: 'new-sample-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
  },
  
  updateSampleSuccess: {
    data: {
      updateSample: {
        ...mockAudioSamples.sample1,
        name: 'Updated Recording Name',
        description: 'Updated description',
        updatedAt: new Date().toISOString(),
      },
    },
  },
  
  deleteSampleSuccess: {
    data: {
      deleteSample: {
        ...mockAudioSamples.sample1,
        name: 'Deleted Sample',
      },
    },
  },
};