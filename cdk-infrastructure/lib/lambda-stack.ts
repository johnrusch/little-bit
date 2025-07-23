import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as logs from 'aws-cdk-lib/aws-logs';

export interface LittleBitLambdaStackProps extends cdk.StackProps {
  environmentName: string;
  audioBucket: s3.IBucket;
}

export class LittleBitLambdaStack extends cdk.Stack {
  public readonly createSampleRecordFunction: lambda.Function;
  public readonly editAndConvertFunction: lambda.Function;
  public readonly processingQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props: LittleBitLambdaStackProps) {
    super(scope, id, props);

    const { environmentName, audioBucket } = props;

    // Create SQS queue for audio processing
    this.processingQueue = new sqs.Queue(this, 'AudioProcessingQueue', {
      queueName: `little-bit-audio-processing-${environmentName}`,
      visibilityTimeout: cdk.Duration.seconds(300), // 5 minutes for processing
      retentionPeriod: cdk.Duration.days(7),
      deadLetterQueue: {
        queue: new sqs.Queue(this, 'AudioProcessingDLQ', {
          queueName: `little-bit-audio-processing-dlq-${environmentName}`,
          retentionPeriod: cdk.Duration.days(14)
        }),
        maxReceiveCount: 3
      }
    });

    // Create IAM role for CreateSampleRecord Lambda
    const createSampleRecordRole = new iam.Role(this, 'CreateSampleRecordRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ]
    });

    // Add permissions for GraphQL API access
    createSampleRecordRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'appsync:GraphQL'
      ],
      resources: [`arn:aws:appsync:${this.region}:${this.account}:apis/*/types/*/fields/*`]
    }));

    // Create CreateSampleRecord Lambda function
    this.createSampleRecordFunction = new lambda.Function(this, 'CreateSampleRecordFunction', {
      functionName: `CreateSampleRecord-${environmentName}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../amplify/backend/function/CreateSampleRecord/src'),
      role: createSampleRecordRole,
      timeout: cdk.Duration.seconds(60),
      memorySize: 256,
      environment: {
        ENV: environmentName,
        REGION: this.region,
        // These will need to be updated based on actual GraphQL API values
        API_LITTLEBITGRAPHQLAPI_GRAPHQLAPIIDOUTPUT: 'TO_BE_UPDATED',
        API_LITTLEBITGRAPHQLAPI_GRAPHQLAPIENDPOINTOUTPUT: 'TO_BE_UPDATED',
        API_LITTLEBITGRAPHQLAPI_GRAPHQLAPIKEYOUTPUT: 'TO_BE_UPDATED'
      },
      logRetention: logs.RetentionDays.ONE_WEEK
    });

    // Grant S3 read permissions
    audioBucket.grantRead(this.createSampleRecordFunction);

    // Create IAM role for EditAndConvert Lambda
    const editAndConvertRole = new iam.Role(this, 'EditAndConvertRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ]
    });

    // Add ECS task execution permissions
    editAndConvertRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ecs:RunTask',
        'ecs:DescribeTasks',
        'ecs:StopTask'
      ],
      resources: [
        `arn:aws:ecs:${this.region}:${this.account}:task-definition/little-bit-audio-processing-${environmentName}:*`,
        `arn:aws:ecs:${this.region}:${this.account}:task/little-bit-audio-processing-${environmentName}/*`
      ]
    }));

    // Add IAM PassRole permission for ECS
    editAndConvertRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['iam:PassRole'],
      resources: [`arn:aws:iam::${this.account}:role/*`],
      conditions: {
        StringEquals: {
          'iam:PassedToService': 'ecs-tasks.amazonaws.com'
        }
      }
    }));

    // Add SQS permissions
    this.processingQueue.grantSendMessages(editAndConvertRole);

    // Create EditAndConvert Lambda function
    this.editAndConvertFunction = new lambda.Function(this, 'EditAndConvertFunction', {
      functionName: `EditandConvertRecordings-${environmentName}`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'lambda_function.lambda_handler',
      code: lambda.Code.fromAsset('../amplify/backend/function/EditandConvertRecordings/src'),
      role: editAndConvertRole,
      timeout: cdk.Duration.seconds(60),
      memorySize: 256,
      environment: {
        ENV: environmentName,
        REGION: this.region,
        STORAGE_LITTLEBITS3RESOURCE_BUCKETNAME: audioBucket.bucketName,
        SQS_QUEUE_URL: this.processingQueue.queueUrl,
        ECS_CLUSTER_NAME: `little-bit-audio-processing-${environmentName}`,
        ECS_TASK_DEFINITION: `little-bit-audio-processing-${environmentName}`
      },
      logRetention: logs.RetentionDays.ONE_WEEK
    });

    // Grant S3 permissions
    audioBucket.grantReadWrite(this.editAndConvertFunction);

    // Add S3 bucket notification for CreateSampleRecord (excluding /processed directory)
    audioBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(this.createSampleRecordFunction),
      { 
        prefix: 'private/',
        suffix: '.m4a'
      }
    );

    // Add S3 bucket notification for EditAndConvert
    audioBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(this.editAndConvertFunction),
      { 
        prefix: 'public/',
        suffix: '.m4a'
      }
    );

    // Output function ARNs
    new cdk.CfnOutput(this, 'CreateSampleRecordFunctionArn', {
      value: this.createSampleRecordFunction.functionArn,
      description: 'ARN of the CreateSampleRecord Lambda function'
    });

    new cdk.CfnOutput(this, 'EditAndConvertFunctionArn', {
      value: this.editAndConvertFunction.functionArn,
      description: 'ARN of the EditAndConvert Lambda function'
    });

    new cdk.CfnOutput(this, 'ProcessingQueueUrl', {
      value: this.processingQueue.queueUrl,
      description: 'URL of the audio processing SQS queue'
    });
  }
}