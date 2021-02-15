import { BMCDataSourceQuery } from '../../types';

export interface LogDataSourceQuery extends BMCDataSourceQuery {
  sourceQuery: LogQuery;
}

export type LogQuery = {
  alias?: string;
  query?: string;
  bucketAggs?: LogAggregation[];
  metrics?: LogAggregation[];
};

export interface LogAggregation {
  id: string;
  type: string;
  settings?: any;
  field?: string;
}
