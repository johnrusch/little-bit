#!/usr/bin/env python3
"""
Little Bit Audio Processing Service - ECS Container
Phase 2: Complete Audio Processing Implementation

Implements PyDub-based audio processing with intelligent one-shot creation,
configurable silence detection, and comprehensive error handling.
"""

import os
import sys
import json
import time
import uuid
import tempfile
import shutil
import threading
from typing import Dict, Any, List
from pathlib import Path

# Import local modules with error handling
try:
    from s3_operations import S3Operations, S3OperationError
    from utils.logging_config import setup_logging, create_session_logger, log_performance_metrics
    from utils.error_handlers import (
        ProcessingError, ConfigurationError, NetworkError, StorageError, 
        AudioProcessingError, ValidationError, ResourceError,
        ErrorRecovery, create_error_response, log_error_metrics,
        retry_with_exponential_backoff, safe_execute
    )
    from utils.audio_utils import AudioProcessor, create_processing_config
    from utils.input_validation import InputValidator
    # Import PyDub components for audio processing
    from pydub import AudioSegment
    from pydub.silence import split_on_silence
except ImportError as e:
    print(f"CRITICAL: Failed to import required modules: {str(e)}", file=sys.stderr)
    print("NOTE: This is expected in environments without audio processing dependencies", file=sys.stderr)
    sys.exit(1)

# Global logger will be configured in main()
logger = None

