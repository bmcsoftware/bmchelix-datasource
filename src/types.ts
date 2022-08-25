import { DataQuery, DataSourceJsonData } from '@grafana/data';
import { config } from '@grafana/runtime';
import * as Constants from 'Constants';
import { Interval } from 'query-modules/event/eventTypes';

export interface BMCDataSourceQuery extends DataQuery {
  sourceType: string;
  sourceQuery: any;
}

export const defaultQuery: Partial<BMCDataSourceQuery> = {
  sourceType: Constants.SOURCE_TYPE_EVENT,
  sourceQuery: {},
};

export enum InstancePlatform {
  ADE,
  ENTERPRISE,
}

/**
 * These are options configured for each DataSource instance
 */
export interface BMCDataSourceOptions extends DataSourceJsonData {
  timeField: string;
  interval?: Interval;
  timeInterval: string;
  platformURL: string;
  platformQueue: string;
  tenantURL: string;
  tenantId: string;
  accessKey?: string;
  secretKey?: string;
}

export interface HelixSecureJsonData {
  accessKey?: string;
  secretKey?: string;
}

const queryTypeOptions: any = [
  { sourceType: Constants.SOURCE_TYPE_EVENT, text: 'Events', value: 'event', label: 'Events' },
  { sourceType: Constants.SOURCE_TYPE_METRIC, text: 'Metric', value: 'metric', label: 'Metric' },
  {
    sourceType: Constants.SOURCE_TYPE_CLOUD_SECURITY,
    text: 'CloudSecurity',
    value: 'cloudsecurity',
    label: 'CloudSecurity',
  },
  { sourceType: Constants.SOURCE_TYPE_LOG, text: 'Log', value: 'log', label: 'Log' },
  //add here
];

if (config.bootData.settings.EnvType) {
  queryTypeOptions.splice(4, -1, {
    sourceType: Constants.SOURCE_TYPE_REMEDY,
    text: 'Service Management',
    value: 'remedy',
    label: 'Service Management',
  });
  queryTypeOptions.push({
    sourceType: Constants.SOURCE_TYPE_DATAMART,
    text: 'Optimize Datamarts',
    value: 'datamarts',
    label: 'Optimize Datamarts',
  });
  queryTypeOptions.push({ sourceType: Constants.SOURCE_TYPE_AUDIT, text: 'Audit', value: 'audit', label: 'Audit' });
  queryTypeOptions.push({
    sourceType: Constants.SOURCE_TYPE_ITSM_INSIGHTS,
    text: 'ITSM Insights',
    value: 'itsm-insights',
    label: 'ITSM Insights',
  });
}

export { queryTypeOptions };

export function validQueryType(queryType: string): boolean {
  switch (queryType) {
    case Constants.SOURCE_TYPE_EVENT:
    case Constants.SOURCE_TYPE_LOG:
    case Constants.SOURCE_TYPE_METRIC:
    case Constants.SOURCE_TYPE_CLOUD_SECURITY:
    case Constants.SOURCE_TYPE_SMARTGRAPH:
    case Constants.SOURCE_TYPE_REMEDY:
    case Constants.SOURCE_TYPE_AUDIT:
    case Constants.SOURCE_TYPE_ENTITY:
    case Constants.SOURCE_TYPE_ITSM_INSIGHTS:
    case Constants.SOURCE_TYPE_DATAMART:
      return true;
    default:
      return false;
  }
}
