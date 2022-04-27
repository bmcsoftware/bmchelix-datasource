import _ from 'lodash';
import {
  DataSourceInstanceSettings,
  DataQueryRequest,
  DataQueryResponse,
  ScopedVars,
  DataSourceApi,
  rangeUtil,
  TimeRange,
} from '@grafana/data';

import { getBackendSrv } from '@grafana/runtime';
import { BMCDataSourceOptions } from 'types';
import { SmartGraphConstants } from './SmartGraphConstants';
import { SmartGraphDataSourceQuery } from './SmartGraphTypes';
import { BMCDataSource } from 'datasource';

class ServiceDetails {
  name: string;
  id: string;

  constructor(name: string, id: string) {
    this.name = name;
    this.id = id;
  }
}

//import { Observable } from 'rxjs';

export class SmartGraphDatasource extends DataSourceApi<SmartGraphDataSourceQuery, BMCDataSourceOptions> {
  // query(request: DataQueryRequest<SmartGraphDataSourceQuery>): Promise<DataQueryResponse> | Observable<DataQueryResponse> {
  async query(options: DataQueryRequest<SmartGraphDataSourceQuery>): Promise<DataQueryResponse> {
    throw new Error('Method not implemented.');
  }
  private static instance: SmartGraphDatasource;
  smartGraphUrl!: string;
  dsName!: string;

  /*-- Below variables will be removed once end to end integration happens. --*/
  /*-- Below variables will be removed once end to end integration happens. --*/
  index!: string;
  timeField!: string;
  interval!: string;

  serviceDetailsArray: ServiceDetails[] = [];
  serviceDetailsArray1: ServiceDetails[] = [];

  private constructor(
    instanceSettings: DataSourceInstanceSettings<BMCDataSourceOptions>,
    private templateSrv: any,
    private timeSrv: any
  ) {
    super(instanceSettings);
    this.refreshSettings(instanceSettings);
  }

  refreshSettings(instSet: DataSourceInstanceSettings<BMCDataSourceOptions>) {
    this.smartGraphUrl = instSet.url as string;
    this.dsName = instSet.name;

    /*-- Below assignments will be removed once end to end integration happens. --*/
    const settingsData = instSet.jsonData || ({} as BMCDataSourceOptions);
    this.timeField = settingsData.timeField || 'creation_time';

    this.interval = settingsData.timeInterval || '10s';

    /*-- End --*/
  }

  public static getInstance(
    instSet: DataSourceInstanceSettings<BMCDataSourceOptions>,
    templateSrv: any,
    timeSrv: any
  ): SmartGraphDatasource {
    if (!SmartGraphDatasource.instance) {
      SmartGraphDatasource.instance = new SmartGraphDatasource(instSet, templateSrv, timeSrv);
    }
    SmartGraphDatasource.instance.refreshSettings(instSet);
    return SmartGraphDatasource.instance;
  }

  private request(method: string, url: string, data?: undefined) {
    const options: any = {
      url: this.smartGraphUrl + '/' + url,
      method: method,
      data: data,
      headers: { Authorization: '' },
    };
    let imsJWTToken: string = BMCDataSource.tokenObj.adeJWTToken;

    if (imsJWTToken !== undefined) {
      options.headers['Authorization'] = 'Bearer ' + imsJWTToken;
    }

    if (method === 'GET') {
      options.headers = {
        'Content-Type': 'application/json',
        Accept: '*/*',
        Authorization: 'Bearer ' + imsJWTToken,
      };
    }
    return getBackendSrv().datasourceRequest(options);
  }