class AudioProcessingService:
    """
    Main service class for ECS-based audio processing.
    """
    
    def __init__(self, session_id: str = None):
        """Initialize the audio processing service."""
        self.session_id = session_id or str(uuid.uuid4())
        self.temp_files = []
        self.s3_ops = None
        self.audio_processor = None
        self._cleanup_done = False
        self._cleanup_lock = threading.Lock()
        
    def initialize(self) -> None:
        """Initialize service components with error handling."""
        try:
            # Validate environment
            ErrorRecovery.validate_environment()
            
            # Check disk space
            if not ErrorRecovery.check_disk_space(100):
                raise ResourceError("Insufficient disk space for processing")
            
            # Initialize S3 operations
            region = os.environ.get('AWS_DEFAULT_REGION', 'us-east-1')
            self.s3_ops = S3Operations(region_name=region)
            
            # Initialize audio processor with configuration
            config = create_processing_config(dict(os.environ))
            self.audio_processor = AudioProcessor(config)
            
            logger.info("Service initialization completed", extra={'session_id': self.session_id})
            
        except Exception as e:
            error_context = {'session_id': self.session_id, 'operation': 'initialization'}
            processing_error = ProcessingError(f"Service initialization failed: {str(e)}")
            log_error_metrics(processing_error, logger, self.session_id, 'initialization')
            raise processing_error
    
    @retry_with_exponential_backoff(max_retries=3, base_delay=1.0)
    def download_source_file(self, bucket: str, key: str) -> str:
        """Download source audio file from S3 with retry logic."""
        try:
            # Create secure temporary file
            temp_dir = tempfile.mkdtemp(prefix='audio_processing_')
            filename = os.path.basename(key)
            local_path = os.path.join(temp_dir, filename)
            
            # Track temporary file for cleanup
            self.temp_files.append(local_path)
            self.temp_files.append(temp_dir)
            
            logger.info(f"Downloading source file: s3://{bucket}/{key}", 
                       extra={'session_id': self.session_id, 's3_key': key})
            
            # Download with validation
            success = self.s3_ops.download_file(bucket, key, local_path)
            
            if not success:
                raise StorageError(f"Failed to download file: s3://{bucket}/{key}")
            
            # Validate file size
            file_size = os.path.getsize(local_path)
            if file_size == 0:
                raise ValidationError("Downloaded file is empty")
            
            if file_size > 100 * 1024 * 1024:  # 100MB limit
                raise ValidationError(f"File too large: {file_size} bytes")
            
            logger.info(f"File downloaded successfully: {file_size} bytes", 
                       extra={'session_id': self.session_id, 'file_size': file_size})
            
            return local_path
            
        except Exception as e:
            if isinstance(e, ProcessingError):
                raise
            else:
                raise StorageError(f"Download failed: {str(e)}")
    
    def process_audio(self, input_path: str, user_id: str, 
                     original_filename: str) -> List[Dict[str, Any]]:
        """Process audio file and create one-shots."""
        try:
            start_time = time.time()
            
            # Create output directory
            output_dir = tempfile.mkdtemp(prefix='audio_output_')
            self.temp_files.append(output_dir)
            
            # Extract base filename without extension
            base_filename = os.path.splitext(original_filename)[0]
            
            logger.info(f"Starting audio processing: {original_filename}", 
                       extra={'session_id': self.session_id, 'user_id': user_id})
            
            # Process audio using audio utilities
            processing_results = self.audio_processor.process_audio_file(
                input_path, output_dir, base_filename
            )
            
            processing_time = time.time() - start_time
            file_size = os.path.getsize(input_path)
            
            # Log performance metrics
            log_performance_metrics(
                logger, 'audio_processing', processing_time, file_size,
                session_id=self.session_id, user_id=user_id,
                chunks_created=len(processing_results)
            )
            
            logger.info(f"Audio processing completed: {len(processing_results)} files created", 
                       extra={'session_id': self.session_id, 'processing_time': processing_time})
            
            return processing_results
            
        except Exception as e:
            if isinstance(e, ProcessingError):
                raise
            else:
                raise AudioProcessingError(f"Audio processing failed: {str(e)}")
    
    @retry_with_exponential_backoff(max_retries=3, base_delay=1.0)
    def upload_processed_files(self, processing_results: List[Dict[str, Any]], 
                              bucket: str, user_id: str) -> List[Dict[str, Any]]:
        """Upload processed audio files to S3."""
        try:
            upload_results = []
            
            for result in processing_results:
                try:
                    local_path = result['path']
                    filename = result['filename']
                    
                    # Construct S3 key for processed files
                    s3_key = f"public/processed/{user_id}/{filename}"
                    
                    # Create metadata for the file
                    metadata = {
                        'session-id': self.session_id,
                        'user-id': user_id,
                        'processing-version': '2.0',
                        'chunk-index': str(result.get('chunk_index', -1)),
                        'duration-seconds': str(result.get('duration_seconds', 0)),
                        'format': result.get('format', 'unknown')
                    }
                    
                    logger.info(f"Uploading processed file: {filename}", 
                               extra={'session_id': self.session_id, 's3_key': s3_key})
                    
                    # Upload file with metadata
                    success = self.s3_ops.upload_file(local_path, bucket, s3_key, metadata)
                    
                    if success:
                        upload_result = {
                            **result,
                            's3_key': s3_key,
                            's3_bucket': bucket,
                            'upload_success': True
                        }
                        upload_results.append(upload_result)
                        
                        logger.info(f"File uploaded successfully: s3://{bucket}/{s3_key}")
                    else:
                        raise StorageError(f"Failed to upload file: {filename}")
                        
                except Exception as e:
                    logger.error(f"Failed to upload file {result.get('filename', 'unknown')}: {str(e)}")
                    # Continue with other files
                    upload_result = {
                        **result,
                        'upload_success': False,
                        'upload_error': str(e)
                    }
                    upload_results.append(upload_result)
            
            successful_uploads = sum(1 for r in upload_results if r.get('upload_success', False))
            logger.info(f"Upload completed: {successful_uploads}/{len(upload_results)} files successful")
            
            return upload_results
            
        except Exception as e:
            if isinstance(e, ProcessingError):
                raise
            else:
                raise StorageError(f"Upload process failed: {str(e)}")
    
    def cleanup(self) -> None:
        """Clean up temporary files and resources with race condition protection."""
        with self._cleanup_lock:
            if self._cleanup_done:
                logger.debug("Cleanup already completed, skipping")
                return
            
            if self.temp_files:
                logger.info(f"Cleaning up {len(self.temp_files)} temporary files")
                ErrorRecovery.cleanup_temp_files(self.temp_files)
                self.temp_files.clear()
            
            self._cleanup_done = True
            logger.debug("Cleanup completed successfully")
    
    def process_request(self) -> Dict[str, Any]:
        """Main processing workflow for a single request."""
        start_time = time.time()
        
        try:
            # Validate and extract parameters from environment
            env_vars = InputValidator.validate_environment_variables()
            bucket = env_vars['S3_BUCKET']
            source_key = env_vars['S3_KEY']
            user_id = env_vars['USER_ID']
            
            # Extract and validate original filename
            original_filename = os.path.basename(source_key)
            original_filename = InputValidator.validate_audio_filename(original_filename)
            
            logger.info(f"Processing request started", extra={
                'session_id': self.session_id,
                'user_id': user_id,
                's3_key': source_key,
                'bucket': bucket
            })
            
            # Initialize service
            self.initialize()
            
            # Download source file
            local_path = self.download_source_file(bucket, source_key)
            
            # Process audio
            processing_results = self.process_audio(local_path, user_id, original_filename)
            
            # Upload processed files
            upload_results = self.upload_processed_files(processing_results, bucket, user_id)
            
            # Calculate metrics
            total_time = time.time() - start_time
            successful_files = sum(1 for r in upload_results if r.get('upload_success', False))
            
            # Create success response
            response = {
                'statusCode': 200,
                'message': 'Audio processing completed successfully',
                'sessionId': self.session_id,
                'processingTime': round(total_time, 3),
                'filesCreated': len(upload_results),
                'filesUploaded': successful_files,
                'results': upload_results
            }
            
            logger.info(f"Processing request completed successfully", extra={
                'session_id': self.session_id,
                'total_time': total_time,
                'files_created': len(upload_results),
                'files_uploaded': successful_files
            })
            
            return response
            
        except ProcessingError as e:
            # Log structured error
            log_error_metrics(e, logger, self.session_id, 'process_request')
            return create_error_response(e, self.session_id)
            
        except Exception as e:
            # Handle unexpected errors
            processing_error = ProcessingError(f"Unexpected error: {str(e)}")
            log_error_metrics(processing_error, logger, self.session_id, 'process_request')
            return create_error_response(processing_error, self.session_id)
            
        finally:
            # Always clean up resources
            self.cleanup()

