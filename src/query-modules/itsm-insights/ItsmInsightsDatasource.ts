import { DataQueryRequest, DataQueryResponse, DataSourceApi, DataSourceInstanceSettings } from '@grafana/data';
import _ from 'lodash';
import { BMCDataSourceOptions } from 'types';
import { ItsmInsightsRquestHandlerFactory } from './handlers/ItsmInsightsRequestHandlerFactory';
import { ItsmInsightsQueryBuilder } from './ItsmInsightsQueryBuilder';
import { ItsmInsightsDataSourceQuery } from './ItsmInsightsTypes';

export class ItsmInsightsDatasource extends DataSourceApi<ItsmInsightsDataSourceQuery, BMCDataSourceOptions> {
  private static instance: ItsmInsightsDatasource;
  itsmInsightsUrl!: string;
  dsName!: string;
  queryBuilder!: ItsmInsightsQueryBuilder;

  /** @ngInject */
  private constructor(
    instanceSettings: DataSourceInstanceSettings<BMCDataSourceOptions>,
    public templateSrv: any,
    public timeSrv: any,
    public backendSrv: any
  ) {
    super(instanceSettings);
    this.refreshSettings(instanceSettings);
  }

  refreshSettings(instSet: DataSourceInstanceSettings<BMCDataSourceOptions>) {
    this.itsmInsightsUrl = instSet.url as string;
    this.dsName = instSet.name;

    this.queryBuilder = new ItsmInsightsQueryBuilder(this.templateSrv, this.timeSrv, this.backendSrv);
  }

  public static getInstance(
    instSet: DataSourceInstanceSettings<BMCDataSourceOptions>,
    templateSrv: any,
    timeSrv: any,
    backendSrv: any
  ): ItsmInsightsDatasource {
    if (!ItsmInsightsDatasource.instance) {
      ItsmInsightsDatasource.instance = new ItsmInsightsDatasource(instSet, templateSrv, timeSrv, backendSrv);
    }

    return ItsmInsightsDatasource.instance;
  }

  query(options: DataQueryRequest<ItsmInsightsDataSourceQuery>): Promise<DataQueryResponse> {
    const targets = _.cloneDeep(options.targets);
    let targetObj: any;
    let itsmInsigntsQueryType = '';
    for (const target of targets) {
      if (target.hide) {
        continue;
      }
      targetObj = target;
    }
    itsmInsigntsQueryType = targetObj.sourceQuery.itsmInsigntsQueryType;

    return ItsmInsightsRquestHandlerFactory.getRequestHandler(itsmInsigntsQueryType).handleRequest(this, options, targetObj);
  }

  testDatasource(): Promise<any> {
    throw new Error('Method not implemented.');
  }

  metricFindQuery(query: any) {
    return Promise.resolve([]);
  }

  annotationQuery(options: any): Promise<any> {
    return Promise.resolve([]);
  }
}
