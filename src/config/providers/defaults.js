/**
 * Default configuration values
 * These are the fallback values when no other configuration is provided
 */

/**
 * Get default configuration based on environment
 * @param {string} environment - The current environment
 * @returns {Object} Default configuration object
 */
export const loadDefaults = (environment = 'development') => {
  const baseConfig = {
    environment,
    aws: {
      region: 'us-west-2',
      cognito: {
        region: 'us-west-2'
      },
      s3: {
        region: 'us-west-2'
      },
      appsync: {
        region: 'us-west-2',
        authenticationType: 'AMAZON_COGNITO_USER_POOLS'
      }
    },
    api: {
      baseUrl: 'https://api.littlebit.app',
      timeout: 30000 // 30 seconds
    },
    features: {
      audioProcessing: true,
      socialSharing: false,
      analytics: false
    }
  };

  // Environment-specific defaults
  const environmentDefaults = {
    development: {
      api: {
        baseUrl: 'http://localhost:3000',
        timeout: 60000 // 60 seconds for development
      },
      features: {
        audioProcessing: true,
        socialSharing: true,
        analytics: false
      }
    },
    staging: {
      api: {
        baseUrl: 'https://staging-api.littlebit.app',
        timeout: 30000
      },
      features: {
        audioProcessing: true,
        socialSharing: true,
        analytics: true
      }
    },
    production: {
      api: {
        baseUrl: 'https://api.littlebit.app',
        timeout: 30000
      },
      features: {
        audioProcessing: true,
        socialSharing: true,
        analytics: true
      }
    }
  };

  // Merge base config with environment-specific defaults
  const envDefaults = environmentDefaults[environment] || {};
  
  return {
    ...baseConfig,
    ...envDefaults,
    aws: {
      ...baseConfig.aws,
      ...(envDefaults.aws || {})
    },
    api: {
      ...baseConfig.api,
      ...(envDefaults.api || {})
    },
    features: {
      ...baseConfig.features,
      ...(envDefaults.features || {})
    }
  };
};