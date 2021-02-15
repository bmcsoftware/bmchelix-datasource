import { BMCDataSourceOptions } from './types';
import { DataSourceInstanceSettings } from '@grafana/data';
import { EventDatasource } from 'query-modules/event/EventDatasource';
import { MetricDatasource } from 'query-modules/metric/MetricDatasource';
import { LogDatasource } from 'query-modules/log/LogDatasource';
import { CloudSecurityDatasource } from 'query-modules/cloudsecurity/CloudSecurityDatasource';
import { RemedyDatasource } from 'query-modules/remedy/RemedyDatasource';
import * as CONSTANTS from 'Constants';
import { SmartGraphDatasource } from 'query-modules/smartgraph/SmartGraphDatasource';

export class QueryHandlerFactory {
  static getDatasource(
    type: string,
    instanceSettings: DataSourceInstanceSettings<BMCDataSourceOptions>,
    templateSrv: any,
    timeSrv: any,
    backendSrv: any
  ): any {
    switch (type) {
      case CONSTANTS.SOURCE_TYPE_EVENT:
        return EventDatasource.getInstance(instanceSettings, templateSrv, timeSrv);
      case CONSTANTS.SOURCE_TYPE_METRIC:
        return MetricDatasource.getInstance(instanceSettings, templateSrv, timeSrv, backendSrv);
      case CONSTANTS.SOURCE_TYPE_LOG:
        return LogDatasource.getInstance(instanceSettings, templateSrv, timeSrv);
      case CONSTANTS.SOURCE_TYPE_CLOUD_SECURITY:
        return CloudSecurityDatasource.getInstance(instanceSettings, templateSrv, timeSrv, backendSrv);
      case CONSTANTS.SOURCE_TYPE_SMARTGRAPH:
        return SmartGraphDatasource.getInstance(instanceSettings, templateSrv,timeSrv);
      case CONSTANTS.SOURCE_TYPE_REMEDY:
        return RemedyDatasource.getInstance(instanceSettings, templateSrv, backendSrv);
      default:
        return EventDatasource.getInstance(instanceSettings, templateSrv, timeSrv);
    }
  }
}