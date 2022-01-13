/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getSample = /* GraphQL */ `
  query GetSample($id: ID!) {
    getSample(id: $id) {
      id
      username
      sampleName
      createdAt
      updatedAt
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
        username
        sampleName
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;
