import PLAYBACK from '../playback';
import { Audio } from 'expo-av';

describe('PLAYBACK Service', () => {
  let mockPlaybackObj;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});

    // Create a mock playback object with all required methods
    mockPlaybackObj = {
      loadAsync: jest.fn(),
      pauseAsync: jest.fn(),
      playAsync: jest.fn(),
      stopAsync: jest.fn(),
      unloadAsync: jest.fn(),
      setStatusAsync: jest.fn(),
      getStatusAsync: jest.fn(),
    };
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  describe('play', () => {
    it('should successfully load and play audio with correct parameters', async () => {
      const mockStatus = { isPlaying: true, positionMillis: 0 };
      mockPlaybackObj.loadAsync.mockResolvedValue(mockStatus);
      const uri = 'https://example.com/audio.mp3';

      const result = await PLAYBACK.play(mockPlaybackObj, uri);

      expect(mockPlaybackObj.loadAsync).toHaveBeenCalledWith(
        { uri },
        { 
          volume: 0.8, 
          shouldPlay: true,
          rate: 1.0,
          shouldCorrectPitch: true,
        },
        true
      );
      expect(result).toEqual(mockStatus);
    });

    it('should handle audio loading errors gracefully', async () => {
      const error = new Error('Failed to load audio');
      mockPlaybackObj.loadAsync.mockRejectedValue(error);
      const uri = 'https://invalid-url.com/audio.mp3';

      const result = await PLAYBACK.play(mockPlaybackObj, uri);

      expect(console.log).toHaveBeenCalledWith('Unable to load sound: ', 'Failed to load audio');
      expect(result).toBeNull();
    });

    it('should handle missing playback object', async () => {
      const result = await PLAYBACK.play(null, 'test-uri');

      expect(result).toBeNull();
    });

    it('should handle missing URI', async () => {
      const result = await PLAYBACK.play(mockPlaybackObj, null);

      expect(mockPlaybackObj.loadAsync).toHaveBeenCalledWith(
        { uri: null },
        { 
          volume: 0.8, 
          shouldPlay: true,
          rate: 1.0,
          shouldCorrectPitch: true,
        },
        true
      );
    });
  });

  describe('pause', () => {
    it('should successfully pause audio playback', async () => {
      const mockStatus = { isPlaying: false, positionMillis: 5000 };
      mockPlaybackObj.pauseAsync.mockResolvedValue(mockStatus);

      const result = await PLAYBACK.pause(mockPlaybackObj);

      expect(mockPlaybackObj.pauseAsync).toHaveBeenCalled();
      expect(result).toEqual(mockStatus);
    });

    it('should handle pause errors gracefully', async () => {
      const error = new Error('Failed to pause');
      mockPlaybackObj.pauseAsync.mockRejectedValue(error);

      const result = await PLAYBACK.pause(mockPlaybackObj);

      expect(console.log).toHaveBeenCalledWith('Unable to pause sound: ', 'Failed to pause');
      expect(result).toBeNull();
    });

    it('should handle missing playback object', async () => {
      const result = await PLAYBACK.pause(null);

      expect(result).toBeNull();
    });
  });

  describe('resume', () => {
    it('should successfully resume audio playback', async () => {
      const mockStatus = { isPlaying: true, positionMillis: 5000 };
      mockPlaybackObj.playAsync.mockResolvedValue(mockStatus);

      const result = await PLAYBACK.resume(mockPlaybackObj);

      expect(mockPlaybackObj.playAsync).toHaveBeenCalled();
      expect(result).toEqual(mockStatus);
    });

    it('should handle resume errors gracefully', async () => {
      const error = new Error('Failed to resume');
      mockPlaybackObj.playAsync.mockRejectedValue(error);

      const result = await PLAYBACK.resume(mockPlaybackObj);

      expect(console.log).toHaveBeenCalledWith('Unable to resume sound: ', 'Failed to resume');
      expect(result).toBeNull();
    });

    it('should handle missing playback object', async () => {
      const result = await PLAYBACK.resume(null);

      expect(result).toBeNull();
    });
  });

  describe('playNext', () => {
    it('should successfully stop current audio and play next', async () => {
      const mockStatus = { isPlaying: true, positionMillis: 0 };
      mockPlaybackObj.stopAsync.mockResolvedValue();
      mockPlaybackObj.unloadAsync.mockResolvedValue();
      mockPlaybackObj.loadAsync.mockResolvedValue(mockStatus);
      
      const uri = 'https://example.com/next-audio.mp3';

      const result = await PLAYBACK.playNext(mockPlaybackObj, uri);

      expect(mockPlaybackObj.stopAsync).toHaveBeenCalled();
      expect(mockPlaybackObj.unloadAsync).toHaveBeenCalled();
      expect(mockPlaybackObj.loadAsync).toHaveBeenCalledWith(
        { uri },
        { 
          volume: 0.8, 
          shouldPlay: true,
          rate: 1.0,
          shouldCorrectPitch: true,
        },
        true
      );
      expect(result).toEqual(mockStatus);
    });

    it('should handle stop errors gracefully', async () => {
      const error = new Error('Failed to stop');
      mockPlaybackObj.stopAsync.mockRejectedValue(error);

      const result = await PLAYBACK.playNext(mockPlaybackObj, 'test-uri');

      expect(console.log).toHaveBeenCalledWith('Unable to play next sound: ', 'Failed to stop');
      expect(result).toBeNull();
    });

    it('should handle unload errors gracefully', async () => {
      mockPlaybackObj.stopAsync.mockResolvedValue();
      const error = new Error('Failed to unload');
      mockPlaybackObj.unloadAsync.mockRejectedValue(error);

      const result = await PLAYBACK.playNext(mockPlaybackObj, 'test-uri');

      expect(console.log).toHaveBeenCalledWith('Unable to play next sound: ', 'Failed to unload');
      expect(result).toBeNull();
    });

    it('should handle load errors in playNext', async () => {
      mockPlaybackObj.stopAsync.mockResolvedValue();
      mockPlaybackObj.unloadAsync.mockResolvedValue();
      const error = new Error('Failed to load new audio');
      mockPlaybackObj.loadAsync.mockRejectedValue(error);

      const result = await PLAYBACK.playNext(mockPlaybackObj, 'test-uri');

      expect(console.log).toHaveBeenCalledWith('Unable to load sound: ', 'Failed to load new audio');
      expect(result).toBeNull();
    });

    it('should handle missing playback object', async () => {
      const result = await PLAYBACK.playNext(null, 'test-uri');

      expect(result).toBeNull();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete playback flow', async () => {
      const uri1 = 'https://example.com/audio1.mp3';
      const uri2 = 'https://example.com/audio2.mp3';
      
      // Play first audio
      mockPlaybackObj.loadAsync.mockResolvedValue({ isPlaying: true });
      await PLAYBACK.play(mockPlaybackObj, uri1);
      
      // Pause
      mockPlaybackObj.pauseAsync.mockResolvedValue({ isPlaying: false });
      await PLAYBACK.pause(mockPlaybackObj);
      
      // Resume
      mockPlaybackObj.playAsync.mockResolvedValue({ isPlaying: true });
      await PLAYBACK.resume(mockPlaybackObj);
      
      // Play next
      mockPlaybackObj.stopAsync.mockResolvedValue();
      mockPlaybackObj.unloadAsync.mockResolvedValue();
      mockPlaybackObj.loadAsync.mockResolvedValue({ isPlaying: true });
      await PLAYBACK.playNext(mockPlaybackObj, uri2);

      expect(mockPlaybackObj.loadAsync).toHaveBeenCalledTimes(2);
      expect(mockPlaybackObj.pauseAsync).toHaveBeenCalledTimes(1);
      expect(mockPlaybackObj.playAsync).toHaveBeenCalledTimes(1);
      expect(mockPlaybackObj.stopAsync).toHaveBeenCalledTimes(1);
      expect(mockPlaybackObj.unloadAsync).toHaveBeenCalledTimes(1);
    });

    it('should handle audio volume and play settings', async () => {
      mockPlaybackObj.loadAsync.mockResolvedValue({ isPlaying: true });
      
      await PLAYBACK.play(mockPlaybackObj, 'test-uri');

      expect(mockPlaybackObj.loadAsync).toHaveBeenCalledWith(
        expect.any(Object),
        { 
          volume: 0.8, 
          shouldPlay: true,
          rate: 1.0,
          shouldCorrectPitch: true,
        },
        true
      );
    });
  });

  describe('onPlaybackStatusUpdate', () => {
    it('should reset playback when audio finishes and not looping', async () => {
      const playbackStatus = {
        didJustFinish: true,
        isLooping: false
      };

      await PLAYBACK.onPlaybackStatusUpdate(playbackStatus, mockPlaybackObj);

      expect(mockPlaybackObj.setStatusAsync).toHaveBeenCalledWith({
        shouldPlay: false,
        positionMillis: 0
      });
    });

    it('should not reset playback when audio is looping', async () => {
      const playbackStatus = {
        didJustFinish: true,
        isLooping: true
      };

      await PLAYBACK.onPlaybackStatusUpdate(playbackStatus, mockPlaybackObj);

      expect(mockPlaybackObj.setStatusAsync).not.toHaveBeenCalled();
    });

    it('should not reset playback when audio has not finished', async () => {
      const playbackStatus = {
        didJustFinish: false,
        isLooping: false
      };

      await PLAYBACK.onPlaybackStatusUpdate(playbackStatus, mockPlaybackObj);

      expect(mockPlaybackObj.setStatusAsync).not.toHaveBeenCalled();
    });

    it('should handle null playback object gracefully', async () => {
      const playbackStatus = {
        didJustFinish: true,
        isLooping: false
      };

      // Should not throw error
      await PLAYBACK.onPlaybackStatusUpdate(playbackStatus, null);

      expect(mockPlaybackObj.setStatusAsync).not.toHaveBeenCalled();
    });

    it('should handle missing playback status gracefully', async () => {
      // Should not throw error
      await PLAYBACK.onPlaybackStatusUpdate(null, mockPlaybackObj);

      expect(mockPlaybackObj.setStatusAsync).not.toHaveBeenCalled();
    });
  });

  describe('Input validation', () => {
    it('should handle null playback object in play function', async () => {
      const result = await PLAYBACK.play(null, 'test-uri');

      expect(console.log).toHaveBeenCalledWith('Unable to load sound: playback object is null or undefined');
      expect(result).toBeNull();
    });

    it('should handle null playback object in pause function', async () => {
      const result = await PLAYBACK.pause(null);

      expect(console.log).toHaveBeenCalledWith('Unable to pause sound: playback object is null or undefined');
      expect(result).toBeNull();
    });

    it('should handle null playback object in resume function', async () => {
      const result = await PLAYBACK.resume(null);

      expect(console.log).toHaveBeenCalledWith('Unable to resume sound: playback object is null or undefined');
      expect(result).toBeNull();
    });

    it('should handle null playback object in playNext function', async () => {
      const result = await PLAYBACK.playNext(null, 'test-uri');

      expect(console.log).toHaveBeenCalledWith('Unable to play next sound: playback object is null or undefined');
      expect(result).toBeNull();
    });
  });
});