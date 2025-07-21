

exports.handler = async (event) => {
  
    const axios = require('axios');
    const gql = require('graphql-tag');
    const graphql = require('graphql');
    const { print } = graphql;
    
    // Helper function to validate ECS configuration
    const validateEcsConfig = () => {
      const required = ['ECS_CLUSTER_NAME', 'ECS_TASK_DEFINITION'];
      for (const env of required) {
        if (!process.env[env]) {
          throw new Error(`Missing required ECS configuration: ${env}`);
        }
        if (process.env[env].includes('placeholder')) {
          throw new Error(`Invalid ECS configuration (contains placeholder): ${env}`);
        }
      }
    };
    
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
      
      // Now trigger the ECS audio processing task
      const AWS = require('aws-sdk');
      const ecs = new AWS.ECS({ region: process.env.REGION });
      
      console.log('Triggering ECS audio processing task...');
      
      try {
        // Validate ECS configuration before proceeding
        validateEcsConfig();
        
        // Parse processing parameters from default or S3 metadata (future enhancement)
        const processingParams = {
          createOneShot: true,
          silenceThreshold: -30,
          minSilenceDuration: 750,
          preserveOriginal: true,
          outputFormat: 'original',
          processingVersion: '1.0'
        };
        
        // Use environment-aware naming for ECS resources
        const env = process.env.ENV || 'dev';
        const ecsClusterName = `little-bit-audio-processing-${env}`;
        const ecsTaskDefinition = `little-bit-audio-processing-${env}`;
        
        // Get networking configuration by looking up resources by naming convention
        const ec2 = new AWS.EC2({ region: process.env.REGION });
        
        // Find VPC by tag
        const vpcs = await ec2.describeVpcs({
          Filters: [
            { Name: 'tag:Name', Values: [`little-bit-vpc-${env}`] },
            { Name: 'state', Values: ['available'] }
          ]
        }).promise();
        
        if (!vpcs.Vpcs || vpcs.Vpcs.length === 0) {
          throw new Error(`No VPC found with name little-bit-vpc-${env}`);
        }
        
        const vpcId = vpcs.Vpcs[0].VpcId;
        
        // Find private subnets
        const subnets = await ec2.describeSubnets({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'tag:Name', Values: [`little-bit-private-subnet-1-${env}`, `little-bit-private-subnet-2-${env}`] },
            { Name: 'state', Values: ['available'] }
          ]
        }).promise();
        
        if (!subnets.Subnets || subnets.Subnets.length === 0) {
          throw new Error(`No private subnets found for VPC ${vpcId}`);
        }
        
        const subnetIds = subnets.Subnets.map(subnet => subnet.SubnetId);
        
        // Find security group
        const securityGroups = await ec2.describeSecurityGroups({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'group-name', Values: [`little-bit-ecs-audio-processing-${env}`] }
          ]
        }).promise();
        
        if (!securityGroups.SecurityGroups || securityGroups.SecurityGroups.length === 0) {
          throw new Error(`No security group found with name little-bit-ecs-audio-processing-${env}`);
        }
        
        const securityGroupId = securityGroups.SecurityGroups[0].GroupId;
        
        const ecsTaskParams = {
          cluster: ecsClusterName,
          taskDefinition: ecsTaskDefinition,
          launchType: 'FARGATE',
          networkConfiguration: {
            awsvpcConfiguration: {
              subnets: subnetIds,
              securityGroups: [securityGroupId],
              assignPublicIp: 'DISABLED'
            }
          },
          overrides: {
            containerOverrides: [{
              name: 'audio-processor',
              environment: [
                { name: 'S3_BUCKET', value: sourceBucket },
                { name: 'S3_KEY', value: sourceKey },
                { name: 'USER_ID', value: userID },
                { name: 'SAMPLE_ID', value: sampleId },
                { name: 'PROCESSING_PARAMS', value: JSON.stringify(processingParams) },
                { name: 'DATABASE_TABLE', value: process.env.API_LITTLEBITGRAPHQLAPI_SAMPLETABLE_NAME },
                { name: 'REGION', value: process.env.REGION }
              ]
            }]
          }
        };
        
        const result = await ecs.runTask(ecsTaskParams).promise();
        console.log('ECS audio processing task triggered successfully:', result);
        
        if (result.failures && result.failures.length > 0) {
          throw new Error(`ECS task failures: ${JSON.stringify(result.failures)}`);
        }
        
        // Update processing status to PROCESSING only after successful task launch
        await updateProcessingStatus(sampleId, 'PROCESSING', new Date().toISOString());
        
      } catch (ecsError) {
        console.error('Error triggering ECS audio processing task:', ecsError);
        
        // Update processing status to FAILED
        try {
          await updateProcessingStatus(sampleId, 'FAILED', null, null, ecsError.message);
        } catch (updateError) {
          console.error('Error updating processing status to FAILED:', updateError);
        }
        
        // Don't fail the whole operation - the database record was created successfully
      }
      
      const body = {
        message: "successfully created sample and triggered ECS audio processing!",
        sample: graphqlData.data.data.createSample,
        processing_status: "PROCESSING"
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
  