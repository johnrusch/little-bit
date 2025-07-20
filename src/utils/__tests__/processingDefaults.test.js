import { 
  DEFAULT_PROCESSING_SETTINGS, 
  validateProcessingSettings, 
  formatProcessingMetadata,
  PROCESSING_CONSTANTS 
} from '../processingDefaults';

describe('processingDefaults', () => {
  describe('DEFAULT_PROCESSING_SETTINGS', () => {
    test('has expected default values', () => {
      expect(DEFAULT_PROCESSING_SETTINGS).toEqual({
        createOneShot: true,
        silenceThreshold: -30,
        minSilenceDuration: 750,
        autoDetectThreshold: false,
        preserveOriginal: true,
        outputFormat: 'original',
      });
    });
  });

  describe('validateProcessingSettings', () => {
    test('validates normal settings correctly', () => {
      const settings = {
        createOneShot: false,
        silenceThreshold: -25,
        minSilenceDuration: 1000,
        preserveOriginal: false,
      };

      const result = validateProcessingSettings(settings);

      expect(result.silenceThreshold).toBe(-25);
      expect(result.minSilenceDuration).toBe(1000);
      expect(result.createOneShot).toBe(false);
      expect(result.preserveOriginal).toBe(false);
    });

    test('clamps silence threshold to valid range', () => {
      const result1 = validateProcessingSettings({ silenceThreshold: -60 });
      expect(result1.silenceThreshold).toBe(-50);

      const result2 = validateProcessingSettings({ silenceThreshold: -10 });
      expect(result2.silenceThreshold).toBe(-20);
    });

    test('clamps min silence duration to valid range', () => {
      const result1 = validateProcessingSettings({ minSilenceDuration: 100 });
      expect(result1.minSilenceDuration).toBe(500);

      const result2 = validateProcessingSettings({ minSilenceDuration: 5000 });
      expect(result2.minSilenceDuration).toBe(2000);
    });

    test('handles non-numeric silence threshold', () => {
      const result1 = validateProcessingSettings({ silenceThreshold: 'invalid' });
      expect(result1.silenceThreshold).toBe(DEFAULT_PROCESSING_SETTINGS.silenceThreshold);

      const result2 = validateProcessingSettings({ silenceThreshold: NaN });
      expect(result2.silenceThreshold).toBe(DEFAULT_PROCESSING_SETTINGS.silenceThreshold);

      const result3 = validateProcessingSettings({ silenceThreshold: null });
      expect(result3.silenceThreshold).toBe(DEFAULT_PROCESSING_SETTINGS.silenceThreshold);
    });

    test('handles non-numeric min silence duration', () => {
      const result1 = validateProcessingSettings({ minSilenceDuration: 'invalid' });
      expect(result1.minSilenceDuration).toBe(DEFAULT_PROCESSING_SETTINGS.minSilenceDuration);

      const result2 = validateProcessingSettings({ minSilenceDuration: NaN });
      expect(result2.minSilenceDuration).toBe(DEFAULT_PROCESSING_SETTINGS.minSilenceDuration);

      const result3 = validateProcessingSettings({ minSilenceDuration: undefined });
      expect(result3.minSilenceDuration).toBe(DEFAULT_PROCESSING_SETTINGS.minSilenceDuration);
    });
  });

  describe('formatProcessingMetadata', () => {
    test('formats metadata correctly', () => {
      const settings = {
        createOneShot: true,
        silenceThreshold: -25,
        minSilenceDuration: 1000,
        preserveOriginal: false,
        autoDetectThreshold: true,
      };

      const result = formatProcessingMetadata(settings);

      expect(result).toEqual({
        'processing-enabled': 'true',
        'silence-threshold': '-25',
        'min-silence-duration': '1000',
        'preserve-original': 'false',
        'auto-detect-threshold': 'true',
        'processing-version': '1.0',
        'ui-version': '1.0',
      });
    });

    test('validates settings before formatting', () => {
      const settings = {
        createOneShot: true,
        silenceThreshold: -60, // Should be clamped to -50
        minSilenceDuration: 100, // Should be clamped to 500
      };

      const result = formatProcessingMetadata(settings);

      expect(result['silence-threshold']).toBe('-50');
      expect(result['min-silence-duration']).toBe('500');
    });
  });

  describe('PROCESSING_CONSTANTS', () => {
    test('has expected constant values', () => {
      expect(PROCESSING_CONSTANTS).toEqual({
        SILENCE_THRESHOLD_MIN: -50,
        SILENCE_THRESHOLD_MAX: -20,
        MIN_SILENCE_DURATION_MIN: 500,
        MIN_SILENCE_DURATION_MAX: 2000,
      });
    });
  });
});