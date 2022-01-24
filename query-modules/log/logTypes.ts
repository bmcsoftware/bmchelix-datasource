import { BMCDataSourceQuery } from '../../types';
import {EventAggregation} from "../event/eventTypes";
import { DataQuery } from "@grafana/data";

export interface LogDataSourceQuery extends BMCDataSourceQuery {
  sourceQuery: LogQuery;
}

export type LogQuery = {
  alias?: string;
  query?: string;
  bucketAggs?: LogAggregation[];
  metrics?: LogAggregation[];
  timeField?: string;
};

export interface ElasticsearchQuery extends DataQuery {
  alias?: string;
  query?: string;
  bucketAggs?: EventAggregation[];
  metrics?: EventAggregation[];
  timeField?: string;
}

export interface LogAggregation {
  id: string;
  type: string;
  settings?: any;
  field?: string;
}
