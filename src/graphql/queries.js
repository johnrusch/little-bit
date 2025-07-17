/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getSample = /* GraphQL */ `
  query GetSample($id: ID!) {
    getSample(id: $id) {
      id
      name
      user_id
      file {
        bucket
        key
        region
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const listSamples = /* GraphQL */ `
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
export const syncSamples = /* GraphQL */ `
  query SyncSamples(
    $filter: ModelSampleFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncSamples(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
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
