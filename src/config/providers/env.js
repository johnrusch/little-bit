/**
 * Environment variable configuration provider
 * Maps environment variables to configuration structure
 */

/**
 * Load configuration from environment variables
 * @returns {Object} Partial configuration object
 */
export const loadFromEnv = () => {
  const config = {};

  // Environment
  if (process.env.APP_ENV) {
    config.environment = process.env.APP_ENV;
  }

  // AWS Configuration
  if (process.env.APP_AWS_REGION || process.env.AWS_DEFAULT_REGION) {
    config.aws = config.aws || {};
    config.aws.region = process.env.APP_AWS_REGION || process.env.AWS_DEFAULT_REGION;
  }

  // Cognito Configuration
  if (process.env.APP_COGNITO_USER_POOL_ID || 
      process.env.APP_COGNITO_CLIENT_ID || 
      process.env.APP_COGNITO_IDENTITY_POOL_ID) {
    config.aws = config.aws || {};
    config.aws.cognito = {
      userPoolId: process.env.APP_COGNITO_USER_POOL_ID,
      clientId: process.env.APP_COGNITO_CLIENT_ID,
      identityPoolId: process.env.APP_COGNITO_IDENTITY_POOL_ID,
      region: process.env.APP_COGNITO_REGION || config.aws?.region
    };
  }

  // S3 Configuration
  if (process.env.APP_S3_BUCKET_NAME) {
    config.aws = config.aws || {};
    config.aws.s3 = {
      bucketName: process.env.APP_S3_BUCKET_NAME,
      region: process.env.APP_S3_REGION || config.aws?.region
    };
  }

  // AppSync Configuration
  if (process.env.APP_APPSYNC_ENDPOINT || 
      process.env.APP_APPSYNC_AUTH_TYPE ||
      process.env.APP_APPSYNC_API_KEY) {
    config.aws = config.aws || {};
    config.aws.appsync = {
      endpoint: process.env.APP_APPSYNC_ENDPOINT,
      region: process.env.APP_APPSYNC_REGION || config.aws?.region,
      authenticationType: process.env.APP_APPSYNC_AUTH_TYPE || 'AMAZON_COGNITO_USER_POOLS',
      apiKey: process.env.APP_APPSYNC_API_KEY
    };
  }

  // SQS Configuration (optional)
  if (process.env.APP_SQS_QUEUE_URL) {
    config.aws = config.aws || {};
    config.aws.sqsQueueUrl = process.env.APP_SQS_QUEUE_URL;
  }

  // API Configuration
  if (process.env.APP_API_BASE_URL || process.env.APP_API_TIMEOUT) {
    config.api = {
      baseUrl: process.env.APP_API_BASE_URL,
      timeout: process.env.APP_API_TIMEOUT ? parseInt(process.env.APP_API_TIMEOUT, 10) : undefined
    };
  }

  // Features Configuration
  if (process.env.APP_FEATURE_AUDIO_PROCESSING !== undefined ||
      process.env.APP_FEATURE_SOCIAL_SHARING !== undefined ||
      process.env.APP_FEATURE_ANALYTICS !== undefined) {
    config.features = {
      audioProcessing: process.env.APP_FEATURE_AUDIO_PROCESSING === 'true',
      socialSharing: process.env.APP_FEATURE_SOCIAL_SHARING === 'true',
      analytics: process.env.APP_FEATURE_ANALYTICS === 'true'
    };
  }

  return config;
};

/**
 * Get environment variable name mapping for documentation
 * @returns {Object} Mapping of config paths to env var names
 */
export const getEnvVarMapping = () => {
  return {
    'environment': 'APP_ENV',
    'aws.region': 'APP_AWS_REGION or AWS_DEFAULT_REGION',
    'aws.cognito.userPoolId': 'APP_COGNITO_USER_POOL_ID',
    'aws.cognito.clientId': 'APP_COGNITO_CLIENT_ID',
    'aws.cognito.identityPoolId': 'APP_COGNITO_IDENTITY_POOL_ID',
    'aws.cognito.region': 'APP_COGNITO_REGION',
    'aws.s3.bucketName': 'APP_S3_BUCKET_NAME',
    'aws.s3.region': 'APP_S3_REGION',
    'aws.appsync.endpoint': 'APP_APPSYNC_ENDPOINT',
    'aws.appsync.region': 'APP_APPSYNC_REGION',
    'aws.appsync.authenticationType': 'APP_APPSYNC_AUTH_TYPE',
    'aws.appsync.apiKey': 'APP_APPSYNC_API_KEY',
    'aws.sqsQueueUrl': 'APP_SQS_QUEUE_URL',
    'api.baseUrl': 'APP_API_BASE_URL',
    'api.timeout': 'APP_API_TIMEOUT',
    'features.audioProcessing': 'APP_FEATURE_AUDIO_PROCESSING',
    'features.socialSharing': 'APP_FEATURE_SOCIAL_SHARING',
    'features.analytics': 'APP_FEATURE_ANALYTICS'
  };
};