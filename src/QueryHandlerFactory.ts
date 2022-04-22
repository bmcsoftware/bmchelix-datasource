import { BMCDataSourceOptions } from './types';
import { DataSourceInstanceSettings } from '@grafana/data';
import { EventDatasource } from 'query-modules/event/EventDatasource';
import { MetricDatasource } from 'query-modules/metric/MetricDatasource';
import { MetricEntityDatasource } from 'query-modules/entity/MetricEntityDatasource';
import { LogDatasource } from 'query-modules/log/LogDatasource';
import { CloudSecurityDatasource } from 'query-modules/cloudsecurity/CloudSecurityDatasource';
import { ItsmInsightsDatasource } from 'query-modules/itsm-insights/ItsmInsightsDatasource';
import { AuditDatasource } from 'query-modules/audit/AuditDatasource';
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
    console.log('query type', type);
    switch (type) {
      case CONSTANTS.SOURCE_TYPE_EVENT:
        return EventDatasource.getInstance(instanceSettings, templateSrv, timeSrv);
      case CONSTANTS.SOURCE_TYPE_METRIC:
        return MetricDatasource.getInstance(instanceSettings, templateSrv, timeSrv, backendSrv);
      case CONSTANTS.SOURCE_TYPE_ENTITY:
        return MetricEntityDatasource.getInstance(instanceSettings, templateSrv, timeSrv, backendSrv);
      case CONSTANTS.SOURCE_TYPE_LOG:
        return LogDatasource.getInstance(instanceSettings, templateSrv, timeSrv);
      case CONSTANTS.SOURCE_TYPE_CLOUD_SECURITY:
        return CloudSecurityDatasource.getInstance(instanceSettings, templateSrv, timeSrv, backendSrv);
      case CONSTANTS.SOURCE_TYPE_SMARTGRAPH:
        return SmartGraphDatasource.getInstance(instanceSettings, templateSrv, timeSrv);
      case CONSTANTS.SOURCE_TYPE_REMEDY:
        return RemedyDatasource.getInstance(instanceSettings, templateSrv, backendSrv);
      case CONSTANTS.SOURCE_TYPE_ITSM_INSIGHTS:
        return ItsmInsightsDatasource.getInstance(instanceSettings, templateSrv, timeSrv, backendSrv);
      case CONSTANTS.SOURCE_TYPE_AUDIT:
        return AuditDatasource.getInstance(instanceSettings, templateSrv, timeSrv, backendSrv);
      default:
        return EventDatasource.getInstance(instanceSettings, templateSrv, timeSrv);
    }
  }
}