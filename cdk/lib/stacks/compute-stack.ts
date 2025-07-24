import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as path from 'path';
import { Construct } from 'constructs';

export interface ComputeStackProps extends cdk.StackProps {
  readonly bucket: s3.Bucket;
  readonly apiEndpoint: string;
  readonly apiKey: string;
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
        API_ENDPOINT: props.apiEndpoint,
        API_KEY: props.apiKey,
        ENV: this.node.tryGetContext('env') || 'dev',
        REGION: cdk.Stack.of(this).region,
        SQS_QUEUE_URL: this.processingQueue.queueUrl,
      },
      logRetention: 7,
    });

    // Grant permissions to CreateSampleRecord function
    props.bucket.grantRead(this.createSampleRecordFunction);
    this.processingQueue.grantSendMessages(this.createSampleRecordFunction);

    // Add GraphQL mutation permissions
    this.createSampleRecordFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'appsync:GraphQL',
      ],
      resources: [
        `arn:aws:appsync:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:apis/*/types/Mutation/*`,
      ],
    }));

    // Configure S3 trigger for CreateSampleRecord
    // Note: This will be configured in the compute stack to avoid circular dependencies
    // The Lambda function will be granted permissions to be invoked by S3
    this.createSampleRecordFunction.grantInvoke(new iam.ServicePrincipal('s3.amazonaws.com'));

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