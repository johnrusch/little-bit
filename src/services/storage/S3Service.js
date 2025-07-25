import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";

class S3Service {
  constructor(config) {
    if (!config || !config.aws) {
      throw new Error('Invalid configuration provided to S3Service');
    }

    const { aws } = config;
    
    // Validate required config
    if (!aws.s3?.bucketName || !aws.cognito?.identityPoolId || !aws.region) {
      throw new Error('Missing required S3 configuration');
    }

    this.bucketName = aws.s3.bucketName;
    this.region = aws.s3.region || aws.region;
    this.identityPoolId = aws.cognito.identityPoolId;
    
    // Initialize S3 client with Cognito credentials
    this.s3Client = new S3Client({
      region: this.region,
      credentials: fromCognitoIdentityPool({
        clientConfig: { region: aws.cognito.region || aws.region },
        identityPoolId: this.identityPoolId
      })
    });
  }

  /**
   * Get a presigned URL for downloading a file
   * @param {string} key - The S3 key of the file
   * @param {number} expiresIn - URL expiration time in seconds (default: 3600)
   * @returns {Promise<string>} The presigned URL
   */
  async getPresignedUrl(key, expiresIn = 3600) {
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid key provided');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      console.error('Failed to generate presigned URL');
      throw new Error('Failed to generate presigned URL');
    }
  }

  /**
   * Get a presigned URL for uploading a file
   * @param {string} key - The S3 key for the file
   * @param {string} contentType - The content type of the file
   * @param {number} expiresIn - URL expiration time in seconds (default: 3600)
   * @returns {Promise<string>} The presigned upload URL
   */
  async getPresignedUploadUrl(key, contentType, expiresIn = 3600) {
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid key provided');
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      console.error('Failed to generate presigned upload URL');
      throw new Error('Failed to generate presigned upload URL');
    }
  }

  /**
   * Upload a file directly to S3 (used for React Native file uploads)
   * @param {string} key - The S3 key for the file
   * @param {Blob|Buffer|ReadableStream} body - The file content
   * @param {Object} options - Additional options (contentType, metadata, etc.)
   * @returns {Promise<Object>} Upload result
   */
  async upload(key, body, options = {}) {
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid key provided');
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: options.contentType,
        Metadata: options.metadata
      });

      const result = await this.s3Client.send(command);
      return {
        key,
        bucket: this.bucketName,
        ...result
      };
    } catch (error) {
      console.error('Failed to upload file');
      throw new Error('Failed to upload file');
    }
  }

  /**
   * Delete a file from S3
   * @param {string} key - The S3 key of the file to delete
   * @returns {Promise<void>}
   */
  async delete(key) {
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid key provided');
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      await this.s3Client.send(command);
    } catch (error) {
      console.error('Failed to delete file');
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Update credentials (useful when user logs in/out)
   * @param {Object} credentials - New credentials or credential provider
   */
  updateCredentials(credentials) {
    this.s3Client = new S3Client({
      region: this.region,
      credentials
    });
  }
}

export default S3Service;