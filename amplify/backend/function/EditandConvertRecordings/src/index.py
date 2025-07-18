import json
import os
import boto3
import time
import shutil
import re
import uuid
from urllib.parse import unquote_plus

SIGNED_URL_TIMEOUT = 60

def handler(event, context):
    """
    Simplified audio processing function for Lambda.
    
    This is a minimal implementation that establishes the processing pipeline
    without complex audio manipulation. For advanced audio processing 
    (compression, effects, etc.), migrate to ECS/Fargate in the future.
    """
    
    try:
        print(f"Processing event: {json.dumps(event, default=str)}")
        
        # Validate event structure
        if not validate_event_structure(event):
            raise ValueError("Invalid event structure - missing required S3 event data")
        
        # Extract and validate S3 event data
        s3_record = event['Records'][0]['s3']
        s3_source_bucket = s3_record['bucket']['name']
        s3_source_key = unquote_plus(s3_record['object']['key'])
        
        # Parse and validate S3 key components
        key_parts = parse_s3_key(s3_source_key)
        username = key_parts['username']
        s3_source_filename = key_parts['filename']
        s3_source_format = key_parts['format']
        s3_source_basename = key_parts['basename']
        
        print(f"Validated inputs - Bucket: {s3_source_bucket}, Key: {s3_source_key}")
        print(f"Parsed - Username: {username}, Filename: {s3_source_basename}")

        # Initialize S3 client with error handling
        s3_client = boto3.client('s3')
        
        # Check available disk space in /tmp
        check_disk_space()
        
        # Generate secure local file paths
        secure_session_id = str(uuid.uuid4())[:8]
        local_file_name = f'/tmp/{secure_session_id}_{s3_source_basename}.{s3_source_format}'
        
        # Download the audio file from S3 with retry logic
        download_file_s3_secure(s3_client, s3_source_bucket, s3_source_key, local_file_name)
        
        # Generate secure debug filenames with session ID
        debug_raw_filename = f"debug_01_raw_{secure_session_id}_{s3_source_basename}.{s3_source_format}"
        print(f"DEBUG: Saving raw uploaded file to debug/raw/{username}/{debug_raw_filename}")
        upload_file_s3_secure(s3_client, local_file_name, s3_source_bucket, f"debug/raw/{username}/{debug_raw_filename}")
        
        # MINIMAL PROCESSING: For now, simply copy the file to processed directory
        # This establishes the pipeline structure for future ECS-based processing
        processed_filename = f"{s3_source_basename}_processed_{secure_session_id}.{s3_source_format}"
        processed_local_path = f"/tmp/{secure_session_id}_processed_{s3_source_basename}.{s3_source_format}"
        
        print(f"PROCESSING: Creating processed version (currently just a copy)")
        # Copy the file (placeholder for future audio processing)
        shutil.copy2(local_file_name, processed_local_path)
        
        # Upload to processed directory
        processed_s3_key = f"public/processed/{username}/{processed_filename}"
        print(f"UPLOAD: Saving processed file to {processed_s3_key}")
        upload_file_s3_secure(s3_client, processed_local_path, s3_source_bucket, processed_s3_key)
        
        # DEBUG: Save a copy to final debug directory
        debug_final_filename = f"debug_02_final_processed_{secure_session_id}_{s3_source_basename}.{s3_source_format}"
        print(f"DEBUG: Saving final processed file to debug/final/{username}/{debug_final_filename}")
        upload_file_s3_secure(s3_client, processed_local_path, s3_source_bucket, f"debug/final/{username}/{debug_final_filename}")
        
        # Clean up local files
        cleanup_local_files([local_file_name, processed_local_path])
        
        print("SUCCESS: Basic audio processing pipeline completed")
        print(f"- Original file: {s3_source_key}")
        print(f"- Processed file: {processed_s3_key}")
        print(f"- Debug files created in debug/ directories")
        print("NOTE: This is a minimal implementation. Migrate to ECS for advanced audio processing.")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Audio processing completed successfully',
                'original_file': s3_source_key,
                'processed_file': processed_s3_key,
                'processing_type': 'basic_copy',
                'session_id': secure_session_id,
                'note': 'Minimal processing implementation - upgrade to ECS for advanced features'
            })
        }
        
    except ValueError as e:
        # Input validation errors
        print(f"VALIDATION ERROR: {str(e)}")
        return {
            'statusCode': 400,
            'body': json.dumps({
                'error': 'Invalid input',
                'message': str(e)
            })
        }
        
    except Exception as e:
        # General processing errors
        print(f"PROCESSING ERROR: Audio processing failed: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Audio processing failed',
                'message': 'Internal processing error occurred'
            })
        }

def validate_event_structure(event):
    """Validate that the event has the required S3 structure."""
    try:
        if not isinstance(event, dict) or 'Records' not in event:
            return False
        
        records = event['Records']
        if not isinstance(records, list) or len(records) == 0:
            return False
            
        record = records[0]
        if not isinstance(record, dict):
            return False
            
        # Check for required S3 event structure
        required_keys = ['s3']
        if not all(key in record for key in required_keys):
            return False
            
        s3_data = record['s3']
        if not isinstance(s3_data, dict):
            return False
            
        # Check for required S3 nested structure
        s3_required = ['bucket', 'object']
        if not all(key in s3_data for key in s3_required):
            return False
            
        bucket = s3_data['bucket']
        obj = s3_data['object']
        
        if not isinstance(bucket, dict) or 'name' not in bucket:
            return False
            
        if not isinstance(obj, dict) or 'key' not in obj:
            return False
            
        return True
        
    except Exception as e:
        print(f"Event validation error: {str(e)}")
        return False

