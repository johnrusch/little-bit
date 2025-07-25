import { GraphQLClient } from 'graphql-request';

/**
 * GraphQL Service using graphql-request
 * Provides a lightweight alternative to Amplify API
 */
class GraphQLService {
  constructor(config) {
    if (!config || !config.aws || !config.aws.appsync) {
      throw new Error('Invalid configuration provided to GraphQLService');
    }

    const { appsync } = config.aws;
    
    if (!appsync.endpoint) {
      throw new Error('Missing required AppSync endpoint configuration');
    }

    // Initialize GraphQL client with API key authentication
    const headers = {};
    if (appsync.apiKey) {
      headers['x-api-key'] = appsync.apiKey;
    }
    
    this.client = new GraphQLClient(appsync.endpoint, { headers });

    this.config = config;
    this.subscriptionCallbacks = new Map();
    this.subscriptionClient = null;
  }

  /**
   * Execute a GraphQL query
   * @param {string} query - The GraphQL query string
   * @param {Object} variables - Query variables
   * @returns {Promise<Object>} Query result
   */
  async query(query, variables = {}) {
    try {
      const data = await this.client.request(query, variables);
      return { data };
    } catch (error) {
      console.error('GraphQL query failed');
      throw new Error('GraphQL query failed');
    }
  }

  /**
   * Execute a GraphQL mutation
   * @param {string} mutation - The GraphQL mutation string
   * @param {Object} variables - Mutation variables
   * @returns {Promise<Object>} Mutation result
   */
  async mutate(mutation, variables = {}) {
    try {
      const data = await this.client.request(mutation, variables);
      return { data };
    } catch (error) {
      console.error('GraphQL mutation failed');
      throw new Error('GraphQL mutation failed');
    }
  }

  /**
   * Create a GraphQL subscription
   * Note: This is a simplified implementation. For production, consider using
   * AWS AppSync real-time subscriptions or a WebSocket client
   * @param {Object} params - Subscription parameters
   * @returns {Object} Subscription object
   */
  subscribe(params) {
    const { query, variables = {} } = params;
    
    // Generate cryptographically secure subscription ID
    const subscriptionId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `sub-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // Store subscription info
    const subscription = {
      id: subscriptionId,
      query,
      variables,
      callbacks: {
        next: null,
        error: null,
        complete: null
      }
    };
    
    this.subscriptionCallbacks.set(subscriptionId, subscription);
    
    // Return subscription-like object
    return {
      subscribe: (callbacks) => {
        subscription.callbacks = callbacks;
        
        // Start polling or WebSocket connection here
        // For now, we'll return a mock unsubscribe function
        console.log('GraphQL subscription created (Note: Real-time subscriptions require WebSocket implementation)');
        
        return {
          unsubscribe: () => {
            this.subscriptionCallbacks.delete(subscriptionId);
            console.log('GraphQL subscription removed');
          }
        };
      }
    };
  }

  /**
   * Update authentication headers
   * @param {Object} headers - New headers to merge
   */
  updateHeaders(headers) {
    // Validate headers to prevent injection
    const sanitizedHeaders = {};
    const allowedHeaders = ['Authorization', 'x-api-key', 'Content-Type'];
    
    for (const [key, value] of Object.entries(headers)) {
      if (allowedHeaders.includes(key) && typeof value === 'string') {
        // Remove any newline characters that could cause header injection
        sanitizedHeaders[key] = value.replace(/[\r\n]/g, '');
      }
    }
    
    this.client = new GraphQLClient(this.config.aws.appsync.endpoint, {
      headers: {
        ...this.client.options.headers,
        ...sanitizedHeaders
      }
    });
  }

  /**
   * Set authorization token (for authenticated requests)
   * @param {string} token - Authorization token
   */
  setAuthToken(token) {
    this.updateHeaders({
      'Authorization': token
    });
  }
}

export default GraphQLService;