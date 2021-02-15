import { BMCDataSourceQuery } from '../../types';

export interface EventDataSourceQuery extends BMCDataSourceQuery {
  sourceQuery: EventQuery;
}

export type EventQuery = {
  alias?: string;
  query?: string;
  bucketAggs?: EventAggregation[];
  metrics?: EventAggregation[];
};

export interface EventAggregation {
  id: string;
  type: string;
  settings?: any;
  field?: string;
}
