import json
import os
import boto3
import time
import shutil

SIGNED_URL_TIMEOUT = 60

def handler(event, context):
    """
    Simplified audio processing function for Lambda.
    
    This is a minimal implementation that establishes the processing pipeline
    without complex audio manipulation. For advanced audio processing 
    (compression, effects, etc.), migrate to ECS/Fargate in the future.
    """
    
    print(event, 'THIS THE EVENT', context)

    s3_source_bucket = event['Records'][0]['s3']['bucket']['name']
    s3_source_key = event['Records'][0]['s3']['object']['key']
    folder = os.path.split(os.path.dirname(s3_source_key))[0]
    username = os.path.split(os.path.dirname(s3_source_key))[1]
    s3_source_filename = os.path.basename(s3_source_key)
    s3_source_format = os.path.splitext(s3_source_key)[1][1:]

    s3_source_basename = os.path.splitext(os.path.basename(s3_source_key))[0]
    print(s3_source_key, 'SOURCE KEY')
    print(folder, 'FOLDER')
    print(username, 'USERNAME')

    s3_client = boto3.client('s3')
    local_file_name = f'/tmp/{s3_source_filename}'
    
    def download_file_s3(client, bucket, s3_path, local_path, retries=10):
        i = 0
        sleep = 2
        while i <= retries:
            try:
                client.download_file(bucket, s3_path, local_path)
                break
            except Exception as e:            
                print(f"File download failed: {e}")
                i = i + 1
                if i > retries:
                    raise Exception(f"Failed to download after {retries} retries")
                time.sleep(sleep)
                sleep = sleep * 2
                print("retry: " + str(i))
    
    try:
        # Download the audio file from S3
        download_file_s3(s3_client, s3_source_bucket, s3_source_key, local_file_name)
        
        # DEBUG: Save raw uploaded file to debug directory for quality tracking
        debug_raw_filename = f"debug_01_raw_{s3_source_filename}"
        print(f"DEBUG: Saving raw uploaded file to debug/raw/{username}/{debug_raw_filename}")
        s3_client.upload_file(local_file_name, s3_source_bucket, f"debug/raw/{username}/{debug_raw_filename}")
        
        # MINIMAL PROCESSING: For now, simply copy the file to processed directory
        # This establishes the pipeline structure for future ECS-based processing
        processed_filename = f"{s3_source_basename}_processed.{s3_source_format}"
        processed_local_path = f"/tmp/{processed_filename}"
        
        print(f"PROCESSING: Creating processed version (currently just a copy)")
        # Copy the file (placeholder for future audio processing)
        shutil.copy2(local_file_name, processed_local_path)
        
        # Upload to processed directory
        processed_s3_key = f"public/processed/{username}/{processed_filename}"
        print(f"UPLOAD: Saving processed file to {processed_s3_key}")
        s3_client.upload_file(processed_local_path, s3_source_bucket, processed_s3_key)
        
        # DEBUG: Save a copy to final debug directory
        debug_final_filename = f"debug_02_final_processed_{processed_filename}"
        print(f"DEBUG: Saving final processed file to debug/final/{username}/{debug_final_filename}")
        s3_client.upload_file(processed_local_path, s3_source_bucket, f"debug/final/{username}/{debug_final_filename}")
        
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
                'note': 'Minimal processing implementation - upgrade to ECS for advanced features'
            })
        }
        
    except Exception as e:
        print(f"ERROR: Audio processing failed: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Audio processing failed',
                'message': str(e)
            })
        }
