import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { CoreStack } from '../lib/stacks/core-stack';

describe('CoreStack', () => {
  let app: cdk.App;
  let stack: CoreStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new CoreStack(app, 'TestCoreStack', {
      env: { account: '123456789012', region: 'us-west-2' },
    });
    template = Template.fromStack(stack);
  });

  test('Creates Cognito User Pool with correct configuration', () => {
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      UserPoolName: Match.stringLikeRegexp('littlebit-userpool-.*'),
      AutoVerifiedAttributes: ['email'],
      Policies: {
        PasswordPolicy: {
          MinimumLength: 8,
          RequireLowercase: true,
          RequireNumbers: true,
          RequireSymbols: true,
          RequireUppercase: true,
        },
      },
    });
  });

  test('Creates User Pool Client without secret', () => {
    template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
      ClientName: 'littlebit-client',
      GenerateSecret: false,
      ExplicitAuthFlows: Match.arrayWith(['ALLOW_USER_PASSWORD_AUTH', 'ALLOW_USER_SRP_AUTH']),
    });
  });

  test('Creates Identity Pool', () => {
    template.hasResourceProperties('AWS::Cognito::IdentityPool', {
      IdentityPoolName: Match.stringLikeRegexp('littlebit_identitypool_.*'),
      AllowUnauthenticatedIdentities: false,
    });
  });

  test('Creates S3 Bucket with proper configuration', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'littlebit-audio-123456789012-us-west-2',
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      },
      CorsConfiguration: {
        CorsRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
            AllowedOrigins: [
              'http://localhost:*',
              'capacitor://localhost',
              'ionic://localhost',
              'https://*.amplifyapp.com',
            ],
            ExposedHeaders: Match.arrayWith([
              'x-amz-server-side-encryption',
              'x-amz-request-id',
              'x-amz-id-2',
              'ETag',
            ]),
            MaxAge: 3000,
          },
        ],
      },
    });
  });

  test('Creates IAM roles for authenticated and unauthenticated users', () => {
    // Check authenticated role
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Federated: 'cognito-identity.amazonaws.com',
            },
            Action: 'sts:AssumeRoleWithWebIdentity',
            Condition: Match.objectLike({
              StringEquals: Match.anyValue(),
              'ForAnyValue:StringLike': {
                'cognito-identity.amazonaws.com:amr': 'authenticated',
              },
            }),
          },
        ],
      },
    });

    // Check unauthenticated role
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Federated: 'cognito-identity.amazonaws.com',
            },
            Action: 'sts:AssumeRoleWithWebIdentity',
            Condition: Match.objectLike({
              StringEquals: Match.anyValue(),
              'ForAnyValue:StringLike': {
                'cognito-identity.amazonaws.com:amr': 'unauthenticated',
              },
            }),
          },
        ],
      },
    });
  });

  test('Stack has correct outputs', () => {
    template.hasOutput('UserPoolId', {
      Description: 'Cognito User Pool ID',
      Export: {
        Name: 'TestCoreStack-UserPoolId',
      },
    });

    template.hasOutput('AudioBucketName', {
      Description: 'S3 Audio Bucket Name',
      Export: {
        Name: 'TestCoreStack-AudioBucketName',
      },
    });
  });

  test('S3 bucket has lifecycle rule for debug files', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      LifecycleConfiguration: {
        Rules: [
          {
            Id: 'DeleteDebugFiles',
            Status: 'Enabled',
            Prefix: 'debug/',
            ExpirationInDays: 7,
          },
        ],
      },
    });
  });
});
