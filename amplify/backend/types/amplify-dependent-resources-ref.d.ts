export type AmplifyDependentResourcesAttributes = {
    "auth": {
        "userPoolGroups": {
            "usersGroupRole": "string"
        },
        "samplemaker1a9f26991a9f2699": {
            "IdentityPoolId": "string",
            "IdentityPoolName": "string",
            "UserPoolId": "string",
            "UserPoolArn": "string",
            "UserPoolName": "string",
            "AppClientIDWeb": "string",
            "AppClientID": "string"
        }
    },
    "storage": {
        "samplemaker": {
            "BucketName": "string",
            "Region": "string"
        }
    },
    "api": {
        "SampleMakerAPI": {
            "GraphQLAPIIdOutput": "string",
            "GraphQLAPIEndpointOutput": "string"
        }
    }
}