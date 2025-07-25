import S3Service from './S3Service';

/**
 * Storage Adapter that provides Amplify Storage API compatibility
 * while using the new S3Service under the hood
 */
class StorageAdapter {
  constructor(config) {
    this.s3Service = new S3Service(config);
    this.config = config;
  }

  /**
   * Get URL for a file (Amplify Storage.get() replacement)
   * Matches the Amplify Storage API signature
   * @param {Object} params - Parameters object
   * @param {string} params.key - The S3 key
   * @param {Object} params.options - Additional options
   * @returns {Promise<Object>} Object with url property
   */
  async getUrl(params) {
    const { key, options = {} } = params;
    
    try {
      const url = await this.s3Service.getPresignedUrl(key, options.expiresIn || 3600);
      
      // Return in Amplify format
      return {
        url: {
          toString: () => url,
          href: url
        }
      };
    } catch (error) {
      // Wrap error to match Amplify error format
      throw new Error(`Failed to get URL: ${error.message}`);
    }
  }

  /**
   * Upload a file (Amplify Storage.put() replacement)
   * @param {Object} params - Parameters object
   * @param {string} params.key - The S3 key
   * @param {any} params.data - The file data
   * @param {Object} params.options - Additional options
   * @returns {Promise<Object>} Upload result
   */
  async put(params) {
    const { key, data, options = {} } = params;
    
    try {
      const result = await this.s3Service.upload(key, data, {
        contentType: options.contentType,
        metadata: options.metadata
      });
      
      // Return in Amplify format
      return {
        key: result.key
      };
    } catch (error) {
      throw new Error(`Failed to upload: ${error.message}`);
    }
  }

  /**
   * Remove a file (Amplify Storage.remove() replacement)
   * @param {Object} params - Parameters object
   * @param {string} params.key - The S3 key
   * @returns {Promise<Object>} Remove result
   */
  async remove(params) {
    const { key } = params;
    
    try {
      await this.s3Service.delete(key);
      
      // Return in Amplify format
      return {
        key
      };
    } catch (error) {
      throw new Error(`Failed to remove: ${error.message}`);
    }
  }

  /**
   * Get presigned upload URL
   * @param {Object} params - Parameters object
   * @param {string} params.key - The S3 key
   * @param {Object} params.options - Additional options
   * @returns {Promise<string>} The presigned upload URL
   */
  async getUploadUrl(params) {
    const { key, options = {} } = params;
    
    try {
      return await this.s3Service.getPresignedUploadUrl(
        key, 
        options.contentType || 'application/octet-stream',
        options.expiresIn || 3600
      );
    } catch (error) {
      throw new Error(`Failed to get upload URL: ${error.message}`);
    }
  }

  /**
   * Update credentials when auth state changes
   * @param {Object} credentials - New credentials
   */
  updateCredentials(credentials) {
    this.s3Service.updateCredentials(credentials);
  }
}

// Factory function to create storage adapter
export function createStorageAdapter(config) {
  return new StorageAdapter(config);
}

export default StorageAdapter;