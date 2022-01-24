import { BMCDataSourceQuery } from '../../types';

export interface EntityDataSourceQuery extends BMCDataSourceQuery {
  sourceQuery: MetricQuery;
}

export type MetricQuery = {
  expr: string;
  format?: string;
  instant?: boolean;
  hinting?: boolean;
  interval?: string;
  intervalFactor?: number;
  legendFormat?: string;
  valueWithRefId?: boolean;
  requestId?: string;
  showingGraph?: boolean;
  showingTable?: boolean;
  source?: string;
};

export interface EntityQueryRequest extends BMCDataSourceQuery {
  sourceQuery: MetricSourceQueryRequest;
}

export interface MetricSourceQueryRequest extends MetricQuery {
  step?: any;
  requestId?: string;
  start: number;
  end: number;
  headers?: any;
}

export interface MetricsMetadataItem {
  type: string;
  help: string;
  unit?: string;
}

export interface MetricsMetadata {
  [metric: string]: MetricsMetadataItem[];
}
