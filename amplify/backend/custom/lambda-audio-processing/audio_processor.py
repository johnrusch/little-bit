import json
import os
import boto3
import logging
from urllib.parse import unquote_plus
import tempfile
import librosa
import soundfile as sf
import numpy as np
from pydub import AudioSegment
from gql import gql, Client
from gql.transport.requests import RequestsHTTPTransport

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3 = boto3.client('s3')

# GraphQL client setup
API_URL = os.environ.get('API_URL')
transport = RequestsHTTPTransport(
    url=API_URL,
    use_json=True,
    headers={
        'Content-Type': 'application/json',
        'x-api-key': os.environ.get('API_KEY', '')
    }
)
client = Client(transport=transport, fetch_schema_from_transport=False)

# GraphQL mutation for updating sample
UPDATE_SAMPLE_MUTATION = gql('''
    mutation UpdateSample($id: ID!, $processing_status: ProcessingStatus!, $processing_completed_at: AWSDateTime, $processing_error: String) {
        updateSample(input: {
            id: $id,
            processing_status: $processing_status,
            processing_completed_at: $processing_completed_at,
            processing_error: $processing_error
        }) {
            id
            processing_status
        }
    }
''')

def handler(event, context):
    """
    Lambda handler for audio processing
    Supports both direct S3 triggers and SQS messages
    """
    try:
        # Handle SQS event
        if 'Records' in event and event['Records'][0].get('eventSource') == 'aws:sqs':
            for record in event['Records']:
                message = json.loads(record['body'])
                if 'Records' in message:  # S3 event wrapped in SQS
                    process_s3_event(message)
                else:  # Direct message with processing instructions
                    process_audio_job(message)
        
        # Handle direct S3 event
        elif 'Records' in event and event['Records'][0].get('eventSource') == 'aws:s3':
            process_s3_event(event)
        
        else:
            logger.error(f"Unsupported event type: {json.dumps(event)}")
            return {
                'statusCode': 400,
                'body': json.dumps('Unsupported event type')
            }
        
        return {
            'statusCode': 200,
            'body': json.dumps('Processing completed successfully')
        }
        
    except Exception as e:
        logger.error(f"Processing failed: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'body': json.dumps(f'Processing failed: {str(e)}')
        }

def process_s3_event(event):
    """Process S3 event"""
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = unquote_plus(record['s3']['object']['key'])
        
        logger.info(f"Processing file: s3://{bucket}/{key}")
        
        # Extract sample ID from key (assuming format: public/unprocessed/{user_id}/{sample_id}.wav)
        parts = key.split('/')
        if len(parts) >= 4:
            sample_id = parts[3].replace('.wav', '')
            process_audio_file(bucket, key, sample_id)

def process_audio_job(job):
    """Process audio job from SQS"""
    bucket = job['bucket']
    key = job['key']
    sample_id = job['sample_id']
    processing_params = job.get('processing_params', {})
    
    process_audio_file(bucket, key, sample_id, processing_params)

def process_audio_file(bucket, key, sample_id, processing_params=None):
    """Main audio processing function"""
    
    # Update status to PROCESSING
    update_sample_status(sample_id, 'PROCESSING')
    
    try:
        # Download file to temp directory
        with tempfile.NamedTemporaryFile(suffix='.wav') as tmp_input:
            s3.download_file(bucket, key, tmp_input.name)
            
            # Load audio file
            audio_data, sample_rate = librosa.load(tmp_input.name, sr=None)
            
            # Apply audio processing based on parameters
            if processing_params:
                audio_data = apply_audio_effects(audio_data, sample_rate, processing_params)
            
            # Basic processing if no params specified
            else:
                # Normalize audio
                audio_data = librosa.util.normalize(audio_data)
                
                # Apply fade in/out
                audio_data = apply_fade(audio_data, sample_rate)
                
                # Remove silence
                audio_data = remove_silence(audio_data, sample_rate)
            
            # Save processed audio
            with tempfile.NamedTemporaryFile(suffix='.wav') as tmp_output:
                sf.write(tmp_output.name, audio_data, sample_rate)
                
                # Upload to processed folder
                processed_key = key.replace('unprocessed', 'processed')
                s3.upload_file(tmp_output.name, bucket, processed_key)
                
                logger.info(f"Uploaded processed file to s3://{bucket}/{processed_key}")
        
        # Update status to COMPLETED
        update_sample_status(sample_id, 'COMPLETED')
        
    except Exception as e:
        logger.error(f"Processing failed for {sample_id}: {str(e)}", exc_info=True)
        update_sample_status(sample_id, 'FAILED', error=str(e))
        raise

