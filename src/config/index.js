/**
 * Configuration module main export
 */

export { default as ConfigManager } from './ConfigManager';
export * from './types';
export { validateConfig } from './utils/validation';
export { getEnvVarMapping } from './providers/env';