  /**
   * Sends a GET request to the specified url on the newest matching and available index.
   *
   * When multiple indices span the provided time range, the request is sent starting from the newest index,
   * and then going backwards until an index is found.
   *
   * @param url the url to query the index on, for example `/_mapping`.
   */
  private get(url: string) {
    /*  const range = this.timeSrv.timeRange();
    const indexList = this.indexPattern.getIndexList(range.from.valueOf(), range.to.valueOf());
    if (_.isArray(indexList) && indexList.length) {
      return this.requestAllIndices(indexList, url).then((results: any) => {
        results.data.$$config = results.config;
        return results.data;
      });
    } else {
      return this.request('GET', this.indexPattern.getIndexForToday() + url).then((results: any) => {
        results.data.$$config = results.config;
        return results.data;
      });
    }*/
    return this.request('GET', url).then((results: any) => {
      results.data.$$config = results.config;
      return results.data;
    });
  }

  interpolateVariablesInQueries(queries: SmartGraphDataSourceQuery[], scopedVars: ScopedVars): any[] {
    let expandedQueries: any = queries;
    if (queries && queries.length > 0) {
      expandedQueries = queries.map((query) => {
        const expandedQuery = {
          ...query,
          datasource: this.name,
          query: this.templateSrv.replace(query.sourceQuery.query, scopedVars, 'lucene'),
        };
        return expandedQuery;
      });
    }
    return expandedQueries;
  }

  async getServiceNames() {
    return this.get(SmartGraphConstants.SMARTGRAPH_SEARCH_SERVICE_URL).then((result: any) => {
      var name = 'name';
      var id = '#id';
      var nameArray = Object(result[0])['results'];
      var i: number = 0;
      for (var val of nameArray) {
        this.serviceDetailsArray[i] = new ServiceDetails(val[name], val[id]);
        i++;
      }
      return _.map(this.serviceDetailsArray, (value) => {
        return { text: value.name };
      });
    });
  }
  metricFindQuery(query: string) {
    //query = angular.fromJson(query);
    //this.getServiceDetails();
    const scopedVars = {
      __interval: { text: this.interval, value: this.interval },
      __interval_ms: { text: rangeUtil.intervalToMs(this.interval), value: rangeUtil.intervalToMs(this.interval) },
      ...this.getRangeScopedVars(this.timeSrv.timeRange()),
    };
    const interpolated = this.templateSrv.replace(query, scopedVars, this.interpolateQueryExpr);
    if (typeof interpolated === 'string' && interpolated.length > 0 && interpolated.indexOf('servicename') > 0) {
      return this.getServiceID(interpolated);
    } else {
      return this.getServiceNames();
    }
  }
  async getServiceID(interpolated: string) {
    var servicename: string;
    servicename = interpolated.substring(interpolated.indexOf('servicename') + 13, interpolated.indexOf('}') - 1);
    this.serviceDetailsArray.forEach((value) => {
      if (value.name === servicename) {
        this.serviceDetailsArray1[0] = new ServiceDetails(value.name, value.id);
      }
    });
    return _.map(this.serviceDetailsArray1, (value) => {
      return { text: value.id };
    });
  }
  testDatasource(): Promise<any> {
    throw new Error('Method not implemented.');
  }

  getRangeScopedVars(range: TimeRange = this.timeSrv.timeRange()) {
    const msRange = range.to.diff(range.from);
    const sRange = Math.round(msRange / 1000);
    return {
      __range_ms: { text: msRange, value: msRange },
      __range_s: { text: sRange, value: sRange },
      __range: { text: sRange + 's', value: sRange + 's' },
    };
  }

  interpolateQueryExpr(value: string | string[] = [], variable: any) {
    // if no multi or include all do not regexEscape

    if (typeof value === 'string') {
      return value;
    }

    if (!variable.multi && !variable.includeAll) {
      return this.prometheusRegularEscape(value);
    }
    const escapedValues = value.map((val) => this.prometheusSpecialRegexEscape(val));
    return escapedValues.join('|');
  }

  prometheusRegularEscape(value: any) {
    return typeof value === 'string' ? value : '';
  }

  //removed . in replace for fixing devicename having issues
  prometheusSpecialRegexEscape(value: any) {
    return typeof value === 'string' ? value : '';
  }
}
