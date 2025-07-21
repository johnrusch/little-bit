export type AmplifyDependentResourcesAttributes = {
  "api": {
    "littlebitgraphqlAPI": {
      "GraphQLAPIEndpointOutput": "string",
      "GraphQLAPIIdOutput": "string",
      "GraphQLAPIKeyOutput": "string"
    }
  },
  "auth": {
    "littlebit3ededec2": {
      "AppClientID": "string",
      "AppClientIDWeb": "string",
      "IdentityPoolId": "string",
      "IdentityPoolName": "string",
      "UserPoolArn": "string",
      "UserPoolId": "string",
      "UserPoolName": "string"
    }
  },
  "custom": {
    "ecsAudioProcessing": {
      "ECRRepositoryUri": "string",
      "ECSClusterArn": "string",
      "ECSClusterName": "string",
      "ECSTaskDefinitionArn": "string",
      "ECSTaskExecutionRoleArn": "string",
      "ECSTaskRoleArn": "string",
      "PrivateSubnet1Id": "string",
      "PrivateSubnet2Id": "string",
      "SecurityGroupId": "string",
      "VPCId": "string"
    }
  },
  "function": {
    "CreateSampleRecord": {
      "Arn": "string",
      "LambdaExecutionRole": "string",
      "LambdaExecutionRoleArn": "string",
      "Name": "string",
      "Region": "string"
    },
    "EditandConvertRecordings": {
      "Arn": "string",
      "LambdaExecutionRole": "string",
      "LambdaExecutionRoleArn": "string",
      "Name": "string",
      "Region": "string"
    }
  },
  "storage": {
    "littlebitS3Resource": {
      "BucketName": "string",
      "Region": "string"
    }
  }
}