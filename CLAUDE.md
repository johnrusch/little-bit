# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## AWS Configuration

- The AWS region is us-west-2

## GraphQL Query Generation

**Important**: The auto-generated GraphQL queries in `src/graphql/queries.js` have a known issue where the `listSamples` query doesn't include the `file` field. This field is necessary for loading S3 URLs for audio playback.

### The Issue
- When running `amplify push` or `amplify codegen`, the queries are regenerated
- The auto-generated `listSamples` query omits the nested `file` object field
- Without this field, sounds cannot be loaded in the app

### The Solution
We use custom GraphQL queries in `src/graphql/customQueries.js` that include all necessary fields. These custom queries:
- Are not overwritten by Amplify codegen
- Include the complete field structure needed by the app
- Should be used instead of the auto-generated queries where needed

### Current Custom Queries
- `listSamplesWithFile` - Used in `src/api/sounds.js` to fetch user sounds with S3 file information

When adding new features that require GraphQL queries with nested fields, consider creating custom queries if the auto-generated ones are incomplete.