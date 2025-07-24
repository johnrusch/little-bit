import { Environment } from 'aws-cdk-lib';

export interface EnvironmentConfig {
  readonly env: Environment;
  readonly domainName?: string;
  readonly certificateArn?: string;
  readonly vpcCidr: string;
  readonly enableMultiAz: boolean;
  readonly enableMonitoring: boolean;
  readonly logRetentionDays: number;
}

export const environments: Record<string, EnvironmentConfig> = {
  dev: {
    env: {
      account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEPLOY_REGION || 'us-west-2',
    },
    vpcCidr: '10.0.0.0/16',
    enableMultiAz: false,
    enableMonitoring: false,
    logRetentionDays: 7,
  },
  staging: {
    env: {
      account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEPLOY_REGION || 'us-west-2',
    },
    vpcCidr: '10.1.0.0/16',
    enableMultiAz: false,
    enableMonitoring: true,
    logRetentionDays: 30,
  },
  prod: {
    env: {
      account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEPLOY_REGION || 'us-west-2',
    },
    vpcCidr: '10.2.0.0/16',
    enableMultiAz: true,
    enableMonitoring: true,
    logRetentionDays: 90,
  },
};

export function getEnvironmentConfig(envName: string): EnvironmentConfig {
  const config = environments[envName];
  if (!config) {
    throw new Error(`Unknown environment: ${envName}. Valid environments are: ${Object.keys(environments).join(', ')}`);
  }
  return config;
}