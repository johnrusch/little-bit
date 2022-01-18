/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createSample = /* GraphQL */ `
  mutation CreateSample(
    $input: CreateSampleInput!
    $condition: ModelSampleConditionInput
  ) {
    createSample(input: $input, condition: $condition) {
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
export const updateSample = /* GraphQL */ `
  mutation UpdateSample(
    $input: UpdateSampleInput!
    $condition: ModelSampleConditionInput
  ) {
    updateSample(input: $input, condition: $condition) {
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
export const deleteSample = /* GraphQL */ `
  mutation DeleteSample(
    $input: DeleteSampleInput!
    $condition: ModelSampleConditionInput
  ) {
    deleteSample(input: $input, condition: $condition) {
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
