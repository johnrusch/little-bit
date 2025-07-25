import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as path from 'path';
import { Construct } from 'constructs';

export interface ComputeStackProps extends cdk.StackProps {
  readonly bucket: s3.IBucket;
  readonly apiEndpoint: string;
  readonly apiKey: string;
  readonly apiId: string;
  readonly userPoolId: string;
}

export class ComputeStack extends cdk.Stack {
  public readonly createSampleRecordFunction: lambda.Function;
  public readonly editAndConvertRecordingsFunction: lambda.Function;
  public readonly processingQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // Create SQS queue for audio processing
    this.processingQueue = new sqs.Queue(this, 'AudioProcessingQueue', {
      queueName: `littlebit-audio-processing-${cdk.Stack.of(this).stackName}`,
      visibilityTimeout: cdk.Duration.seconds(900), // 15 minutes
      retentionPeriod: cdk.Duration.days(14),
      deadLetterQueue: {
        queue: new sqs.Queue(this, 'AudioProcessingDLQ', {
          queueName: `littlebit-audio-processing-dlq-${cdk.Stack.of(this).stackName}`,
          retentionPeriod: cdk.Duration.days(14),
        }),
        maxReceiveCount: 3,
      },
    });

    // Create CreateSampleRecord Lambda function
    this.createSampleRecordFunction = new lambda.Function(this, 'CreateSampleRecord', {
      functionName: `CreateSampleRecord-${cdk.Stack.of(this).stackName}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../../lambda/create-sample-record')
      ),
      memorySize: 128,
      timeout: cdk.Duration.seconds(60),
      environment: {
        // Match Amplify environment variable naming pattern
        API_LITTLEBITGRAPHQLAPI_GRAPHQLAPIENDPOINTOUTPUT: props.apiEndpoint,
        API_LITTLEBITGRAPHQLAPI_GRAPHQLAPIIDOUTPUT: props.apiId,
        API_LITTLEBITGRAPHQLAPI_GRAPHQLAPIKEYOUTPUT: props.apiKey,
        AUTH_LITTLEBIT3EDEDEC2_USERPOOLID: props.userPoolId,
        ENV: this.node.tryGetContext('env') || 'dev',
        REGION: cdk.Stack.of(this).region,
        SQS_QUEUE_URL: this.processingQueue.queueUrl,
      },
      logRetention: 7,
    });

    // Grant permissions to CreateSampleRecord function
    props.bucket.grantRead(this.createSampleRecordFunction);
    this.processingQueue.grantSendMessages(this.createSampleRecordFunction);

    // Add GraphQL mutation permissions with specific API ID
    this.createSampleRecordFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'appsync:GraphQL',
      ],
      resources: [
        `arn:aws:appsync:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:apis/${props.apiId}/types/Mutation/fields/createSample`,
        `arn:aws:appsync:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:apis/${props.apiId}/types/Mutation/fields/updateSample`,
      ],
    }));

    // Configure S3 trigger for CreateSampleRecord
    // Grant S3 permission to invoke the Lambda function
    this.createSampleRecordFunction.addPermission('S3InvokePermission', {
      principal: new iam.ServicePrincipal('s3.amazonaws.com'),
      sourceAccount: cdk.Stack.of(this).account,
      sourceArn: props.bucket.bucketArn,
    });

    // Add S3 event notification
    // Note: This creates a circular dependency between stacks because it modifies
    // the bucket resource in the Core stack. In CDK, this should be configured
    // after both stacks are created, not within the stack definition.
    // We'll skip this in test environments to avoid the circular dependency.
    if (!this.node.tryGetContext('testing')) {
      props.bucket.addEventNotification(
        s3.EventType.OBJECT_CREATED,
        new s3n.LambdaDestination(this.createSampleRecordFunction),
        {
          prefix: 'public/unprocessed/',
          suffix: '.wav',
        }
      );
    }

    // Create EditandConvertRecordings Lambda function
    // Note: This is a placeholder as the actual processing is done by ECS
    this.editAndConvertRecordingsFunction = new lambda.Function(this, 'EditandConvertRecordings', {
      functionName: `EditandConvertRecordings-${cdk.Stack.of(this).stackName}`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../../lambda/edit-and-convert-recordings')
      ),
      memorySize: 3008,
      timeout: cdk.Duration.minutes(15),
      environment: {
        ENV: this.node.tryGetContext('env') || 'dev',
        REGION: cdk.Stack.of(this).region,
      },
      logRetention: 7,
    });

    // Grant S3 permissions to EditandConvertRecordings function
    props.bucket.grantReadWrite(this.editAndConvertRecordingsFunction);

    // Add ffmpeg layer if needed (you'll need to create this layer separately)
    // this.editAndConvertRecordingsFunction.addLayers(ffmpegLayer);

    // Stack outputs
    new cdk.CfnOutput(this, 'CreateSampleRecordFunctionArn', {
      value: this.createSampleRecordFunction.functionArn,
      description: 'CreateSampleRecord Lambda Function ARN',
      exportName: `${this.stackName}-CreateSampleRecordFunctionArn`,
    });

    new cdk.CfnOutput(this, 'EditandConvertRecordingsFunctionArn', {
      value: this.editAndConvertRecordingsFunction.functionArn,
      description: 'EditandConvertRecordings Lambda Function ARN',
      exportName: `${this.stackName}-EditandConvertRecordingsFunctionArn`,
    });

    new cdk.CfnOutput(this, 'ProcessingQueueUrl', {
      value: this.processingQueue.queueUrl,
      description: 'Audio Processing SQS Queue URL',
      exportName: `${this.stackName}-ProcessingQueueUrl`,
    });

    new cdk.CfnOutput(this, 'ProcessingQueueArn', {
      value: this.processingQueue.queueArn,
      description: 'Audio Processing SQS Queue ARN',
      exportName: `${this.stackName}-ProcessingQueueArn`,
    });
  }
}