def apply_audio_effects(audio_data, sample_rate, params):
    """Apply various audio effects based on parameters"""
    
    # Pitch shift
    if 'pitch_shift' in params:
        n_steps = params['pitch_shift']
        audio_data = librosa.effects.pitch_shift(audio_data, sr=sample_rate, n_steps=n_steps)
    
    # Time stretch
    if 'time_stretch' in params:
        rate = params['time_stretch']
        audio_data = librosa.effects.time_stretch(audio_data, rate=rate)
    
    # Apply reverb
    if params.get('reverb', False):
        audio_data = apply_reverb(audio_data, sample_rate)
    
    # Apply compression
    if params.get('compress', False):
        audio_data = apply_compression(audio_data)
    
    # Apply EQ
    if 'eq' in params:
        audio_data = apply_eq(audio_data, sample_rate, params['eq'])
    
    return audio_data

def apply_fade(audio_data, sample_rate, fade_duration=0.1):
    """Apply fade in and fade out"""
    fade_samples = int(fade_duration * sample_rate)
    
    # Fade in
    audio_data[:fade_samples] *= np.linspace(0, 1, fade_samples)
    
    # Fade out
    audio_data[-fade_samples:] *= np.linspace(1, 0, fade_samples)
    
    return audio_data

def remove_silence(audio_data, sample_rate, threshold_db=-40):
    """Remove silence from beginning and end"""
    # Convert to AudioSegment for easier manipulation
    audio_segment = AudioSegment(
        audio_data.tobytes(),
        frame_rate=sample_rate,
        sample_width=audio_data.dtype.itemsize,
        channels=1
    )
    
    # Remove silence
    trimmed = audio_segment.strip_silence(
        silence_thresh=threshold_db,
        chunk_size=10,
        padding=100
    )
    
    # Convert back to numpy array
    return np.array(trimmed.get_array_of_samples(), dtype=np.float32) / 32768.0

def apply_reverb(audio_data, sample_rate, room_size=0.5):
    """Simple reverb effect using convolution"""
    # This is a simplified reverb - for production, use a proper impulse response
    delay_samples = int(0.05 * sample_rate)
    decay = 0.5
    
    reverb = np.zeros_like(audio_data)
    reverb[delay_samples:] = audio_data[:-delay_samples] * decay
    
    return audio_data + reverb

def apply_compression(audio_data, threshold=0.7, ratio=4):
    """Dynamic range compression"""
    compressed = np.copy(audio_data)
    
    # Find samples above threshold
    above_threshold = np.abs(compressed) > threshold
    
    # Apply compression
    compressed[above_threshold] = threshold + (compressed[above_threshold] - threshold) / ratio
    
    return compressed

def apply_eq(audio_data, sample_rate, eq_params):
    """Apply parametric EQ"""
    # Example: eq_params = {'low': -3, 'mid': 2, 'high': 1}  # in dB
    
    # This is a simplified EQ - for production, use proper filters
    return audio_data  # Placeholder

def update_sample_status(sample_id, status, error=None):
    """Update sample status in GraphQL API"""
    try:
        from datetime import datetime
        
        variables = {
            'id': sample_id,
            'processing_status': status
        }
        
        if status == 'COMPLETED':
            variables['processing_completed_at'] = datetime.utcnow().isoformat() + 'Z'
        
        if error:
            variables['processing_error'] = error
        
        result = client.execute(UPDATE_SAMPLE_MUTATION, variable_values=variables)
        logger.info(f"Updated sample {sample_id} status to {status}")
        
    except Exception as e:
        logger.error(f"Failed to update sample status: {str(e)}", exc_info=True)