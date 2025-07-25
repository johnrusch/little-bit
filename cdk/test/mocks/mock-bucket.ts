import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

/**
 * Mock S3 bucket for testing that avoids cross-stack dependencies
 */
export class MockBucket extends Construct implements s3.IBucket {
  public readonly bucketArn: string;
  public readonly bucketName: string;
  public readonly bucketWebsiteUrl: string;
  public readonly bucketDomainName: string;
  public readonly bucketRegionalDomainName: string;
  public readonly bucketWebsiteDomainName: string;
  public readonly bucketDualStackDomainName: string;
  public readonly s3UrlForObject: (key?: string) => string;
  public readonly arnForObjects: (keyPattern: string) => string;
  public readonly urlForObject: (key?: string) => string;
  public readonly virtualHostedUrlForObject: (key?: string, options?: s3.VirtualHostedStyleUrlOptions) => string;
  public readonly grantPrincipal?: any;
  public readonly encryptionKey?: any;
  public readonly policy?: any;
  
  constructor(scope: Construct, id: string) {
    super(scope, id);
    
    this.bucketName = 'mock-bucket-' + Date.now();
    this.bucketArn = `arn:aws:s3:::${this.bucketName}`;
    this.bucketDomainName = `${this.bucketName}.s3.amazonaws.com`;
    this.bucketRegionalDomainName = `${this.bucketName}.s3.us-west-2.amazonaws.com`;
    this.bucketDualStackDomainName = `${this.bucketName}.s3.dualstack.us-west-2.amazonaws.com`;
    this.bucketWebsiteUrl = `http://${this.bucketName}.s3-website-us-west-2.amazonaws.com`;
    this.bucketWebsiteDomainName = `${this.bucketName}.s3-website-us-west-2.amazonaws.com`;
    
    this.s3UrlForObject = (key?: string) => `s3://${this.bucketName}/${key || ''}`;
    this.arnForObjects = (keyPattern: string) => `${this.bucketArn}/${keyPattern}`;
    this.urlForObject = (key?: string) => `https://${this.bucketDomainName}/${key || ''}`;
    this.virtualHostedUrlForObject = (key?: string) => `https://${this.bucketDomainName}/${key || ''}`;
  }
  
  public readonly stack: cdk.Stack = cdk.Stack.of(this);
  public readonly env: cdk.ResourceEnvironment = { 
    region: 'us-west-2', 
    account: '123456789012' 
  };
  public readonly node = this.node;
  
  addEventNotification(): void {
    // Mock implementation - do nothing to avoid dependencies
  }
  
  grantRead(): any {
    return { principalAccount: '123456789012' };
  }
  
  grantReadWrite(): any {
    return { principalAccount: '123456789012' };
  }
  
  grantWrite(): any {
    return { principalAccount: '123456789012' };
  }
  
  grantPut(): any {
    return { principalAccount: '123456789012' };
  }
  
  grantDelete(): any {
    return { principalAccount: '123456789012' };
  }
  
  grantPublicAccess(): any {
    return { principalAccount: '123456789012' };
  }
  
  onCloudTrailEvent(): any {
    return {};
  }
  
  onCloudTrailPutObject(): any {
    return {};
  }
  
  onCloudTrailWriteObject(): any {
    return {};
  }
  
  applyRemovalPolicy(): void {
    // Mock implementation
  }
  
  addToResourcePolicy(): any {
    return { statementAdded: true, policyDependsOn: [] };
  }
}