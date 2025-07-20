import { ModelInit, MutableModel } from "@aws-amplify/datastore";
// @ts-ignore
import { LazyLoading, LazyLoadingDisabled } from "@aws-amplify/datastore";

export enum ProcessingStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED"
}

type EagerS3Object = {
  readonly bucket: string;
  readonly key: string;
  readonly region: string;
}

type LazyS3Object = {
  readonly bucket: string;
  readonly key: string;
  readonly region: string;
}

export declare type S3Object = LazyLoading extends LazyLoadingDisabled ? EagerS3Object : LazyS3Object

export declare const S3Object: (new (init: ModelInit<S3Object>) => S3Object)

type SampleMetaData = {
  readOnlyFields: 'createdAt' | 'updatedAt';
}

type EagerSample = {
  readonly id: string;
  readonly name: string;
  readonly user_id?: string | null;
  readonly file?: S3Object | null;
  readonly processing_status?: ProcessingStatus | keyof typeof ProcessingStatus | null;
  readonly processing_started_at?: string | null;
  readonly processing_completed_at?: string | null;
  readonly processing_error?: string | null;
  readonly processing_params?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazySample = {
  readonly id: string;
  readonly name: string;
  readonly user_id?: string | null;
  readonly file?: S3Object | null;
  readonly processing_status?: ProcessingStatus | keyof typeof ProcessingStatus | null;
  readonly processing_started_at?: string | null;
  readonly processing_completed_at?: string | null;
  readonly processing_error?: string | null;
  readonly processing_params?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Sample = LazyLoading extends LazyLoadingDisabled ? EagerSample : LazySample

export declare const Sample: (new (init: ModelInit<Sample, SampleMetaData>) => Sample) & {
  copyOf(source: Sample, mutator: (draft: MutableModel<Sample, SampleMetaData>) => MutableModel<Sample, SampleMetaData> | void): Sample;
}