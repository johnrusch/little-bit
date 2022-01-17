/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateSample = /* GraphQL */ `
  subscription OnCreateSample($owner: String) {
    onCreateSample(owner: $owner) {
      id
      name
      username
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
      owner
    }
  }
`;
export const onUpdateSample = /* GraphQL */ `
  subscription OnUpdateSample($owner: String) {
    onUpdateSample(owner: $owner) {
      id
      name
      username
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
      owner
    }
  }
`;
export const onDeleteSample = /* GraphQL */ `
  subscription OnDeleteSample($owner: String) {
    onDeleteSample(owner: $owner) {
      id
      name
      username
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
      owner
    }
  }
`;
