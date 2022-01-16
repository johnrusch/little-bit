import json
import os
import boto3
from pydub import AudioSegment
from pydub.silence import split_on_silence
import time
import logging
import uuid

S3_DESTINATION_BUCKET = "sample-maker-sounds"
SIGNED_URL_TIMEOUT = 60

l = logging.getLogger("pydub.converter")
l.setLevel(logging.DEBUG)
l.addHandler(logging.StreamHandler())

def lambda_handler(event, context):
    
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
    ddb_client = boto3.client('dynamodb')
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
    

    # Define a function to normalize a chunk to a target amplitude.
    def match_target_amplitude(aChunk, target_dBFS):
        ''' Normalize given audio chunk '''
        change_in_dBFS = target_dBFS - aChunk.dBFS
        return aChunk.apply_gain(change_in_dBFS)
        

    print(local_file_name, 'LOCAL FILE')
    # Load your audio.
    sound = AudioSegment.from_file(local_file_name, format=s3_source_format)
    
    print(sound.duration_seconds, sound.dBFS)
    
    # Split track where the silence is 2 seconds or more and get chunks using 
    # the imported function.
    chunks = split_on_silence (
        # Use the loaded audio.
        sound, 
        # Specify that a silent chunk must be at least 2 seconds or 2000 ms long.
        min_silence_len = 1250,
        # Consider a chunk silent if it's quieter than -16 dBFS.
        # (You may want to adjust this parameter.)
        silence_thresh = -30
    )
    
    print(chunks)
    
    
    # Process each chunk with your parameters
    for i, chunk in enumerate(chunks):
        # Create a silence chunk that's 0.5 seconds (or 500 ms) long for padding.
        silence_chunk = AudioSegment.silent(duration=750)
        print(i)
        # Add the padding chunk to beginning and end of the entire chunk.
        audio_chunk = silence_chunk + chunk + silence_chunk
    
        # Normalize the entire chunk.
        normalized_chunk = match_target_amplitude(audio_chunk, -16.0)
    
        # Export the audio chunk with new bitrate.
        filename = "{}-{}.wav".format(s3_source_filename, i)
        normalized_chunk.export(
            "/tmp/{}".format(filename),
            format = "wav"
        )
        new_filename = "{}-{}.wav".format(s3_source_basename, i)
        print("Exporting chunk{0}.mp3.".format(i), "/tmp/{}".format(filename), s3_source_bucket, "/{}/{}".format(username, filename))
        s3_client.upload_file("/tmp/{}".format(filename), s3_source_bucket, "public/processed/{}/{}".format(username, new_filename))
        

    new_id = uuid.uuid4()
    item_id = str(new_id)
    print(item_id)
    try:
        response = ddb_client.put_item(
            TableName='Sample-ov2znedzlncihlj2heyoh3jo5e-staging',
            Item={
                'id': {
                    'S': item_id
                },
                'username': {
                    'S': username
                },
                'sampleName': {
                    'S': new_filename
                }
            }
            )
        print("a rollicking success: ", response)
    except:
        print("Unable to save item to Dynamo DB")

    return {
        'statusCode': 200,
        'body': json.dumps('Processing complete successfully')
    }
