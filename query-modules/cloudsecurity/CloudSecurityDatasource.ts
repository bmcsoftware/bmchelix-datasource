import _ from 'lodash';
import { DataSourceInstanceSettings, DataQueryRequest, DataQueryResponse, DataSourceApi } from '@grafana/data';
import { BMCDataSourceOptions } from 'types';
import { CloudSecurityDataSourceQuery } from './CloudSecurityTypes';
import { CloudSecurityQueryBuilder } from './CloudSecurityQueryBuilder';
import { CSRquestHandlerFactory } from './handlers/CSRequestHandlerFactory';

export class CloudSecurityDatasource extends DataSourceApi<CloudSecurityDataSourceQuery, BMCDataSourceOptions> {
  private static instance: CloudSecurityDatasource;
  csUrl!: string;
  dsName!: string;
  queryBuilder!: CloudSecurityQueryBuilder;

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
    this.csUrl = instSet.url as string;
    this.dsName = instSet.name;

    this.queryBuilder = new CloudSecurityQueryBuilder();
  }

  public static getInstance(
    instSet: DataSourceInstanceSettings<BMCDataSourceOptions>,
    templateSrv: any,
    timeSrv: any,
    backendSrv: any
  ): CloudSecurityDatasource {
    if (!CloudSecurityDatasource.instance) {
      CloudSecurityDatasource.instance = new CloudSecurityDatasource(instSet, templateSrv, timeSrv, backendSrv);
    }

    return CloudSecurityDatasource.instance;
  }

  query(options: DataQueryRequest<CloudSecurityDataSourceQuery>): Promise<DataQueryResponse> {
    const targets = _.cloneDeep(options.targets);
    let targetObj: any;
    let csQueryType = '';
    for (const target of targets) {
      if (target.hide) {
        continue;
      }
      targetObj = target;
    }
    csQueryType = targetObj.sourceQuery.csQueryType;

    // get the cs handler from factory
    return CSRquestHandlerFactory.getRequestHandler(csQueryType).handleRequest(this, options, targetObj);
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
