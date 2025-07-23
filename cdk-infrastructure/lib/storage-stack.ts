import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface LittleBitStorageStackProps extends cdk.StackProps {
  environmentName: string;
}

export class LittleBitStorageStack extends cdk.Stack {
  public readonly audioBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: LittleBitStorageStackProps) {
    super(scope, id, props);

    const { environmentName } = props;

    // Create S3 bucket for audio files
    this.audioBucket = new s3.Bucket(this, 'AudioBucket', {
      bucketName: `little-bit-audio-${environmentName}-${this.account}-${this.region}`,
      versioned: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'delete-old-incomplete-uploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
          enabled: true
        },
        {
          id: 'transition-to-ia',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(90)
            }
          ],
          enabled: true
        }
      ],
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
            s3.HttpMethods.HEAD
          ],
          allowedOrigins: ['*'], // In production, specify exact origins
          exposedHeaders: [
            'x-amz-server-side-encryption',
            'x-amz-request-id',
            'x-amz-id-2',
            'ETag'
          ],
          maxAge: 3000
        }
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN // Protect against accidental deletion
    });

    // Create folder structure
    // Note: S3 doesn't have real folders, but we can create zero-byte objects to simulate them
    new s3.BucketDeployment(this, 'CreateFolderStructure', {
      sources: [s3.Source.data('public/', ''), s3.Source.data('private/', ''), s3.Source.data('processed/', '')],
      destinationBucket: this.audioBucket,
      retainOnDelete: false
    });

    // Output bucket name and ARN
    new cdk.CfnOutput(this, 'AudioBucketName', {
      value: this.audioBucket.bucketName,
      description: 'Name of the S3 bucket for audio files'
    });

    new cdk.CfnOutput(this, 'AudioBucketArn', {
      value: this.audioBucket.bucketArn,
      description: 'ARN of the S3 bucket for audio files'
    });

    // Export values for cross-stack references
    new cdk.CfnOutput(this, 'AudioBucketNameExport', {
      value: this.audioBucket.bucketName,
      exportName: `LittleBitAudioBucket-${environmentName}`
    });
  }

  // Method to grant read/write permissions to a principal
  public grantReadWrite(principal: iam.IGrantable): void {
    this.audioBucket.grantReadWrite(principal);
  }
}