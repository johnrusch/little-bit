/**
 * Configuration Manager
 * Handles loading, merging, and validating configuration from multiple sources
 */

import { deepMerge, removeUndefined } from './utils/merge';
import { validateConfig } from './utils/validation';
import { loadFromEnv } from './providers/env';
import { loadDefaults } from './providers/defaults';
import { loadFromAwsExports } from './providers/awsExports';

class ConfigManager {
  static instance = null;
  static isLoading = false;
  static loadPromise = null;

  /**
   * Load and validate configuration
   * @param {Object} options - Configuration options
   * @param {boolean} options.useAwsExports - Whether to try loading from aws-exports.js
   * @param {string} options.environment - Override environment
   * @returns {Promise<Object>} The validated configuration
   */
  static async load(options = {}) {
    // Return existing instance if already loaded
    if (this.instance) {
      return this.instance;
    }

    // Prevent concurrent loading
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    this.isLoading = true;
    this.loadPromise = this._loadInternal(options);

    try {
      this.instance = await this.loadPromise;
      return this.instance;
    } finally {
      this.isLoading = false;
      this.loadPromise = null;
    }
  }

  /**
   * Internal load method
   * @private
   */
  static async _loadInternal(options) {
    const { 
      useAwsExports = true, 
      environment = process.env.APP_ENV || process.env.NODE_ENV || 'development' 
    } = options;

    try {
      // Load configuration from all sources
      const configs = await this.buildConfig({ useAwsExports, environment });
      
      // Validate the merged configuration
      const validatedConfig = this.validate(configs);
      
      console.log('✅ Configuration loaded successfully');
      console.log(`Environment: ${validatedConfig.environment}`);
      
      return validatedConfig;
    } catch (error) {
      console.error('❌ Failed to load configuration:', error.message);
      throw error;
    }
  }

  /**
   * Build configuration by merging all sources
   * @private
   */
  static async buildConfig({ useAwsExports, environment }) {
    const sources = [];

    // 1. Load defaults (lowest priority)
    const defaults = loadDefaults(environment);
    sources.push(defaults);

    // 2. Load from aws-exports.js if enabled
    if (useAwsExports) {
      const awsExportsConfig = loadFromAwsExports();
      if (awsExportsConfig) {
        sources.push(awsExportsConfig);
      }
    }

    // 3. Load from environment variables (highest priority)
    const envConfig = loadFromEnv();
    sources.push(envConfig);

    // Merge all sources
    const merged = deepMerge(...sources);
    
    // Remove undefined values
    return removeUndefined(merged);
  }

  /**
   * Validate configuration
   * @private
   */
  static validate(config) {
    const { valid, errors } = validateConfig(config);
    
    if (!valid) {
      const errorMessage = 'Configuration validation failed:\n' + errors.join('\n');
      throw new Error(errorMessage);
    }
    
    return config;
  }

  /**
   * Get current configuration
   * @returns {Object|null} The current configuration or null if not loaded
   */
  static getConfig() {
    return this.instance;
  }

  /**
   * Reset configuration (useful for testing)
   */
  static reset() {
    this.instance = null;
    this.isLoading = false;
    this.loadPromise = null;
  }

  /**
   * Convert configuration to Amplify format for backward compatibility
   * @param {Object} config - The configuration object
   * @returns {Object} Amplify-compatible configuration
   */
  static toAmplifyFormat(config) {
    if (!config) return null;

    return {
      aws_project_region: config.aws.region,
      aws_cognito_identity_pool_id: config.aws.cognito.identityPoolId,
      aws_cognito_region: config.aws.cognito.region,
      aws_user_pools_id: config.aws.cognito.userPoolId,
      aws_user_pools_web_client_id: config.aws.cognito.clientId,
      aws_appsync_graphqlEndpoint: config.aws.appsync.endpoint,
      aws_appsync_region: config.aws.appsync.region,
      aws_appsync_authenticationType: config.aws.appsync.authenticationType,
      aws_appsync_apiKey: config.aws.appsync.apiKey,
      aws_user_files_s3_bucket: config.aws.s3.bucketName,
      aws_user_files_s3_bucket_region: config.aws.s3.region,
      aws_mobile_analytics_app_region: config.aws.region,
      aws_sqs_queue_url: config.aws.sqsQueueUrl
    };
  }
}

export default ConfigManager;