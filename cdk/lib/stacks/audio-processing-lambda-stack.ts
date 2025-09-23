import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';

export interface AudioProcessingLambdaStackProps extends cdk.StackProps {
  readonly bucket: s3.IBucket;
  readonly apiEndpoint: string;
  readonly apiId: string;
}

export class AudioProcessingLambdaStack extends cdk.Stack {
  public readonly processingFunction: lambda.Function;
  public readonly processingQueue: sqs.Queue;
  public readonly repository: ecr.Repository;

  constructor(scope: Construct, id: string, props: AudioProcessingLambdaStackProps) {
    super(scope, id, props);

    // Create ECR repository for Lambda container image
    this.repository = new ecr.Repository(this, 'AudioProcessingRepo', {
      repositoryName: `littlebit-audio-lambda-${cdk.Stack.of(this).stackName}`.toLowerCase(),
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [{
        maxImageCount: 5,
        description: 'Keep only 5 most recent images',
      }],
    });

    // Create SQS queue for audio processing with longer timeout
    this.processingQueue = new sqs.Queue(this, 'AudioProcessingQueue', {
      queueName: `littlebit-audio-lambda-queue-${cdk.Stack.of(this).stackName}`,
      visibilityTimeout: cdk.Duration.minutes(20), // Longer than Lambda timeout
      retentionPeriod: cdk.Duration.days(14),
      deadLetterQueue: {
        queue: new sqs.Queue(this, 'AudioProcessingDLQ', {
          queueName: `littlebit-audio-lambda-dlq-${cdk.Stack.of(this).stackName}`,
          retentionPeriod: cdk.Duration.days(14),
        }),
        maxReceiveCount: 3,
      },
    });

    // Create Lambda function from container image
    this.processingFunction = new lambda.Function(this, 'AudioProcessor', {
      functionName: `AudioProcessor-${cdk.Stack.of(this).stackName}`,
      // Use container image from ECR
      code: lambda.Code.fromEcrImage(this.repository, {
        tagOrDigest: 'latest',
      }),
      handler: lambda.Handler.FROM_IMAGE,
      runtime: lambda.Runtime.FROM_IMAGE,
      memorySize: 3008, // Maximum memory for better performance
      timeout: cdk.Duration.minutes(15), // Maximum timeout
      ephemeralStorageSize: cdk.Size.gibibytes(10), // Max ephemeral storage
      environment: {
        S3_BUCKET: props.bucket.bucketName,
        API_URL: props.apiEndpoint,
        API_ID: props.apiId,
        QUEUE_URL: this.processingQueue.queueUrl,
        PYTHONUNBUFFERED: '1',
      },
      reservedConcurrentExecutions: 10, // Limit concurrent executions to control costs
    });

    // Grant permissions
    props.bucket.grantReadWrite(this.processingFunction);
    this.processingQueue.grantConsumeMessages(this.processingFunction);
    
    // Grant AppSync permissions
    this.processingFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['appsync:GraphQL'],
      resources: [
        `arn:aws:appsync:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:apis/${props.apiId}/types/Mutation/fields/updateSample`,
      ],
    }));

    // Add SQS trigger to Lambda
    this.processingFunction.addEventSource(new lambdaEventSources.SqsEventSource(this.processingQueue, {
      batchSize: 1, // Process one file at a time
      maxBatchingWindow: cdk.Duration.seconds(20),
    }));

    // Alternative: Direct S3 trigger for immediate processing
    // Uncomment if you want direct S3 → Lambda without SQS
    /*
    props.bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(this.processingFunction),
      {
        prefix: 'public/unprocessed/',
        suffix: '.wav',
      }
    );
    */

    // Output the repository URI for Docker push
    new cdk.CfnOutput(this, 'RepositoryUri', {
      value: this.repository.repositoryUri,
      description: 'ECR repository URI for Lambda container image',
    });

    new cdk.CfnOutput(this, 'ProcessingQueueUrl', {
      value: this.processingQueue.queueUrl,
      description: 'SQS queue URL for audio processing jobs',
    });
  }
}