/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateSample = /* GraphQL */ `
  subscription OnCreateSample(
    $filter: ModelSubscriptionSampleFilterInput
    $user_id: String
  ) {
    onCreateSample(filter: $filter, user_id: $user_id) {
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
export const onUpdateSample = /* GraphQL */ `
  subscription OnUpdateSample(
    $filter: ModelSubscriptionSampleFilterInput
    $user_id: String
  ) {
    onUpdateSample(filter: $filter, user_id: $user_id) {
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
export const onDeleteSample = /* GraphQL */ `
  subscription OnDeleteSample(
    $filter: ModelSubscriptionSampleFilterInput
    $user_id: String
  ) {
    onDeleteSample(filter: $filter, user_id: $user_id) {
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
