// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';

const ProcessingStatus = {
  "PENDING": "PENDING",
  "PROCESSING": "PROCESSING",
  "COMPLETED": "COMPLETED",
  "FAILED": "FAILED"
};

const { Sample, S3Object } = initSchema(schema);

export {
  Sample,
  ProcessingStatus,
  S3Object
};