/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateSample = /* GraphQL */ `
  subscription OnCreateSample($user_id: String) {
    onCreateSample(user_id: $user_id) {
      id
      name
      user_id
      file {
        bucket
        key
        region
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
    }
  }
`;
export const onUpdateSample = /* GraphQL */ `
  subscription OnUpdateSample($user_id: String) {
    onUpdateSample(user_id: $user_id) {
      id
      name
      user_id
      file {
        bucket
        key
        region
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
    }
  }
`;
export const onDeleteSample = /* GraphQL */ `
  subscription OnDeleteSample($user_id: String) {
    onDeleteSample(user_id: $user_id) {
      id
      name
      user_id
      file {
        bucket
        key
        region
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
    }
  }
`;
