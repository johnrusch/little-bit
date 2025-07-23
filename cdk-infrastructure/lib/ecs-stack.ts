import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';

export interface LittleBitEcsStackProps extends cdk.StackProps {
  environmentName: string;
  audioBucket: s3.IBucket;
  processingQueue: sqs.IQueue;
}

export class LittleBitEcsStack extends cdk.Stack {
  public readonly cluster: ecs.Cluster;
  public readonly taskDefinition: ecs.FargateTaskDefinition;
  public readonly service: ecsPatterns.QueueProcessingFargateService;

  constructor(scope: Construct, id: string, props: LittleBitEcsStackProps) {
    super(scope, id, props);

    const { environmentName, audioBucket, processingQueue } = props;

    // Create VPC (or use existing default VPC)
    const vpc = new ec2.Vpc(this, 'LittleBitVpc', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24
        }
      ]
    });

    // Create ECS Cluster
    this.cluster = new ecs.Cluster(this, 'LittleBitCluster', {
      vpc,
      clusterName: `little-bit-audio-processing-${environmentName}`,
      containerInsights: true
    });

    // Create ECR Repository
    const ecrRepo = new ecr.Repository(this, 'AudioProcessingRepo', {
      repositoryName: `little-bit-audio-processing-${environmentName}`,
      imageScanOnPush: true,
      lifecycleRules: [{
        maxImageCount: 10
      }]
    });

    // Create CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'AudioProcessingLogs', {
      logGroupName: `/ecs/little-bit-audio-processing-${environmentName}`,
      retention: logs.RetentionDays.ONE_WEEK
    });

    // Create Task Role with necessary permissions
    const taskRole = new iam.Role(this, 'AudioProcessingTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Role for Little Bit audio processing ECS tasks'
    });

    // Grant S3 permissions
    audioBucket.grantReadWrite(taskRole);

    // Grant SQS permissions
    processingQueue.grantConsumeMessages(taskRole);

    // Create Queue Processing Service
    this.service = new ecsPatterns.QueueProcessingFargateService(this, 'AudioProcessingService', {
      cluster: this.cluster,
      queue: processingQueue,
      image: ecs.ContainerImage.fromRegistry(`${ecrRepo.repositoryUri}:latest`),
      desiredTaskCount: 0, // Will scale based on queue depth
      maxScalingCapacity: 10,
      scalingSteps: [
        { upper: 0, change: -1 },
        { upper: 5, change: +1 },
        { upper: 25, change: +2 },
        { upper: 100, change: +5 }
      ],
      cpu: 1024,
      memoryLimitMiB: 2048,
      environment: {
        ENVIRONMENT: environmentName,
        S3_BUCKET: audioBucket.bucketName,
        AWS_DEFAULT_REGION: this.region
      },
      logDriver: new ecs.AwsLogDriver({
        streamPrefix: 'audio-processing',
        logGroup
      }),
      taskRole,
      enableLogging: true,
      family: `little-bit-audio-processing-${environmentName}`
    });

    // Add security group rules if needed
    this.service.service.connections.allowFromAnyIpv4(ec2.Port.tcp(443), 'Allow HTTPS for AWS API calls');

    // Output important values
    new cdk.CfnOutput(this, 'ClusterName', {
      value: this.cluster.clusterName,
      description: 'Name of the ECS cluster'
    });

    new cdk.CfnOutput(this, 'ECRRepositoryUri', {
      value: ecrRepo.repositoryUri,
      description: 'URI of the ECR repository'
    });

    new cdk.CfnOutput(this, 'ServiceName', {
      value: this.service.service.serviceName,
      description: 'Name of the ECS service'
    });

    new cdk.CfnOutput(this, 'LogGroupName', {
      value: logGroup.logGroupName,
      description: 'CloudWatch log group for the service'
    });
  }
}