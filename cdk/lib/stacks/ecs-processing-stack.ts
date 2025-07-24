import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as autoscaling from 'aws-cdk-lib/aws-applicationautoscaling';
import { Construct } from 'constructs';

export interface EcsProcessingStackProps extends cdk.StackProps {
  readonly bucket: s3.Bucket;
  readonly apiEndpoint: string;
  readonly apiId: string;
}

export class EcsProcessingStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly cluster: ecs.Cluster;
  public readonly service: ecs.FargateService;
  public readonly repository: ecr.Repository;

  constructor(scope: Construct, id: string, props: EcsProcessingStackProps) {
    super(scope, id, props);

    // Import the SQS queue from Compute Stack
    const queueUrl = cdk.Fn.importValue(`LittleBit-Compute-${this.node.tryGetContext('env') || 'dev'}-ProcessingQueueUrl`);
    const queueArn = cdk.Fn.importValue(`LittleBit-Compute-${this.node.tryGetContext('env') || 'dev'}-ProcessingQueueArn`);

    // Create VPC
    this.vpc = new ec2.Vpc(this, 'ProcessingVPC', {
      vpcName: `littlebit-processing-vpc-${cdk.Stack.of(this).stackName}`,
      maxAzs: 2,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // Create ECR Repository
    this.repository = new ecr.Repository(this, 'AudioProcessingRepo', {
      repositoryName: `littlebit-audio-processing-${cdk.Stack.of(this).stackName}`.toLowerCase(),
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [{
        maxImageCount: 10,
        description: 'Keep only 10 most recent images',
      }],
    });

    // Create ECS Cluster
    this.cluster = new ecs.Cluster(this, 'ProcessingCluster', {
      clusterName: `littlebit-processing-cluster-${cdk.Stack.of(this).stackName}`,
      vpc: this.vpc,
      containerInsights: true,
    });

    // Capacity providers will be set on the service level

    // Create Task Execution Role
    const taskExecutionRole = new iam.Role(this, 'TaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    // Create Task Role
    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Role for ECS tasks to access AWS services',
    });

    // Grant S3 permissions to task role
    props.bucket.grantReadWrite(taskRole);

    // Grant SQS permissions to task role
    taskRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'sqs:ReceiveMessage',
        'sqs:DeleteMessage',
        'sqs:GetQueueAttributes',
      ],
      resources: [queueArn],
    }));

    // Grant AppSync permissions to task role with specific API ID
    taskRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'appsync:GraphQL',
      ],
      resources: [
        `arn:aws:appsync:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:apis/${props.apiId}/types/Mutation/fields/updateSample`,
      ],
    }));

    // Create CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'ProcessingLogGroup', {
      logGroupName: `/ecs/littlebit-audio-processing-${cdk.Stack.of(this).stackName}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'ProcessingTaskDef', {
      family: `littlebit-audio-processing-${cdk.Stack.of(this).stackName}`,
      memoryLimitMiB: 3072,
      cpu: 1024,
      executionRole: taskExecutionRole,
      taskRole: taskRole,
    });

    // Add container to task definition
    const container = taskDefinition.addContainer('audio-processor', {
      containerName: 'audio-processor',
      image: ecs.ContainerImage.fromEcrRepository(this.repository, 'latest'),
      memoryLimitMiB: 3072,
      cpu: 1024,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'audio-processor',
        logGroup: logGroup,
      }),
      environment: {
        QUEUE_URL: queueUrl,
        S3_BUCKET: props.bucket.bucketName,
        API_URL: props.apiEndpoint,
        AWS_DEFAULT_REGION: cdk.Stack.of(this).region,
        LOG_LEVEL: 'INFO',
      },
    });

    // Create Security Group
    const serviceSecurityGroup = new ec2.SecurityGroup(this, 'ServiceSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for audio processing service',
      allowAllOutbound: true,
    });

    // Create Fargate Service
    this.service = new ecs.FargateService(this, 'ProcessingService', {
      serviceName: `littlebit-audio-processing-service-${cdk.Stack.of(this).stackName}`,
      cluster: this.cluster,
      taskDefinition: taskDefinition,
      desiredCount: 1,
      assignPublicIp: false,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [serviceSecurityGroup],
      capacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE_SPOT',
          weight: 2,
        },
        {
          capacityProvider: 'FARGATE',
          weight: 1,
        },
      ],
    });

    // Set up auto-scaling based on SQS queue depth
    const scalingTarget = this.service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 10,
    });

    // Create custom metric for SQS queue depth
    scalingTarget.scaleOnMetric('QueueDepthScaling', {
      metric: new cdk.aws_cloudwatch.Metric({
        namespace: 'AWS/SQS',
        metricName: 'ApproximateNumberOfMessagesVisible',
        dimensionsMap: {
          QueueName: cdk.Fn.select(4, cdk.Fn.split('/', queueUrl)),
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(1),
      }),
      scalingSteps: [
        { upper: 0, change: -1 },
        { lower: 5, change: +1 },
        { lower: 20, change: +3 },
      ],
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
    });

    // Stack outputs
    new cdk.CfnOutput(this, 'VPCId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `${this.stackName}-VPCId`,
    });

    new cdk.CfnOutput(this, 'ClusterArn', {
      value: this.cluster.clusterArn,
      description: 'ECS Cluster ARN',
      exportName: `${this.stackName}-ClusterArn`,
    });

    new cdk.CfnOutput(this, 'ServiceArn', {
      value: this.service.serviceArn,
      description: 'ECS Service ARN',
      exportName: `${this.stackName}-ServiceArn`,
    });

    new cdk.CfnOutput(this, 'RepositoryUri', {
      value: this.repository.repositoryUri,
      description: 'ECR Repository URI',
      exportName: `${this.stackName}-RepositoryUri`,
    });

    new cdk.CfnOutput(this, 'TaskDefinitionArn', {
      value: taskDefinition.taskDefinitionArn,
      description: 'Task Definition ARN',
      exportName: `${this.stackName}-TaskDefinitionArn`,
    });
  }
}