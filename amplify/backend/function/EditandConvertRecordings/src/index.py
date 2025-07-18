import json
import os
import boto3
from pydub import AudioSegment
from pydub.silence import split_on_silence
import time
import logging
import uuid

SIGNED_URL_TIMEOUT = 60

l = logging.getLogger("pydub.converter")
l.setLevel(logging.DEBUG)
l.addHandler(logging.StreamHandler())

def handler(event, context):
    
    print(event, 'THIS THE EVENT', context)
    # print([os.curdir] + os.environ["PATH"].split(os.pathsep), 'OTHER PATH')
    # print(os.environ["PATH"].split(os.pathsep), 'PATH')

    s3_source_bucket = event['Records'][0]['s3']['bucket']['name']
    s3_source_key = event['Records'][0]['s3']['object']['key']
    folder = os.path.split(os.path.dirname(s3_source_key))[0]
    username = os.path.split(os.path.dirname(s3_source_key))[1]
    s3_source_filename = os.path.basename(s3_source_key)
    s3_source_format = os.path.splitext(s3_source_key)[1][1:]


    s3_source_basename = os.path.splitext(os.path.basename(s3_source_key))[0]
    s3_destination_filename = s3_source_basename + ".wav"
    print(s3_source_key, 'SOURCE KEY')
    print(folder, 'FOLDER')
    print(username, 'USERNAME')

    s3_client = boto3.client('s3')
    # ddb_client = boto3.client('dynamodb')
    local_file_name = f'/tmp/{s3_source_filename}'
    
    def download_file_s3(client,bucket,s3_path,local_path,retries = 10):
        i = 0
        sleep = 2
        while(i <= retries):
            try:
                client.download_file(bucket,s3_path,local_path)
                break
            except Exception as e:            
                print("404 file not found !!!")
                i = i+1
                if i>retries:
                    raise Exception(traceback.format_exc())
                time.sleep(sleep)
                sleep = sleep*2
                print("retry: "+str(i))
            
    # s3_client.download_file(s3_source_bucket, s3_source_key, f'/tmp/{s3_source_filename}')
    download_file_s3(s3_client, s3_source_bucket, s3_source_key, local_file_name)
    
    # DEBUG: Save raw uploaded file to debug directory for quality comparison
    debug_raw_filename = f"debug_01_raw_{s3_source_filename}"
    print(f"DEBUG: Saving raw uploaded file to debug/raw/{username}/{debug_raw_filename}")
    s3_client.upload_file(local_file_name, s3_source_bucket, f"debug/raw/{username}/{debug_raw_filename}")
    

    # Define a function to gently normalize a chunk to a target amplitude.
    def match_target_amplitude(aChunk, target_dBFS):
        ''' Gently normalize given audio chunk only if needed '''
        # Only normalize if audio is significantly quiet (below -35dBFS) or loud (above -5dBFS)
        if aChunk.dBFS < -35:
            # Boost quiet audio to target level
            change_in_dBFS = target_dBFS - aChunk.dBFS
            return aChunk.apply_gain(change_in_dBFS)
        elif aChunk.dBFS > -5:
            # Reduce loud audio to prevent clipping
            change_in_dBFS = target_dBFS - aChunk.dBFS
            return aChunk.apply_gain(change_in_dBFS)
        else:
            # Audio is at good level, don't normalize
            return aChunk
        

    print(local_file_name, 'LOCAL FILE')
    # Load your audio.
    sound = AudioSegment.from_file(local_file_name, format=s3_source_format)
    
    print(sound.duration_seconds, sound.dBFS)
    
    # DEBUG: Save post-loading file to debug directory (after pydub loads/parses)
    debug_loaded_filename = f"debug_02_loaded_{s3_source_basename}.wav"
    debug_loaded_path = f"/tmp/{debug_loaded_filename}"
    print(f"DEBUG: Saving post-loading file to debug/loaded/{username}/{debug_loaded_filename}")
    sound.export(
        debug_loaded_path,
        format="wav",
        parameters=[
            "-acodec", "pcm_s24le",  # 24-bit PCM for maximum quality
            "-ar", str(sound.frame_rate),  # Preserve original sample rate
            "-ac", str(sound.channels)     # Preserve original channels
        ]
    )
    s3_client.upload_file(debug_loaded_path, s3_source_bucket, f"debug/loaded/{username}/{debug_loaded_filename}")
    
    # Split track where the silence is 2 seconds or more and get chunks using 
    # the imported function.
    # Optimized parameters for better speech quality preservation
    chunks = split_on_silence (
        # Use the loaded audio.
        sound, 
        # Allow natural pauses - increased from 1250ms to 2000ms
        min_silence_len = 2000,
        # Preserve quiet speech - decreased from -30dBFS to -40dBFS
        silence_thresh = -40
    )
    
    print(chunks)
    
    
    # Process each chunk with your parameters
    for i, chunk in enumerate(chunks):
        # DEBUG: Save raw chunk before processing
        debug_raw_chunk_filename = f"debug_03_raw_chunk_{s3_source_basename}-{i}.wav"
        debug_raw_chunk_path = f"/tmp/{debug_raw_chunk_filename}"
        print(f"DEBUG: Saving raw chunk {i} to debug/raw_chunks/{username}/{debug_raw_chunk_filename}")
        chunk.export(
            debug_raw_chunk_path,
            format="wav",
            parameters=[
                "-acodec", "pcm_s24le",  # 24-bit PCM for maximum quality
                "-ar", str(chunk.frame_rate),  # Preserve original sample rate
                "-ac", str(chunk.channels)     # Preserve original channels
            ]
        )
        s3_client.upload_file(debug_raw_chunk_path, s3_source_bucket, f"debug/raw_chunks/{username}/{debug_raw_chunk_filename}")
        
        # Create a silence chunk that's 0.5 seconds (or 500 ms) long for padding.
        beginning_chunk = AudioSegment.silent(duration=250)
        ending_chunk = AudioSegment.silent(duration=750)
        print(i)
        # Add the padding chunk to beginning and end of the entire chunk.
        audio_chunk = beginning_chunk + chunk + ending_chunk
    
        # DEBUG: Save chunk with padding before normalization
        debug_padded_chunk_filename = f"debug_04_padded_chunk_{s3_source_basename}-{i}.wav"
        debug_padded_chunk_path = f"/tmp/{debug_padded_chunk_filename}"
        print(f"DEBUG: Saving padded chunk {i} to debug/padded_chunks/{username}/{debug_padded_chunk_filename}")
        audio_chunk.export(
            debug_padded_chunk_path,
            format="wav",
            parameters=[
                "-acodec", "pcm_s24le",  # 24-bit PCM for maximum quality
                "-ar", str(audio_chunk.frame_rate),  # Preserve original sample rate
                "-ac", str(audio_chunk.channels)     # Preserve original channels
            ]
        )
        s3_client.upload_file(debug_padded_chunk_path, s3_source_bucket, f"debug/padded_chunks/{username}/{debug_padded_chunk_filename}")
    
        # Normalize the entire chunk.
        normalized_chunk = match_target_amplitude(audio_chunk, -20.0)
        
        # DEBUG: Save normalized chunk
        debug_normalized_chunk_filename = f"debug_05_normalized_chunk_{s3_source_basename}-{i}.wav"
        debug_normalized_chunk_path = f"/tmp/{debug_normalized_chunk_filename}"
        print(f"DEBUG: Saving normalized chunk {i} to debug/normalized_chunks/{username}/{debug_normalized_chunk_filename}")
        normalized_chunk.export(
            debug_normalized_chunk_path,
            format="wav",
            parameters=[
                "-acodec", "pcm_s24le",  # 24-bit PCM for maximum quality
                "-ar", str(normalized_chunk.frame_rate),  # Preserve original sample rate
                "-ac", str(normalized_chunk.channels)     # Preserve original channels
            ]
        )
        s3_client.upload_file(debug_normalized_chunk_path, s3_source_bucket, f"debug/normalized_chunks/{username}/{debug_normalized_chunk_filename}")
    
        # Export the audio chunk with high quality settings
        filename = "{}-{}.wav".format(s3_source_filename, i)
        normalized_chunk.export(
            "/tmp/{}".format(filename),
            format = "wav",
            parameters=[
                "-acodec", "pcm_s16le",  # 16-bit PCM
                "-ar", "48000",          # 48kHz sample rate
                "-ac", "2"               # 2 channels (stereo)
            ]
        )
        new_filename = "{}-{}.wav".format(s3_source_basename, i)
        print("Exporting chunk{0}.mp3.".format(i), "/tmp/{}".format(filename), s3_source_bucket, "/{}/{}".format(username, filename))
        s3_client.upload_file("/tmp/{}".format(filename), s3_source_bucket, "public/processed/{}/{}".format(username, new_filename))
        
        # DEBUG: Save final processed chunk to debug directory
        debug_final_chunk_filename = f"debug_06_final_chunk_{s3_source_basename}-{i}.wav"
        print(f"DEBUG: Saving final processed chunk {i} to debug/final_chunks/{username}/{debug_final_chunk_filename}")
        s3_client.upload_file(f"/tmp/{filename}", s3_source_bucket, f"debug/final_chunks/{username}/{debug_final_chunk_filename}")
        

    # new_id = uuid.uuid4()
    # item_id = str(new_id)
    # print(item_id)
    # try:
    #     response = ddb_client.put_item(
    #         TableName='Sample-eqdn4ioae5cddgqrvsc73yvkze-staging',
    #         Item={
    #             'id': {
    #                 'S': item_id
    #             },
    #             'username': {
    #                 'S': username
    #             },
    #             'sampleName': {
    #                 'S': new_filename
    #             }
    #         }
    #         )
    #     print("a rollicking success: ", response)
    # except:
    #     print("Unable to save item to Dynamo DB")

    return {
        'statusCode': 200,
        'body': json.dumps('Processing complete successfully')
    }
