

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
        owner
      }
    }
  `
    
    console.log("BIG EVENT", event)
    console.log("S3", event.Records[0].s3)
    console.log("USER IDENTITY", event.Records[0].userIdentity)
    const sourceS3 = event.Records[0].s3;
    const sourceBucket = sourceS3.bucket.name;
    const sourceKey = sourceS3.object.key;
    const userID = sourceKey.split("/")[2];
    const destinationName = sourceKey.split("/")[3].split(".")[0];
    
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
      console.log(graphqlData.data.errors, 'ERRORS', graphqlData.data.errors[0].locations);
      const body = {
        message: "successfully created sample!"
      }
      return {
        statusCode: 200,
        body: JSON.stringify(body),
        headers: {
            "Access-Control-Allow-Origin": "*",
        }
      }
    } catch (err) {
      console.log('error creating sample: ', err);
    } 
  }
  