export const DEFAULT_PROCESSING_SETTINGS = {
  createOneShot: true,                  
  silenceThreshold: -30,                
  minSilenceDuration: 750,              
  autoDetectThreshold: false,           
  preserveOriginal: true,               
  outputFormat: 'original',             
};

export const validateProcessingSettings = (settings) => {
  // Validate and sanitize numeric inputs
  const silenceThreshold = typeof settings.silenceThreshold === 'number' && !isNaN(settings.silenceThreshold) 
    ? settings.silenceThreshold 
    : DEFAULT_PROCESSING_SETTINGS.silenceThreshold;
    
  const minSilenceDuration = typeof settings.minSilenceDuration === 'number' && !isNaN(settings.minSilenceDuration)
    ? settings.minSilenceDuration
    : DEFAULT_PROCESSING_SETTINGS.minSilenceDuration;
  
  return {
    ...settings,
    silenceThreshold: Math.max(-50, Math.min(-20, silenceThreshold)),
    minSilenceDuration: Math.max(500, Math.min(2000, minSilenceDuration)),
  };
};

export const formatProcessingMetadata = (settings) => {
  const validatedSettings = validateProcessingSettings(settings);
  
  return {
    'processing-enabled': validatedSettings.createOneShot ? 'true' : 'false',
    'silence-threshold': Math.round(validatedSettings.silenceThreshold).toString(),
    'min-silence-duration': Math.round(validatedSettings.minSilenceDuration).toString(),
    'preserve-original': validatedSettings.preserveOriginal ? 'true' : 'false',
    'auto-detect-threshold': validatedSettings.autoDetectThreshold ? 'true' : 'false',
    'processing-version': '1.0',
    'ui-version': '1.0'
  };
};

export const PROCESSING_CONSTANTS = {
  SILENCE_THRESHOLD_MIN: -50,
  SILENCE_THRESHOLD_MAX: -20,
  MIN_SILENCE_DURATION_MIN: 500,
  MIN_SILENCE_DURATION_MAX: 2000,
};