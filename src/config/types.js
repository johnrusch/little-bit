/**
 * Configuration type definitions for the application
 * @typedef {Object} AppConfig
 * @property {'development' | 'staging' | 'production'} environment
 * @property {AwsConfig} aws
 * @property {ApiConfig} api
 * @property {FeaturesConfig} features
 */

/**
 * AWS services configuration
 * @typedef {Object} AwsConfig
 * @property {string} region
 * @property {CognitoConfig} cognito
 * @property {S3Config} s3
 * @property {AppSyncConfig} appsync
 * @property {string} [sqsQueueUrl]
 */

/**
 * Cognito configuration
 * @typedef {Object} CognitoConfig
 * @property {string} userPoolId
 * @property {string} clientId
 * @property {string} identityPoolId
 * @property {string} region
 */

/**
 * S3 configuration
 * @typedef {Object} S3Config
 * @property {string} bucketName
 * @property {string} region
 */

/**
 * AppSync configuration
 * @typedef {Object} AppSyncConfig
 * @property {string} endpoint
 * @property {string} region
 * @property {'API_KEY' | 'AWS_IAM' | 'AMAZON_COGNITO_USER_POOLS'} authenticationType
 * @property {string} [apiKey]
 */

/**
 * API configuration
 * @typedef {Object} ApiConfig
 * @property {string} baseUrl
 * @property {number} timeout
 */

/**
 * Feature flags configuration
 * @typedef {Object} FeaturesConfig
 * @property {boolean} audioProcessing
 * @property {boolean} socialSharing
 * @property {boolean} analytics
 */

export const CONFIG_ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production'
};

export const AUTH_TYPES = {
  API_KEY: 'API_KEY',
  AWS_IAM: 'AWS_IAM',
  COGNITO_USER_POOLS: 'AMAZON_COGNITO_USER_POOLS'
};