/* Custom GraphQL queries that won't be overwritten by Amplify codegen */

export const listSamplesWithFile = /* GraphQL */ `
  query ListSamples(
    $filter: ModelSampleFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listSamples(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        user_id
        file {
          bucket
          key
          region
          __typename
        }
        processing_status
        processing_started_at
        processing_completed_at
        processing_error
        processing_params
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;