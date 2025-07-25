import GraphQLService from './GraphQLService';

/**
 * API Adapter that provides Amplify API compatibility
 * while using GraphQLService under the hood
 */
class APIAdapter {
  constructor(config) {
    this.graphqlService = new GraphQLService(config);
    this.config = config;
  }

  /**
   * GraphQL operation (Amplify API.graphql replacement)
   * @param {Object} params - GraphQL parameters
   * @returns {Promise<Object>} GraphQL result matching Amplify format
   */
  async graphql(params) {
    const { query, variables, authMode } = params;
    
    // Extract the query string if it's an object with a query property
    const queryString = typeof query === 'string' ? query : query.query || query;
    
    try {
      // Determine if it's a mutation or query based on the query string
      const isMutation = queryString.trim().startsWith('mutation');
      
      let result;
      if (isMutation) {
        result = await this.graphqlService.mutate(queryString, variables);
      } else {
        result = await this.graphqlService.query(queryString, variables);
      }
      
      return result;
    } catch (error) {
      // Wrap error to match Amplify error format
      throw {
        errors: [{ message: error.message }],
        data: null
      };
    }
  }

  /**
   * Generate client (for compatibility with generateClient)
   * Returns an object with graphql method
   */
  generateClient() {
    const adapter = this;
    
    return {
      graphql: (params) => {
        // Handle subscription
        if (params.query && typeof params.query === 'object' && params.query.subscribe) {
          return adapter.graphqlService.subscribe(params);
        }
        
        // Handle regular query/mutation
        return adapter.graphql(params);
      }
    };
  }

  /**
   * Update auth token for authenticated requests
   * @param {string} token - Auth token
   */
  updateAuthToken(token) {
    this.graphqlService.setAuthToken(token);
  }
}

// Factory function to create API adapter
export function createAPIAdapter(config) {
  return new APIAdapter(config);
}

export default APIAdapter;