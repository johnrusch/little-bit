/**
 * Configuration validation utilities
 */

/**
 * Validates AWS region format
 * @param {string} region
 * @returns {boolean}
 */
export const isValidAwsRegion = (region) => {
  const regionRegex = /^[a-z]{2}-[a-z]+-\d$/;
  return typeof region === 'string' && regionRegex.test(region);
};

/**
 * Validates UUID format (for Cognito IDs)
 * @param {string} uuid
 * @returns {boolean}
 */
export const isValidUuid = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return typeof uuid === 'string' && uuidRegex.test(uuid);
};

/**
 * Validates URL format
 * @param {string} url
 * @returns {boolean}
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates S3 bucket name
 * @param {string} bucketName
 * @returns {boolean}
 */
export const isValidS3BucketName = (bucketName) => {
  const bucketRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
  return typeof bucketName === 'string' && 
         bucketName.length >= 3 && 
         bucketName.length <= 63 &&
         bucketRegex.test(bucketName);
};

/**
 * Validates Cognito User Pool ID format
 * @param {string} userPoolId
 * @returns {boolean}
 */
export const isValidUserPoolId = (userPoolId) => {
  const userPoolRegex = /^[a-z]{2}-[a-z]+-\d_[a-zA-Z0-9]+$/;
  return typeof userPoolId === 'string' && userPoolRegex.test(userPoolId);
};

/**
 * Validates environment value
 * @param {string} env
 * @returns {boolean}
 */
export const isValidEnvironment = (env) => {
  return ['development', 'staging', 'production'].includes(env);
};

/**
 * Validates the entire configuration object
 * @param {Object} config
 * @returns {{valid: boolean, errors: string[]}}
 */
export const validateConfig = (config) => {
  const errors = [];

  // Check required fields exist
  if (!config || typeof config !== 'object') {
    errors.push('Configuration must be an object');
    return { valid: false, errors };
  }

  // Validate environment
  if (!isValidEnvironment(config.environment)) {
    errors.push(`Invalid environment: ${config.environment}`);
  }

  // Validate AWS config
  if (!config.aws) {
    errors.push('AWS configuration is required');
  } else {
    if (!isValidAwsRegion(config.aws.region)) {
      errors.push(`Invalid AWS region: ${config.aws.region}`);
    }

    // Validate Cognito
    if (!config.aws.cognito) {
      errors.push('Cognito configuration is required');
    } else {
      if (!isValidUserPoolId(config.aws.cognito.userPoolId)) {
        errors.push(`Invalid User Pool ID: ${config.aws.cognito.userPoolId}`);
      }
      if (!config.aws.cognito.clientId || config.aws.cognito.clientId.length < 1) {
        errors.push('Cognito Client ID is required');
      }
      if (!config.aws.cognito.identityPoolId) {
        errors.push('Cognito Identity Pool ID is required');
      }
    }

    // Validate S3
    if (!config.aws.s3) {
      errors.push('S3 configuration is required');
    } else {
      if (!isValidS3BucketName(config.aws.s3.bucketName)) {
        errors.push(`Invalid S3 bucket name: ${config.aws.s3.bucketName}`);
      }
    }

    // Validate AppSync
    if (!config.aws.appsync) {
      errors.push('AppSync configuration is required');
    } else {
      if (!isValidUrl(config.aws.appsync.endpoint)) {
        errors.push(`Invalid AppSync endpoint: ${config.aws.appsync.endpoint}`);
      }
      const validAuthTypes = ['API_KEY', 'AWS_IAM', 'AMAZON_COGNITO_USER_POOLS'];
      if (!validAuthTypes.includes(config.aws.appsync.authenticationType)) {
        errors.push(`Invalid authentication type: ${config.aws.appsync.authenticationType}`);
      }
    }
  }

  // Validate API config
  if (!config.api) {
    errors.push('API configuration is required');
  } else {
    if (!isValidUrl(config.api.baseUrl)) {
      errors.push(`Invalid API base URL: ${config.api.baseUrl}`);
    }
    if (typeof config.api.timeout !== 'number' || config.api.timeout < 0) {
      errors.push('API timeout must be a positive number');
    }
  }

  // Validate features
  if (!config.features) {
    errors.push('Features configuration is required');
  } else {
    const booleanFeatures = ['audioProcessing', 'socialSharing', 'analytics'];
    booleanFeatures.forEach(feature => {
      if (typeof config.features[feature] !== 'boolean') {
        errors.push(`Feature ${feature} must be a boolean`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
};