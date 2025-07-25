/**
 * AWS Exports configuration provider
 * Provides backward compatibility with existing aws-exports.js file
 */

/**
 * Convert aws-exports.js format to new configuration format
 * @param {Object} awsExports - The aws-exports configuration object
 * @returns {Object} Configuration in new format
 */
export const convertAwsExports = (awsExports) => {
  if (!awsExports) return {};

  // Determine environment from the bucket name or endpoint
  let environment = 'development';
  if (awsExports.aws_user_files_s3_bucket?.includes('-prod-') ||
      awsExports.aws_appsync_graphqlEndpoint?.includes('prod')) {
    environment = 'production';
  } else if (awsExports.aws_user_files_s3_bucket?.includes('-staging-') ||
             awsExports.aws_appsync_graphqlEndpoint?.includes('staging')) {
    environment = 'staging';
  }

  const config = {
    environment,
    aws: {
      region: awsExports.aws_project_region || awsExports.aws_cognito_region,
      cognito: {
        userPoolId: awsExports.aws_user_pools_id,
        clientId: awsExports.aws_user_pools_web_client_id,
        identityPoolId: awsExports.aws_cognito_identity_pool_id,
        region: awsExports.aws_cognito_region
      },
      s3: {
        bucketName: awsExports.aws_user_files_s3_bucket,
        region: awsExports.aws_user_files_s3_bucket_region
      },
      appsync: {
        endpoint: awsExports.aws_appsync_graphqlEndpoint,
        region: awsExports.aws_appsync_region,
        authenticationType: awsExports.aws_appsync_authenticationType,
        apiKey: awsExports.aws_appsync_apiKey
      }
    },
    api: {
      baseUrl: awsExports.aws_appsync_graphqlEndpoint || 'https://api.littlebit.app',
      timeout: 30000
    },
    features: {
      audioProcessing: true,
      socialSharing: false,
      analytics: awsExports.aws_mobile_analytics_app_id ? true : false
    }
  };

  // Add optional SQS configuration
  if (awsExports.aws_sqs_queue_url) {
    config.aws.sqsQueueUrl = awsExports.aws_sqs_queue_url;
  }

  return config;
};

/**
 * Load configuration from aws-exports.js file
 * @returns {Object|null} Configuration object or null if not found
 */
export const loadFromAwsExports = () => {
  try {
    // Try to import aws-exports.js
    const awsExports = require('../../aws-exports').default;
    
    // Check if it's a valid configuration (not placeholder)
    if (awsExports.aws_user_pools_id && 
        awsExports.aws_user_pools_id !== 'placeholder' &&
        awsExports.aws_user_files_s3_bucket && 
        awsExports.aws_user_files_s3_bucket !== 'placeholder') {
      
      return convertAwsExports(awsExports);
    }
    
    console.log('aws-exports.js contains placeholder values, skipping...');
    return null;
  } catch (error) {
    // aws-exports.js doesn't exist or failed to load
    console.log('aws-exports.js not found or failed to load:', error.message);
    return null;
  }
};