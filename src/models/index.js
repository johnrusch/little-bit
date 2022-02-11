// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';



const { Sample, S3Object } = initSchema(schema);

export {
  Sample,
  S3Object
};