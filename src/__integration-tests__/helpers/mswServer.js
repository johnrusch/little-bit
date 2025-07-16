import { setupServer } from 'msw/node';
import { graphql, http, HttpResponse } from 'msw';

// GraphQL handlers for AWS AppSync API
const graphqlHandlers = [
  // Authentication-related queries
  graphql.query('GetUser', ({ variables }) => {
    return HttpResponse.json({
      data: {
        getUser: {
          id: 'test-user-id',
          username: variables.id || 'testuser',
          email: 'test@example.com',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    });
  }),

  // Sample-related operations
  graphql.query('ListSamples', () => {
    return HttpResponse.json({
      data: {
        listSamples: {
          items: [
            {
              id: 'sample-1',
              name: 'Test Sample 1',
              description: 'A test audio sample',
              filename: 'test-sample-1.m4a',
              duration: 5000,
              userId: 'test-user-id',
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
            {
              id: 'sample-2',
              name: 'Test Sample 2',
              description: 'Another test audio sample',
              filename: 'test-sample-2.m4a',
              duration: 3000,
              userId: 'test-user-id',
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          ],
          nextToken: null,
        },
      },
    });
  }),

  graphql.mutation('CreateSample', ({ variables }) => {
    return HttpResponse.json({
      data: {
        createSample: {
          id: `sample-${Date.now()}`,
          name: variables.input.name,
          description: variables.input.description,
          filename: variables.input.filename,
          duration: variables.input.duration,
          userId: variables.input.userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    });
  }),

  graphql.mutation('UpdateSample', ({ variables }) => {
    return HttpResponse.json({
      data: {
        updateSample: {
          id: variables.input.id,
          name: variables.input.name,
          description: variables.input.description,
          filename: variables.input.filename,
          duration: variables.input.duration,
          userId: 'test-user-id',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: new Date().toISOString(),
        },
      },
    });
  }),

  graphql.mutation('DeleteSample', ({ variables }) => {
    return HttpResponse.json({
      data: {
        deleteSample: {
          id: variables.input.id,
          name: 'Deleted Sample',
          description: null,
          filename: null,
          duration: 0,
          userId: 'test-user-id',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: new Date().toISOString(),
        },
      },
    });
  }),

  // Note: GraphQL subscriptions are not supported in MSW
  // Real-time subscriptions will be tested through component behavior
];

// Configuration for mock endpoints
const mockConfig = {
  s3: {
    bucketName: process.env.TEST_S3_BUCKET || 'test-bucket',
    region: process.env.TEST_AWS_REGION || 'us-east-1',
  },
  cognito: {
    region: process.env.TEST_AWS_REGION || 'us-east-1',
  },
};

// Generate S3 URL pattern based on config
const getS3UrlPattern = () => `https://${mockConfig.s3.bucketName}.s3.${mockConfig.s3.region}.amazonaws.com/*`;

// REST API handlers for S3 and other services
const restHandlers = [
  // S3 presigned URL operations
  http.put(getS3UrlPattern(), () => {
    return new HttpResponse(null, { status: 200 });
  }),

  http.get(getS3UrlPattern(), () => {
    return new HttpResponse('mock-audio-data', { 
      status: 200,
      headers: {
        'Content-Type': 'audio/m4a',
      },
    });
  }),

  http.delete(getS3UrlPattern(), () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // AWS Cognito mock endpoints
  http.post(`https://cognito-idp.${mockConfig.cognito.region}.amazonaws.com/`, ({ request }) => {
    const target = request.headers.get('X-Amz-Target');
    
    if (target?.includes('SignUp')) {
      return HttpResponse.json({
        UserSub: 'test-user-sub',
        CodeDeliveryDetails: {
          DeliveryMedium: 'EMAIL',
          Destination: 'test@example.com',
        },
      });
    }
    
    if (target?.includes('ConfirmSignUp')) {
      return HttpResponse.json({});
    }
    
    if (target?.includes('InitiateAuth')) {
      return HttpResponse.json({
        AuthenticationResult: {
          AccessToken: 'mock-access-token',
          IdToken: 'mock-id-token',
          RefreshToken: 'mock-refresh-token',
          ExpiresIn: 3600,
        },
      });
    }
    
    return HttpResponse.json({});
  }),
];

// Setup MSW server
export const server = setupServer(...graphqlHandlers, ...restHandlers);

// Helper functions for managing server state during tests
export const mockHandlers = {
  // Override default handlers for specific test scenarios
  resetToDefaults: () => {
    server.resetHandlers(...graphqlHandlers, ...restHandlers);
  },
  
  // Mock authentication failure
  mockAuthFailure: () => {
    server.use(
      http.post(`https://cognito-idp.${mockConfig.cognito.region}.amazonaws.com/`, ({ request }) => {
        const target = request.headers.get('X-Amz-Target');
        if (target?.includes('InitiateAuth')) {
          return new HttpResponse(
            JSON.stringify({
              __type: 'NotAuthorizedException',
              message: 'Incorrect username or password.',
            }),
            { status: 400 }
          );
        }
        return HttpResponse.json({});
      })
    );
  },
  
  // Mock network error
  mockNetworkError: () => {
    server.use(
      graphql.query('ListSamples', () => {
        return HttpResponse.error();
      })
    );
  },
  
  // Mock empty sample list
  mockEmptySamples: () => {
    server.use(
      graphql.query('ListSamples', () => {
        return HttpResponse.json({
          data: {
            listSamples: {
              items: [],
              nextToken: null,
            },
          },
        });
      })
    );
  },
  
  // Mock S3 upload failure
  mockS3UploadFailure: () => {
    server.use(
      http.put(getS3UrlPattern(), () => {
        return new HttpResponse(null, { status: 500 });
      })
    );
  },
};

export default server;