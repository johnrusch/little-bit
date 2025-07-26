import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

/**
 * Mock Cognito User Pool for testing that avoids cross-stack dependencies
 */
export class MockUserPool extends Construct implements cognito.IUserPool {
  public readonly userPoolArn: string;
  public readonly userPoolId: string;
  public readonly userPoolProviderName: string;
  public readonly userPoolProviderUrl: string;
  public readonly identityProviders: cognito.IUserPoolIdentityProvider[] = [];
  
  constructor(scope: Construct, id: string) {
    super(scope, id);
    
    this.userPoolId = 'mock-user-pool-' + Date.now();
    this.userPoolArn = `arn:aws:cognito-idp:us-west-2:123456789012:userpool/${this.userPoolId}`;
    this.userPoolProviderName = `cognito-idp.us-west-2.amazonaws.com/${this.userPoolId}`;
    this.userPoolProviderUrl = `https://cognito-idp.us-west-2.amazonaws.com/${this.userPoolId}`;
  }
  
  public readonly stack: cdk.Stack = cdk.Stack.of(this);
  public readonly env: cdk.ResourceEnvironment = { 
    region: 'us-west-2', 
    account: '123456789012' 
  };
  public readonly node = this.node;
  
  applyRemovalPolicy(): void {
    // Mock implementation
  }
  
  addClient(id: string, options?: cognito.UserPoolClientOptions): cognito.UserPoolClient {
    throw new Error('Mock implementation - use createUserPoolClient instead');
  }
  
  addDomain(id: string, options: cognito.UserPoolDomainOptions): cognito.UserPoolDomain {
    throw new Error('Mock implementation');
  }
  
  addResourceServer(id: string, options: cognito.UserPoolResourceServerOptions): cognito.UserPoolResourceServer {
    throw new Error('Mock implementation');
  }
  
  registerIdentityProvider(provider: cognito.IUserPoolIdentityProvider): void {
    this.identityProviders.push(provider);
  }
  
  grantRead(grantee: any): any {
    return { principalAccount: '123456789012' };
  }
}