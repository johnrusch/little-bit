

exports.handler = async (event) => {
  
    const axios = require('axios');
    const gql = require('graphql-tag');
    const graphql = require('graphql');
    const { print } = graphql;
    
    // Helper function to update processing status
    const updateProcessingStatus = async (sampleId, status, startedAt = null, completedAt = null, error = null) => {
      const updateSample = gql`
        mutation UpdateSample(
          $input: UpdateSampleInput!
        ) {
          updateSample(input: $input) {
            id
            processing_status
            processing_started_at
            processing_completed_at
            processing_error
          }
        }
      `;
      
      const updateInput = {
        id: sampleId,
        processing_status: status
      };
      
      if (startedAt) updateInput.processing_started_at = startedAt;
      if (completedAt) updateInput.processing_completed_at = completedAt;
      if (error) updateInput.processing_error = error;
      
      try {
        await axios({
          url: process.env.API_LITTLEBITGRAPHQLAPI_GRAPHQLAPIENDPOINTOUTPUT,
          method: 'post',
          headers: {
            'x-api-key': process.env.API_LITTLEBITGRAPHQLAPI_GRAPHQLAPIKEYOUTPUT
          },
          data: {
            query: print(updateSample),
            variables: { input: updateInput }
          }
        });
        console.log(`Processing status updated to ${status} for sample ${sampleId}`);
      } catch (updateError) {
        console.error('Error updating processing status:', updateError);
        throw updateError;
      }
    };
    
    const createSample = gql`
    mutation CreateSample(
      $input: CreateSampleInput!
    ) {
      createSample(input: $input) {
        id
        name
        user_id
        file {
          bucket
          key
          region
        }
        processing_status
        processing_started_at
        processing_completed_at
        processing_error
        processing_params
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
      }
    }
  `
    
    console.log("BIG EVENT", event)
    console.log("S3", event.Records[0].s3)
    console.log("USER IDENTITY", event.Records[0].userIdentity)
    const sourceS3 = event.Records[0].s3;
    const sourceBucket = sourceS3.bucket.name;
    const sourceKey = decodeURIComponent(sourceS3.object.key.replace(/\+/g, ' '));
    
    console.log(`Processing S3 key: ${sourceKey}`);
    
    // Parse the key format: "public/unprocessed/{userID}/{filename}.{extension}"
    // or "unprocessed/{userID}/{filename}.{extension}"
    const keyParts = sourceKey.split("/");
    
    // Handle both "public/unprocessed/..." and "unprocessed/..." formats
    let startIndex = 0;
    if (keyParts[0] === "public" && keyParts[1] === "unprocessed") {
      startIndex = 2;
    } else if (keyParts[0] === "unprocessed") {
      startIndex = 1;
    } else {
      throw new Error(`Invalid S3 key format: ${sourceKey}. Expected format: [public/]unprocessed/{userID}/{filename}`);
    }
    
    if (keyParts.length < startIndex + 2) {
      throw new Error(`Invalid S3 key format: ${sourceKey}. Not enough path segments.`);
    }
    
    const userID = keyParts[startIndex];
    const fileNameWithExt = keyParts[startIndex + 1];
    const destinationName = fileNameWithExt.split(".")[0];
    
    // Security: Validate userID and filename to prevent path traversal
    const userIdRegex = /^[a-zA-Z0-9\-_]+$/;
    const filenameRegex = /^[a-zA-Z0-9\-_\.\s]+$/;
    
    if (!userIdRegex.test(userID)) {
      throw new Error(`Invalid userID format: ${userID}. Only alphanumeric, hyphens, and underscores allowed.`);
    }
    
    if (!filenameRegex.test(fileNameWithExt)) {
      throw new Error(`Invalid filename format: ${fileNameWithExt}. Only alphanumeric, hyphens, underscores, dots, and spaces allowed.`);
    }
    
    if (userID.includes('..') || fileNameWithExt.includes('..')) {
      throw new Error(`Path traversal detected in userID or filename.`);
    }
    
    console.log(`Parsed - UserID: ${userID}, Filename: ${destinationName}`);
    
    try {
      console.log("ok trying")
      const graphqlData = await axios({
        url: process.env.API_LITTLEBITGRAPHQLAPI_GRAPHQLAPIENDPOINTOUTPUT,
        method: 'post',
        headers: {
          'x-api-key': process.env.API_LITTLEBITGRAPHQLAPI_GRAPHQLAPIKEYOUTPUT
        },
        data: {
          query: print(createSample),
          variables: {
            input: {
              name: destinationName,
              user_id: userID,
              file: {
                bucket: sourceBucket,
                key: sourceKey,
                region: process.env.REGION
              },
              processing_status: 'PENDING',
              processing_params: JSON.stringify({
                createOneShot: true,
                silenceThreshold: -30,
                minSilenceDuration: 750,
                preserveOriginal: true,
                outputFormat: 'original',
                processingVersion: '1.0'
              })
            }
          }
        }
      });
      // Check for GraphQL errors
      if (graphqlData.data.errors) {
        console.error('GraphQL errors:', graphqlData.data.errors);
        throw new Error('GraphQL mutation failed: ' + JSON.stringify(graphqlData.data.errors));
      }
      
      console.log('Sample created successfully:', graphqlData.data.data.createSample);
      
      const sampleId = graphqlData.data.data.createSample.id;
      
      // Now send message to SQS for audio processing
      const AWS = require('aws-sdk');
      
      console.log('Sending message to SQS for audio processing...');
      
      try {
        
        // Get S3 object metadata to read user-configured processing parameters
        const s3 = new AWS.S3({ region: process.env.REGION });
        let processingParams = {
          createOneShot: true,
          silenceThreshold: -30,
          minSilenceDuration: 750,
          preserveOriginal: true,
          outputFormat: 'original',
          processingVersion: '1.0'
        };
        
        try {
          const headResult = await s3.headObject({
            Bucket: sourceBucket,
            Key: sourceKey
          }).promise();
          
          const metadata = headResult.Metadata || {};
          console.log('S3 object metadata:', metadata);
          
          // Parse user-configured processing parameters from metadata
          processingParams = {
            createOneShot: metadata['processing-enabled'] !== undefined ? 
              metadata['processing-enabled'] === 'true' : true,
            silenceThreshold: metadata['silence-threshold'] ? 
              parseInt(metadata['silence-threshold']) : -30,
            minSilenceDuration: metadata['min-silence-duration'] ? 
              parseInt(metadata['min-silence-duration']) : 750,
            preserveOriginal: metadata['preserve-original'] !== undefined ? 
              metadata['preserve-original'] === 'true' : true,
            autoDetectThreshold: metadata['auto-detect-threshold'] === 'true',
            outputFormat: 'original', // Keep as original for now
            processingVersion: metadata['processing-version'] || '1.0',
            uiVersion: metadata['ui-version'] || '1.0'
          };
          
          console.log('Parsed processing parameters:', processingParams);
        } catch (error) {
          console.warn('Could not read S3 metadata, using defaults');
          // Continue with default parameters
        }
        
        // Use SQS queue URL from environment variable
        const queueUrl = process.env.SQS_QUEUE_URL;
        
        if (!queueUrl) {
          throw new Error('SQS_QUEUE_URL environment variable not set');
        }
        
        const sqs = new AWS.SQS({ region: process.env.REGION });
        
        // Create SQS message
        const sqsMessage = {
          recordId: sampleId,
          bucket: sourceBucket,
          key: sourceKey,
          userId: userID,
          processingParams: processingParams,
          databaseTable: process.env.API_LITTLEBITGRAPHQLAPI_SAMPLETABLE_NAME,
          region: process.env.REGION
        };
        
        const sqsParams = {
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify(sqsMessage),
          MessageAttributes: {
            'userId': {
              DataType: 'String',
              StringValue: userID
            },
            'recordId': {
              DataType: 'String',
              StringValue: sampleId
            }
          }
        };
        
        const result = await sqs.sendMessage(sqsParams).promise();
        console.log('Audio processing message sent to SQS successfully:', result);
        
        // Update processing status to QUEUED
        await updateProcessingStatus(sampleId, 'QUEUED', new Date().toISOString());
        
      } catch (sqsError) {
        console.error('Error sending message to SQS:', sqsError);
        
        // Update processing status to FAILED
        try {
          await updateProcessingStatus(sampleId, 'FAILED', null, null, sqsError.message);
        } catch (updateError) {
          console.error('Error updating processing status to FAILED:', updateError);
        }
        
        // Don't fail the whole operation - the database record was created successfully
      }
      
      const body = {
        message: "successfully created sample and queued for audio processing!",
        sample: graphqlData.data.data.createSample,
        processing_status: "QUEUED"
      }
      return {
        statusCode: 202, // Accepted - processing started but not complete
        body: JSON.stringify(body),
        headers: {
            "Access-Control-Allow-Origin": "*",
        }
      }
    } catch (err) {
      console.error('error creating sample: ', err);
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Failed to create sample",
          error: err.message
        }),
        headers: {
            "Access-Control-Allow-Origin": "*",
        }
      }
    } 
  }
  