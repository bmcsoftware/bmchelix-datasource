import _ from 'lodash';
import defaults from 'lodash/defaults';
import {
  DataSourceInstanceSettings,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  dateMath,
  TimeRange,
  DataQueryResponseData,
  rangeUtil,
} from '@grafana/data';

import { getBackendSrv } from '@grafana/runtime';
import { BMCDataSourceOptions } from 'types';
import { EntityResultTransformer } from './EntityResultTransformer';
import EntityLanguageProvider from './EntityQlLanguageProvider';
import EntityQueryFind from './EntityQueryFind';
import { EntityDataSourceQuery } from './entityTypes';

import { BMCDataSource } from '../../datasource';

export interface MetriDataQueryResponse {
  data: {
    status: string;
    data: {
      resultType: string;
      results?: DataQueryResponseData[];
      result?: DataQueryResponseData[];
    };
  };
  cancelled?: boolean;
}

export interface RequestOptions {
  method?: string;
  url?: string;
  headers: Record<string, string>;
  transformRequest?: (data: any) => string;
  data?: any;
  withCredentials?: boolean;
  silent?: boolean;
  requestId?: string;
}

export class MetricEntityDatasource extends DataSourceApi<EntityDataSourceQuery, BMCDataSourceOptions> {
  private static instance: MetricEntityDatasource;
  lookupsDisabled: any;
  entityUrl!: string;
  languageProvider!: EntityLanguageProvider;
  resultTransformer!: EntityResultTransformer;
  range: any;
  interval!: string;
  /*-- End --*/
  /** @ngInject */
  private constructor(
    instanceSettings: DataSourceInstanceSettings<BMCDataSourceOptions>,
    private templateSrv: any,
    private timeSrv: any,
    private backendSrv: any
  ) {
    super(instanceSettings);
    this.refreshSettings(instanceSettings, templateSrv);
    this.languageProvider = new EntityLanguageProvider(this as any, this.backendSrv);
  }

  refreshSettings(instSet: DataSourceInstanceSettings<BMCDataSourceOptions>, templateSrv: any) {
    this.entityUrl = instSet.url as string;
    this.lookupsDisabled = false;
    this.resultTransformer = new EntityResultTransformer(templateSrv);
    this.interval = '15s';
  }

  public static getInstance(
    instanceSettings: DataSourceInstanceSettings<BMCDataSourceOptions>,
    templateSrv: any,
    timeSrv: any,
    backendSrv: any
  ): MetricEntityDatasource {
    if (!MetricEntityDatasource.instance) {
      MetricEntityDatasource.instance = new MetricEntityDatasource(instanceSettings, templateSrv, timeSrv, backendSrv);
    }
    MetricEntityDatasource.instance.refreshSettings(instanceSettings, templateSrv);
    return MetricEntityDatasource.instance;
  }

  testDatasource(): Promise<any> {
    // validate that the index exist and has date field
    return Promise.resolve({ data: [] });
  }

  metadataRequest(url: string, data: any, options: any) {
    const defaultOptions = options || { method: 'GET', silent: true, headers: {} };
    return this._request(url, data, defaultOptions);
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

  metricFindQuery(query: string) {
    if (!query) {
      return Promise.resolve([]);
    }

    const scopedVars = {
      __interval: { text: this.interval, value: this.interval },
      __interval_ms: { text: rangeUtil.intervalToMs(this.interval), value: rangeUtil.intervalToMs(this.interval) },
      ...this.getRangeScopedVars(this.timeSrv.timeRange()),
    };
    const interpolated = this.templateSrv.replace(query, scopedVars, this.interpolateQueryExpr);
    const metricFindQuery = new EntityQueryFind(this as any, interpolated, this.timeSrv);
    return metricFindQuery.process();
  }

  interpolateQueryExpr(value: string | string[] = [], variable: any) {
    // if no multi or include all do not regexEscape
    if (!variable.multi && !variable.includeAll) {
      return prometheusRegularEscape(value);
    }

    if (typeof value === 'string') {
      return prometheusSpecialRegexEscape(value);
    }

    const escapedValues = value.map((val) => prometheusSpecialRegexEscape(val));
    return escapedValues.join('|');
  }

  async query(options: DataQueryRequest<EntityDataSourceQuery>): Promise<DataQueryResponse> {
    const res = new Promise<DataQueryResponse | void>((resolve) => {
      resolve();
    });
    return res as DataQueryResponseData;
  }

  getDashboardTime(date: any, roundUp: boolean) {
    if (typeof date === 'string') {
      date = dateMath.parse(date, roundUp);
    }

    return Math.ceil(date.valueOf() / 1000);
  }

  _request(url: string, data: Record<string, string> | null = {}, options?: RequestOptions) {
    options = defaults(options || {}, {
      url: this.entityUrl + '/' + url,
      method: 'GET',
      headers: { Authorization: '' },
    });

    let imsJWTToken: string = BMCDataSource.tokenObj.adeJWTToken;

    if (imsJWTToken !== undefined) {
      options.headers['Authorization'] = 'Bearer ' + imsJWTToken;
    }

    if (options.method === 'GET') {
      if (data && Object.keys(data).length) {
        options.url =
          options.url +
          '?' +
          Object.entries(data)
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
            .join('&');
      }
    } else {
      if (!options.headers['Content-Type']) {
        options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }
      options.transformRequest = (data: any) => $.param(data);
      options.data = data;
    }

    return getBackendSrv().datasourceRequest(options as Required<RequestOptions>);
  }
}

export function prometheusRegularEscape(value: any) {
  return typeof value === 'string' ? value.replace(/'/g, "\\\\'") : value;
}

//removed . in replace for fixing devicename having issues
export function prometheusSpecialRegexEscape(value: any) {
  return typeof value === 'string'
    ? prometheusRegularEscape(value.replace(/\\/g, '\\\\').replace(/[*{}\[\]+?()|]/g, '\\\\$&'))
    : value;
}

/**
 * Align query range to step.
 * Rounds start and end down to a multiple of step.
 * @param start Timestamp marking the beginning of the range.
 * @param end Timestamp marking the end of the range.
 * @param step Interval to align start and end with.
 * @param utcOffsetSec Number of seconds current timezone is offset from UTC
 */
export function alignRange(
  start: number,
  end: number,
  step: number,
  utcOffsetSec: number
): { end: number; start: number } {
  const alignedEnd = Math.floor((end + utcOffsetSec) / step) * step - utcOffsetSec;
  const alignedStart = Math.floor((start + utcOffsetSec) / step) * step - utcOffsetSec;
  return {
    end: alignedEnd,
    start: alignedStart,
  };
}
