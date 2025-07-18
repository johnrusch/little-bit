

exports.handler = async (event) => {
  
    const axios = require('axios');
    const gql = require('graphql-tag');
    const graphql = require('graphql');
    const { print } = graphql;
    
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
              }
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
      
      // Now trigger the audio processing function
      const AWS = require('aws-sdk');
      const lambda = new AWS.Lambda();
      
      console.log('Triggering EditandConvertRecordings function for audio processing...');
      
      try {
        const invokeParams = {
          FunctionName: process.env.FUNCTION_EDITANDCONVERTRECORDINGS_NAME || 'EditandConvertRecordings',
          InvocationType: 'Event', // Asynchronous invocation
          Payload: JSON.stringify(event) // Pass the original S3 event
        };
        
        const result = await lambda.invoke(invokeParams).promise();
        console.log('EditandConvertRecordings function triggered successfully:', result);
      } catch (invocationError) {
        console.error('Error triggering EditandConvertRecordings function:', invocationError);
        // Don't fail the whole operation - the database record was created successfully
      }
      
      const body = {
        message: "successfully created sample and triggered audio processing!",
        sample: graphqlData.data.data.createSample
      }
      return {
        statusCode: 200,
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
  