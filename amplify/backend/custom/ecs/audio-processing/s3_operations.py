#!/usr/bin/env python3
"""
S3 Operations Module for Little Bit Audio Processing Service
Handles secure S3 download/upload operations with retry logic and error handling.
"""

import os
import time
import logging
import random
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class S3OperationError(Exception):
    """Custom exception for S3 operation failures"""
    pass

class S3Operations:
    """
    Handles S3 operations for audio processing with robust error handling and retry logic.
    """
    
    def __init__(self, region_name: Optional[str] = None):
        """Initialize S3 client with optional region configuration."""
        try:
            self.region_name = region_name or os.environ.get('AWS_DEFAULT_REGION', 'us-east-1')
            self.s3_client = boto3.client('s3', region_name=self.region_name)
            logger.info(f"S3 client initialized for region: {self.region_name}")
        except NoCredentialsError as e:
            logger.error("AWS credentials not found")
            raise S3OperationError("AWS credentials configuration error") from e
        except Exception as e:
            logger.error(f"Failed to initialize S3 client: {str(e)}")
            raise S3OperationError("S3 client initialization failed") from e
    
    def download_file(self, bucket: str, key: str, local_path: str, max_retries: int = 3) -> bool:
        """
        Download file from S3 with exponential backoff retry logic.
        
        Args:
            bucket: S3 bucket name
            key: S3 object key
            local_path: Local file path for download
            max_retries: Maximum number of retry attempts
            
        Returns:
            bool: True if download successful, False otherwise
            
        Raises:
            S3OperationError: If download fails after all retries
        """
        if not bucket or not key or not local_path:
            raise S3OperationError("Missing required parameters for S3 download")
        
        # Validate and sanitize the S3 key to prevent path traversal
        normalized_key = os.path.normpath(key).replace('\\', '/')
        if (
            '..' in normalized_key or 
            normalized_key.startswith('/') or 
            normalized_key.startswith('../') or
            '/..' in normalized_key or
            '%2e%2e' in key.lower() or
            '%2f' in key.lower() or
            key != normalized_key or
            len(key) > 1024  # Reasonable key length limit
        ):
            raise S3OperationError(f"Invalid S3 key: path traversal or invalid characters detected: {key[:100]}...")
        
        logger.info(f"Starting download: s3://{bucket}/{key} -> {local_path}")
        
        # Ensure local directory exists
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        
        for attempt in range(max_retries + 1):
            try:
                # Check if file exists in S3 first
                self.s3_client.head_object(Bucket=bucket, Key=key)
                
                # Download the file
                self.s3_client.download_file(bucket, key, local_path)
                
                # Verify the download by checking file size
                if os.path.exists(local_path) and os.path.getsize(local_path) > 0:
                    logger.info(f"Successfully downloaded file: {local_path} ({os.path.getsize(local_path)} bytes)")
                    return True
                else:
                    raise S3OperationError("Downloaded file is empty or missing")
                    
            except ClientError as e:
                error_code = e.response['Error']['Code']
                if error_code == 'NoSuchKey':
                    raise S3OperationError(f"S3 object not found: s3://{bucket}/{key}")
                elif error_code == 'NoSuchBucket':
                    raise S3OperationError(f"S3 bucket not found: {bucket}")
                elif error_code == 'AccessDenied':
                    raise S3OperationError(f"Access denied to S3 object: s3://{bucket}/{key}")
                else:
                    logger.warning(f"Download attempt {attempt + 1} failed: {str(e)}")
                    
            except Exception as e:
                logger.warning(f"Download attempt {attempt + 1} failed: {str(e)}")
            
            # Exponential backoff with jitter for retries
            if attempt < max_retries:
                base_sleep = 2 ** attempt
                # Add random jitter (0-25% of base sleep time) to prevent thundering herd
                jitter = base_sleep * 0.25 * (0.5 - random.random())
                sleep_time = base_sleep + jitter
                logger.info(f"Retrying download in {sleep_time:.2f} seconds...")
                time.sleep(sleep_time)
        
        raise S3OperationError(f"Failed to download after {max_retries + 1} attempts")
    
    def upload_file(self, local_path: str, bucket: str, key: str, metadata: Optional[Dict[str, str]] = None) -> bool:
        """
        Upload file to S3 with metadata and validation.
        
        Args:
            local_path: Local file path to upload
            bucket: S3 bucket name
            key: S3 object key
            metadata: Optional metadata dictionary
            
        Returns:
            bool: True if upload successful, False otherwise
            
        Raises:
            S3OperationError: If upload fails
        """
        if not local_path or not bucket or not key:
            raise S3OperationError("Missing required parameters for S3 upload")
        
        if not os.path.exists(local_path):
            raise S3OperationError(f"Local file not found: {local_path}")
        
        if os.path.getsize(local_path) == 0:
            raise S3OperationError("Cannot upload empty file")
        
        # Validate and sanitize the S3 key
        normalized_key = os.path.normpath(key).replace('\\', '/')
        if (
            '..' in normalized_key or 
            normalized_key.startswith('/') or 
            normalized_key.startswith('../') or
            '/..' in normalized_key or
            '%2e%2e' in key.lower() or
            '%2f' in key.lower() or
            key != normalized_key or
            len(key) > 1024  # Reasonable key length limit
        ):
            raise S3OperationError(f"Invalid S3 key: path traversal or invalid characters detected: {key[:100]}...")
        
        logger.info(f"Starting upload: {local_path} -> s3://{bucket}/{key}")
        
        try:
            extra_args = {}
            if metadata:
                # Sanitize metadata keys and values with strict validation
                sanitized_metadata = {}
                for k, v in metadata.items():
                    if isinstance(k, str) and isinstance(v, str) and len(k) <= 100 and len(v) <= 1000:
                        # Strict sanitization for metadata keys (alphanumeric, hyphens, underscores only)
                        clean_key = ''.join(c for c in k if c.isalnum() or c in '-_').lower()
                        # Strict sanitization for metadata values (remove control characters and special chars)
                        clean_value = ''.join(c for c in v if c.isprintable() and c not in '<>"&\\').strip()[:1000]
                        if clean_key and clean_value and len(clean_key) <= 50:
                            sanitized_metadata[clean_key] = clean_value
                extra_args['Metadata'] = sanitized_metadata
            
            # Upload the file
            self.s3_client.upload_file(local_path, bucket, key, ExtraArgs=extra_args)
            
            # Verify upload by checking if object exists
            self.s3_client.head_object(Bucket=bucket, Key=key)
            
            file_size = os.path.getsize(local_path)
            logger.info(f"Successfully uploaded file: s3://{bucket}/{key} ({file_size} bytes)")
            return True
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'NoSuchBucket':
                raise S3OperationError(f"S3 bucket not found: {bucket}")
            elif error_code == 'AccessDenied':
                raise S3OperationError(f"Access denied to S3 bucket: {bucket}")
            else:
                raise S3OperationError(f"S3 upload failed: {str(e)}")
        except Exception as e:
            raise S3OperationError(f"Upload failed: {str(e)}")
    
    def get_file_metadata(self, bucket: str, key: str) -> Dict[str, Any]:
        """
        Get metadata for an S3 object.
        
        Args:
            bucket: S3 bucket name
            key: S3 object key
            
        Returns:
            Dict containing object metadata
            
        Raises:
            S3OperationError: If metadata retrieval fails
        """
        try:
            response = self.s3_client.head_object(Bucket=bucket, Key=key)
            return {
                'content_length': response.get('ContentLength', 0),
                'last_modified': response.get('LastModified'),
                'content_type': response.get('ContentType'),
                'metadata': response.get('Metadata', {}),
                'etag': response.get('ETag', '').strip('"')
            }
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'NoSuchKey':
                raise S3OperationError(f"S3 object not found: s3://{bucket}/{key}")
            else:
                raise S3OperationError(f"Failed to get metadata: {str(e)}")
    
    def cleanup_temp_files(self, file_paths: list) -> None:
        """
        Clean up temporary files safely.
        
        Args:
            file_paths: List of file paths to delete
        """
        for file_path in file_paths:
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
                    logger.info(f"Cleaned up temporary file: {file_path}")
            except Exception as e:
                logger.warning(f"Failed to clean up file {file_path}: {str(e)}")