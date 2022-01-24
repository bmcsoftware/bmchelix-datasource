import { BMCDataSourceQuery } from '../../types';
import {DataQuery} from "@grafana/data";

export interface EventDataSourceQuery extends BMCDataSourceQuery {
  sourceQuery: EventQuery;
}

export type EventQuery = {
  alias?: string;
  query?: string;
  bucketAggs?: EventAggregation[];
  metrics?: EventAggregation[];
  timeField?: string;
};

export interface ElasticsearchQuery extends DataQuery {
  alias?: string;
  query?: string;
  bucketAggs?: EventAggregation[];
  metrics?: EventAggregation[];
  timeField?: string;
}

export interface EventAggregation {
  id: string;
  type: string;
  settings?: any;
  field?: string;
}