def parse_s3_key(s3_key):
    """Parse and validate S3 key format with security checks."""
    try:
        # Decode URL-encoded characters
        decoded_key = unquote_plus(s3_key)
        
        # Security: Check for path traversal attempts
        if '..' in decoded_key or decoded_key.startswith('/'):
            raise ValueError(f"Path traversal detected in S3 key: {decoded_key}")
        
        # Parse the key format: "public/unprocessed/{userID}/{filename}.{extension}"
        # or "unprocessed/{userID}/{filename}.{extension}"
        key_parts = decoded_key.split("/")
        
        # Handle both "public/unprocessed/..." and "unprocessed/..." formats
        start_index = 0
        if len(key_parts) >= 3 and key_parts[0] == "public" and key_parts[1] == "unprocessed":
            start_index = 2
        elif len(key_parts) >= 2 and key_parts[0] == "unprocessed":
            start_index = 1
        else:
            raise ValueError(f"Invalid S3 key format: {decoded_key}. Expected format: [public/]unprocessed/{{userID}}/{{filename}}")
        
        if len(key_parts) < start_index + 2:
            raise ValueError(f"Invalid S3 key format: {decoded_key}. Not enough path segments.")
        
        username = key_parts[start_index]
        filename_with_ext = key_parts[start_index + 1]
        
        # Security: Validate username and filename formats
        if not validate_username(username):
            raise ValueError(f"Invalid username format: {username}")
        
        if not validate_filename(filename_with_ext):
            raise ValueError(f"Invalid filename format: {filename_with_ext}")
        
        # Extract file extension
        basename, ext = os.path.splitext(filename_with_ext)
        file_format = ext[1:] if ext else ''  # Remove the dot
        
        return {
            'username': username,
            'filename': filename_with_ext,
            'basename': basename,
            'format': file_format,
            'full_key': decoded_key
        }
        
    except Exception as e:
        print(f"S3 key parsing error: {str(e)}")
        raise

def validate_username(username):
    """Validate username format for security."""
    if not username or len(username) > 128:
        return False
    
    # Allow alphanumeric, hyphens, underscores, and standard UUID format
    username_pattern = r'^[a-zA-Z0-9\-_]+$'
    return bool(re.match(username_pattern, username))

def validate_filename(filename):
    """Validate filename format for security."""
    if not filename or len(filename) > 255:
        return False
    
    # Allow alphanumeric, hyphens, underscores, dots, and common timestamp formats
    # This pattern covers typical audio file naming conventions
    filename_pattern = r'^[a-zA-Z0-9\-_\.\sT:Z]+\.[a-zA-Z0-9]+$'
    return bool(re.match(filename_pattern, filename))

def check_disk_space():
    """Check available disk space in /tmp directory."""
    try:
        statvfs = os.statvfs('/tmp')
        available_bytes = statvfs.f_frsize * statvfs.f_bavail
        available_mb = available_bytes / (1024 * 1024)
        
        # Require at least 100MB free space for audio processing
        if available_mb < 100:
            raise RuntimeError(f"Insufficient disk space: {available_mb:.1f}MB available, need at least 100MB")
        
        print(f"Disk space check: {available_mb:.1f}MB available")
        
    except Exception as e:
        print(f"Warning: Could not check disk space: {str(e)}")

def download_file_s3_secure(client, bucket, s3_path, local_path, retries=3):
    """Download file from S3 with secure error handling and retry logic."""
    for attempt in range(retries + 1):
        try:
            print(f"Downloading {s3_path} (attempt {attempt + 1}/{retries + 1})")
            client.download_file(bucket, s3_path, local_path)
            
            # Verify file was downloaded successfully
            if not os.path.exists(local_path) or os.path.getsize(local_path) == 0:
                raise RuntimeError("Downloaded file is empty or does not exist")
            
            print(f"Successfully downloaded {s3_path} ({os.path.getsize(local_path)} bytes)")
            return
            
        except Exception as e:
            print(f"Download attempt {attempt + 1} failed: {str(e)}")
            
            if attempt < retries:
                sleep_time = 2 ** attempt  # Exponential backoff
                print(f"Retrying in {sleep_time} seconds...")
                time.sleep(sleep_time)
            else:
                raise RuntimeError(f"Failed to download {s3_path} after {retries + 1} attempts: {str(e)}")

def upload_file_s3_secure(client, local_path, bucket, s3_path, retries=3):
    """Upload file to S3 with secure error handling and retry logic."""
    for attempt in range(retries + 1):
        try:
            # Verify local file exists before upload
            if not os.path.exists(local_path):
                raise RuntimeError(f"Local file does not exist: {local_path}")
            
            file_size = os.path.getsize(local_path)
            if file_size == 0:
                raise RuntimeError(f"Local file is empty: {local_path}")
            
            print(f"Uploading {local_path} to {s3_path} (attempt {attempt + 1}/{retries + 1}, {file_size} bytes)")
            client.upload_file(local_path, bucket, s3_path)
            print(f"Successfully uploaded to {s3_path}")
            return
            
        except Exception as e:
            print(f"Upload attempt {attempt + 1} failed: {str(e)}")
            
            if attempt < retries:
                sleep_time = 2 ** attempt  # Exponential backoff
                print(f"Retrying in {sleep_time} seconds...")
                time.sleep(sleep_time)
            else:
                raise RuntimeError(f"Failed to upload to {s3_path} after {retries + 1} attempts: {str(e)}")

def cleanup_local_files(file_paths):
    """Safely clean up local temporary files."""
    for file_path in file_paths:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"Cleaned up temporary file: {file_path}")
        except Exception as e:
            print(f"Warning: Could not clean up file {file_path}: {str(e)}")