def main() -> Dict[str, Any]:
    """
    Main entry point for the audio processing container.
    """
    global logger
    
    try:
        # Set up logging
        log_level = os.environ.get('LOG_LEVEL', 'INFO')
        logger = setup_logging(log_level, 'audio-processing')
        
        logger.info("Little Bit Audio Processing Service - Phase 2 Implementation")
        logger.info("Starting audio processing workflow")
        
        # Create and run processing service
        service = AudioProcessingService()
        result = service.process_request()
        
        # Log final result
        status_code = result.get('statusCode', 500)
        if status_code == 200:
            logger.info("Audio processing service completed successfully", 
                       extra={'final_result': result})
        else:
            logger.error("Audio processing service failed", 
                        extra={'final_result': result})
        
        return result
        
    except Exception as e:
        error_msg = f"Critical service failure: {str(e)}"
        if logger:
            logger.critical(error_msg, exc_info=True)
        else:
            print(f"CRITICAL ERROR: {error_msg}", file=sys.stderr)
        
        return {
            'statusCode': 500,
            'message': error_msg,
            'error': {
                'category': 'critical',
                'recoverable': False
            }
        }

if __name__ == '__main__':
    try:
        result = main()
        status_code = result.get('statusCode', 500)
        
        if status_code == 200:
            print(json.dumps(result, indent=2))
            sys.exit(0)
        else:
            print(json.dumps(result, indent=2), file=sys.stderr)
            sys.exit(1)
            
    except Exception as e:
        error_response = {
            'statusCode': 500,
            'message': f"Container execution failed: {str(e)}"
        }
        print(json.dumps(error_response, indent=2), file=sys.stderr)
        sys.exit(1)