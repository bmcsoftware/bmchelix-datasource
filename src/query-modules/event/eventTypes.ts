import { BMCDataSourceQuery } from '../../types';
import { DataQuery } from '@grafana/data';
import { MetricAggregation } from 'modules/event/components/QueryEditor/MetricAggregationsEditor/aggregations';
import { BucketAggregation } from 'modules/event/components/QueryEditor/BucketAggregationsEditor/aggregations';

export interface EventDataSourceQuery extends BMCDataSourceQuery {
  sourceQuery: EventQuery;
}

export type EventQuery = {
  alias?: string;
  query?: string;
  bucketAggs?: BucketAggregation[];
  metrics?: MetricAggregation[];
  timeField?: string;
};

export interface ElasticsearchQuery extends DataQuery {
  alias?: string;
  query?: string;
  bucketAggs?: BucketAggregation[];
  metrics?: MetricAggregation[];
  timeField?: string;
}

export interface EventAggregation {
  id: string;
  type: string;
  settings?: any;
  field?: string;
}

export interface TermsQuery {
  query?: string;
  size?: number;
  field?: string;
  order?: 'asc' | 'desc';
  orderBy?: string;
}

export type Interval = 'Hourly' | 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
