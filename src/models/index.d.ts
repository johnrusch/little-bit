import { ModelInit, MutableModel, PersistentModelConstructor } from "@aws-amplify/datastore";



export declare class S3Object {
  readonly bucket: string;
  readonly key: string;
  readonly region: string;
  constructor(init: ModelInit<S3Object>);
}

type SampleMetaData = {
  readOnlyFields: 'createdAt' | 'updatedAt';
}

export declare class Sample {
  readonly id: string;
  readonly name: string;
  readonly username?: string;
  readonly file?: S3Object;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  constructor(init: ModelInit<Sample, SampleMetaData>);
  static copyOf(source: Sample, mutator: (draft: MutableModel<Sample, SampleMetaData>) => MutableModel<Sample, SampleMetaData> | void): Sample;
}