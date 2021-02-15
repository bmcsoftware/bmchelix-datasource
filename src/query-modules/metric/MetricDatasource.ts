import _, { has } from 'lodash';
import cloneDeep from 'lodash/cloneDeep';
import defaults from 'lodash/defaults';
import {
  DataSourceInstanceSettings,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  dateMath,
  DataQueryError,
  CoreApp,
  TimeRange,
  AnnotationEvent,
  DataQueryResponseData,
  LoadingState,
  TimeSeries,
  rangeUtil,
} from '@grafana/data';

import { getBackendSrv } from '@grafana/runtime';
import { forkJoin, from, merge, Observable, of } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { BMCDataSourceOptions } from 'types';
import { MetricResultTransformer } from './MetricResultTransformer';
import MetricLanguageProvider from './MetricQlLanguageProvider';
import MetricQueryFind from './MetricQueryFind';
import { MetricDataSourceQuery, MetricQueryRequest } from './metricTypes';
import addLabelToQuery from './add_label_to_query';
import TableModel from 'grafana/app/core/table_model';
import { MetricConstants } from './MetricConstants';
import { BMCDataSource } from '../../DataSource';

export const ANNOTATION_QUERY_STEP_DEFAULT = '60s';

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

export const safeStringifyValue = (value: any, space?: number) => {
  if (!value) {
    return '';
  }

  try {
    return JSON.stringify(value, null, space);
  } catch (error) {
    console.error(error);
  }

  return '';
};

interface RequestOptions {
  method?: string;
  url?: string;
  headers: Record<string, string>;
  transformRequest?: (data: any) => string;
  data?: any;
  withCredentials?: boolean;
  silent?: boolean;
  requestId?: string;
}

export const interval_regex = /(\d+(?:\.\d+)?)(ms|[Mwdhmsy])/;

export const intervals_in_seconds: any = {
  y: 31536000,
  M: 2592000,
  w: 604800,
  d: 86400,
  h: 3600,
  m: 60,
  s: 1,
  ms: 0.001,
};

export const source_has_rbac: any = {
  Monitor: true,
  Optimize: false,
};

export class MetricDatasource extends DataSourceApi<MetricDataSourceQuery, BMCDataSourceOptions> {
  private static instance: MetricDatasource;
  lookupsDisabled: any;
  metricUrl!: string;
  languageProvider!: MetricLanguageProvider;
  resultTransformer!: MetricResultTransformer;
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
    this.languageProvider = new MetricLanguageProvider(this, this.backendSrv);
  }

  refreshSettings(instSet: DataSourceInstanceSettings<BMCDataSourceOptions>, templateSrv: any) {
    this.metricUrl = instSet.url as string;
    this.lookupsDisabled = false;
    this.resultTransformer = new MetricResultTransformer(templateSrv);
    this.interval = '15s';
  }

  public static getInstance(
    instanceSettings: DataSourceInstanceSettings<BMCDataSourceOptions>,
    templateSrv: any,
    timeSrv: any,
    backendSrv: any
  ): MetricDatasource {
    if (!MetricDatasource.instance) {
      MetricDatasource.instance = new MetricDatasource(instanceSettings, templateSrv, timeSrv, backendSrv);
    }
    MetricDatasource.instance.refreshSettings(instanceSettings, templateSrv);
    return MetricDatasource.instance;
  }

  testDatasource(): Promise<any> {
    // validate that the index exist and has date field
    return Promise.resolve({ data: [] });
  }

  metadataRequest(url: string) {
    return this._request(url, null, { method: 'GET', silent: true, headers: {} });
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
    const metricFindQuery = new MetricQueryFind(this, interpolated, this.timeSrv);
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

    const escapedValues = value.map(val => prometheusSpecialRegexEscape(val));
    return escapedValues.join('|');
  }

  async query(options: DataQueryRequest<MetricDataSourceQuery>): Promise<DataQueryResponse> {
    this.range = {
      start: this.getDashboardTime(options.range.from, false),
      end: this.getDashboardTime(options.range.to, true),
    };
    const start = this.getDashboardTime(options.range.from, false);
    const end = this.getDashboardTime(options.range.to, true);
    const { queries, activeTargets } = this.prepareTargets(options, start, end);

    // No valid targets, return the empty result to save a round trip.
    if (!queries || !queries.length) {
      return of({
        data: [],
        state: LoadingState.Done,
      }).toPromise();
    }

    if (options.app === CoreApp.Explore) {
      return this.exploreQuery(queries, activeTargets, end).toPromise();
    }

    return this.panelsQuery(queries, activeTargets, end, options.requestId).toPromise();
  }

  private exploreQuery(queries: MetricQueryRequest[], activeTargets: MetricDataSourceQuery[], end: number) {
    let runningQueriesCount = queries.length;
    const subQueries = queries.map((query, index) => {
      const target = activeTargets[index];
      let observable: Observable<any> | null = null;

      if (query.sourceQuery.instant) {
        observable = from(this.performInstantQuery(query, end));
      } else {
        observable = from(this.performTimeSeriesQuery(query, query.sourceQuery.start, query.sourceQuery.end));
      }

      return observable.pipe(
        // Decrease the counter here. We assume that each request returns only single value and then completes
        // (should hold until there is some streaming requests involved).
        tap(() => runningQueriesCount--),
        filter((response: any) => (response.cancelled ? false : true)),
        map((response: any) => {
          const data = this.processResult(response, query, target, queries.length);
          return {
            data,
            key: query.sourceQuery.requestId,
            state: runningQueriesCount === 0 ? LoadingState.Done : LoadingState.Loading,
          } as DataQueryResponse;
        })
      );
    });

    return merge(...subQueries);
  }

  private panelsQuery(
    queries: MetricQueryRequest[],
    activeTargets: MetricDataSourceQuery[],
    end: number,
    requestId: string
  ) {
    const observables: Array<Observable<Array<TableModel | TimeSeries>>> = queries.map((query, index) => {
      const target = activeTargets[index];
      let observable: Observable<any> | null = null;

      if (query.sourceQuery.instant) {
        observable = from(this.performInstantQuery(query, end));
      } else {
        observable = from(this.performTimeSeriesQuery(query, query.sourceQuery.start, query.sourceQuery.end));
      }

      return observable.pipe(
        filter((response: any) => (response.cancelled ? false : true)),
        map((response: any) => {
          const data = this.processResult(response, query, target, queries.length);
          return data;
        })
      );
    });

    return forkJoin(observables).pipe(
      map((results: Array<Array<TableModel | TimeSeries>>) => {
        const data = results.reduce((result, current) => {
          return [...result, ...current];
        }, []);
        return {
          data,
          key: requestId,
          state: LoadingState.Done,
        };
      })
    );
  }

  createAnnotationQueryOptions = (options: any): DataQueryRequest<MetricDataSourceQuery> => {
    const annotation = options.annotation;
    const interval =
      annotation && annotation.step && typeof annotation.step === 'string'
        ? annotation.step
        : ANNOTATION_QUERY_STEP_DEFAULT;
    return {
      ...options,
      interval,
    };
  };

  async annotationQuery(options: any): Promise<AnnotationEvent[]> {
    const annotation = options.annotation;
    const { expr = '', tagKeys = '', titleFormat = '', textFormat = '' } = annotation;

    if (!expr) {
      return Promise.resolve([]);
    }

    const start = this.getDashboardTime(options.range.from, false);
    const end = this.getDashboardTime(options.range.to, true);
    const queryOptions = this.createAnnotationQueryOptions(options);

    // Unsetting min interval for accurate event resolution
    const minStep = '1s';
    const queryModel = {
      sourceQuery: {
        expr,
        interval: minStep,
        requestId: `prom-query-${annotation.name}`,
      },
      sourceType: options.annotation.selectedType,
      refId: 'X',
    };

    const query = this.createQuery(queryModel, queryOptions, start, end);

    const self = this;
    const response: MetriDataQueryResponse = await this.performTimeSeriesQuery(
      query,
      query.sourceQuery.start,
      query.sourceQuery.end
    );
    const eventList: AnnotationEvent[] = [];
    const splitKeys = tagKeys.split(',');

    if (response.cancelled) {
      return [];
    }

    const step = Math.floor(query.sourceQuery.step) * 1000;

    response?.data?.data?.result?.forEach(series => {
      const tags = Object.entries(series.metric)
        .filter(([k]) => splitKeys.includes(k))
        .map(([_k, v]: [string, any]) => v);

      series.values.forEach((value: any[]) => {
        let timestampValue;
        // rewrite timeseries to a common format
        if (annotation.useValueForTime) {
          timestampValue = Math.floor(parseFloat(value[1]));
          value[1] = 1;
        } else {
          timestampValue = Math.floor(parseFloat(value[0])) * 1000;
        }
        value[0] = timestampValue;
      });

      const activeValues = series.values.filter((value: Record<number, string>) => parseFloat(value[1]) >= 1);
      const activeValuesTimestamps = activeValues.map((value: number[]) => value[0]);

      // Instead of creating singular annotation for each active event we group events into region if they are less
      // then `step` apart.
      let latestEvent: AnnotationEvent = {};
      activeValuesTimestamps.forEach((timestamp: number) => {
        // We already have event `open` and we have new event that is inside the `step` so we just update the end.
        if (latestEvent && latestEvent.timeEnd && latestEvent.timeEnd + step >= timestamp) {
          latestEvent.timeEnd = timestamp;
          return;
        }

        // Event exists but new one is outside of the `step` so we "finish" the current region.
        if (latestEvent) {
          eventList.push(latestEvent);
        }

        // We start a new region.
        latestEvent = {
          time: timestamp,
          timeEnd: timestamp,
          annotation,
          title: self.resultTransformer.renderTemplate(titleFormat, series.metric),
          tags,
          text: self.resultTransformer.renderTemplate(textFormat, series.metric),
        };
      });
      if (latestEvent && latestEvent.timeEnd) {
        // finish up last point if we have one
        latestEvent.timeEnd = activeValuesTimestamps[activeValuesTimestamps.length - 1];
        eventList.push(latestEvent);
      }
    });

    return eventList;
    //return Promise.resolve([]);
  }

  getDashboardTime(date: any, roundUp: boolean) {
    if (typeof date === 'string') {
      date = dateMath.parse(date, roundUp);
    }

    return Math.ceil(date.valueOf() / 1000);
  }

  getTimeRange(): { start: number; end: number } {
    const range = this.timeSrv.timeRange();
    return {
      start: this.getDashboardTime(range.from, false),
      end: this.getDashboardTime(range.to, true),
    };
  }

  prepareTargets = (options: DataQueryRequest<MetricDataSourceQuery>, start: number, end: number) => {
    const queries: MetricQueryRequest[] = [];
    const activeTargets: MetricDataSourceQuery[] = [];

    for (const target of options.targets) {
      if (!target.sourceQuery.expr || target.hide) {
        continue;
      }

      target.sourceQuery.requestId = options.panelId + target.refId;

      if (options.app !== CoreApp.Explore) {
        activeTargets.push(target);
        queries.push(this.createQuery(target, options, start, end));
        continue;
      } else {
        target.sourceQuery.showingTable = true;
        target.sourceQuery.showingGraph = true;
      }

      if (target.sourceQuery.showingTable) {
        // create instant target only if Table is showed in Explore
        const instantTarget: any = cloneDeep(target);
        instantTarget.sourceQuery.format = 'table';
        instantTarget.sourceQuery.instant = true;
        instantTarget.sourceQuery.valueWithRefId = true;
        delete instantTarget.maxDataPoints;
        instantTarget.sourceQuery.requestId += '_instant';

        activeTargets.push(instantTarget);
        queries.push(this.createQuery(instantTarget, options, start, end));
      }

      if (target.sourceQuery.showingGraph) {
        // create time series target only if Graph is showed in Explore
        target.sourceQuery.format = 'time_series';
        target.sourceQuery.instant = false;

        activeTargets.push(target);
        queries.push(this.createQuery(target, options, start, end));
      }
    }

    return {
      queries,
      activeTargets,
    };
  };

  createQuery(
    target: MetricDataSourceQuery,
    options: DataQueryRequest<MetricDataSourceQuery>,
    start: number,
    end: number
  ) {
    const query: MetricQueryRequest = {
      sourceQuery: {
        source: target.sourceQuery.source,
        hinting: target.sourceQuery.hinting,
        instant: target.sourceQuery.instant,
        step: options.interval,
        expr: target.sourceQuery.expr,
        requestId: target.sourceQuery.requestId,
        start: start,
        end: end,
      },
      refId: target.refId,
      sourceType: target.sourceType,
    };

    const range = Math.ceil(end - start);

    // options.interval is the dynamically calculated interval
    let interval = rangeUtil.intervalToSeconds(options.interval);
    // Minimum interval ("Min step"), if specified for the query or datasource. or same as interval otherwise
    const minInterval = rangeUtil.intervalToSeconds(
      this.templateSrv.replace(target.sourceQuery.interval, options.scopedVars) || options.interval
    );
    const intervalFactor = target.sourceQuery.intervalFactor || 1;
    // Adjust the interval to take into account any specified minimum and interval factor plus Prometheus limits
    const adjustedInterval = this.adjustInterval(interval, minInterval, range, intervalFactor);
    let scopedVars = { ...options.scopedVars, ...this.getRangeScopedVars(options.range) };
    // If the interval was adjusted, make a shallow copy of scopedVars with updated interval vars
    if (interval !== adjustedInterval) {
      interval = adjustedInterval;
      scopedVars = Object.assign({}, options.scopedVars, {
        __interval: { text: interval + 's', value: interval + 's' },
        __interval_ms: { text: interval * 1000, value: interval * 1000 },
        ...this.getRangeScopedVars(options.range),
      });
    }
    query.sourceQuery.step = interval;

    let expr = target.sourceQuery.expr;

    // Apply adhoc filters
    const adhocFilters = this.templateSrv.getAdhocFilters(this.name);
    expr = adhocFilters.reduce((acc: string, filter: { key?: any; operator?: any; value?: any }) => {
      const { key, operator } = filter;
      let { value } = filter;
      if (operator === '=~' || operator === '!~') {
        value = prometheusRegularEscape(value);
      }
      return addLabelToQuery(acc, key, value, operator);
    }, expr);

    // Only replace vars in expression after having (possibly) updated interval vars
    query.sourceQuery.expr = this.templateSrv.replace(expr, scopedVars, this.interpolateQueryExpr);

    // Align query interval with step to allow query caching and to ensure
    // that about-same-time query results look the same.
    const adjusted = alignRange(start, end, query.sourceQuery.step, this.timeSrv.timeRange().to.utcOffset() * 60);
    query.sourceQuery.start = adjusted.start;
    query.sourceQuery.end = adjusted.end;
    this._addTracingHeaders(query, options);

    if(query.sourceQuery.source && !source_has_rbac[query.sourceQuery.source] ) {
      query.sourceQuery.headers['RBAC_Disabled'] = true;
    }
    return query;
  }

  _addTracingHeaders(httpOptions: MetricQueryRequest, options: DataQueryRequest<MetricDataSourceQuery>) {
    httpOptions.sourceQuery.headers = {};
    const proxyMode = !this.metricUrl.match(/^http/);
    if (proxyMode) {
      httpOptions.sourceQuery.headers['X-Dashboard-Id'] = options.dashboardId;
      httpOptions.sourceQuery.headers['X-Panel-Id'] = options.panelId;
    }
  }

  adjustInterval(interval: number, minInterval: number, range: number, intervalFactor: number) {
    // Prometheus will drop queries that might return more than 11000 data points.
    // Calculate a safe interval as an additional minimum to take into account.
    // Fractional safeIntervals are allowed, however serve little purpose if the interval is greater than 1
    // If this is the case take the ceil of the value.
    let safeInterval = range / 11000;
    if (safeInterval > 1) {
      safeInterval = Math.ceil(safeInterval);
    }
    return Math.max(interval * intervalFactor, minInterval, safeInterval);
  }

  interval_to_seconds = (str: string) => {
    const info = this.describe_interval(str);
    return info.sec * info.count;
  };

  interval_to_ms = (str: string) => {
    const info = this.describe_interval(str);
    return info.sec * 1000 * info.count;
  };

  describe_interval = (str: string) => {
    // Default to seconds if no unit is provided
    if (Number(str)) {
      return {
        sec: intervals_in_seconds.s,
        type: 's',
        count: parseInt(str, 10),
      };
    }

    const matches = str.match(interval_regex);
    if (!matches || !has(intervals_in_seconds, matches[2])) {
      throw new Error(
        `Invalid interval string, has to be either unit-less or end with one of the following units: "${Object.keys(
          intervals_in_seconds
        ).join(', ')}"`
      );
    } else {
      return {
        sec: intervals_in_seconds[matches[2]],
        type: matches[2],
        count: parseInt(matches[1], 10),
      };
    }
  };

  performInstantQuery(query: MetricQueryRequest, time: number) {
    const url = MetricConstants.METRIC_QUERY_URL;
    const data: any = {
      query: query.sourceQuery.expr,
      time,
    };

    // if (this.queryTimeout) {
    // data['timeout'] = this.queryTimeout;
    // }

    // for (const [key, value] of ds.customQueryParameters) {
    //     if (data[key] == null) {
    //         data[key] = value;
    //     }
    // }

    return this._request(url, data, {
      method: 'GET',
      requestId: query.sourceQuery.requestId,
      headers: query.sourceQuery.headers,
    })
      .then((response: any) => {
        return response;
      })
      .catch((err: any) => {
        if (err.cancelled) {
          return err;
        }

        throw this.handleErrors(err, query);
      });
  }

  performTimeSeriesQuery(query: MetricQueryRequest, start: number, end: number) {
    if (start > end) {
      throw { message: 'Invalid time range' };
    }

    const url = MetricConstants.METRIC_QUERYRANGE_URL;
    const data: any = {
      query: query.sourceQuery.expr,
      start,
      end,
      step: query.sourceQuery.step,
    };

    // if (this.queryTimeout) {
    //   data['timeout'] = this.queryTimeout;
    // }

    // for (const [key, value] of ds.customQueryParameters) {
    //   if (data[key] == null) {
    //     data[key] = value;
    //   }
    // }

    return this._request(url, data, {
      method: 'GET',
      requestId: query.sourceQuery.requestId,
      headers: query.sourceQuery.headers,
    })
      .then((response: any) => {
        return response;
      })
      .catch((err: any) => {
        if (err.cancelled) {
          return err;
        }

        throw this.handleErrors(err, query);
      });
  }

  _request(url: string, data: Record<string, string> | null = {}, options?: RequestOptions) {
    options = defaults(options || {}, {
      url: this.metricUrl + '/' + url,
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
      options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      options.transformRequest = (data: any) => $.param(data);
      options.data = data;
    }

    return getBackendSrv().datasourceRequest(options as Required<RequestOptions>);
  }

  handleErrors = (err: any, target: MetricQueryRequest) => {
    const error: DataQueryError = {
      message: (err && err.statusText) || 'Unknown error during query transaction. Please check JS console logs.',
      refId: target.refId,
    };

    if (err.data) {
      if (typeof err.data === 'string') {
        error.message = err.data;
      } else if (err.data.error) {
        error.message = safeStringifyValue(err.data.error);
      }
    } else if (err.message) {
      error.message = err.message;
    } else if (typeof err === 'string') {
      error.message = err;
    }

    error.status = err.status;
    error.statusText = err.statusText;

    return error;
  };

  processResult = (
    response: any,
    query: MetricQueryRequest,
    target: MetricDataSourceQuery,
    responseListLength: number
  ) => {
    // Keeping original start/end for transformers
    const transformerOptions = {
      source: target.sourceQuery.source,
      format: target.sourceQuery.format,
      step: query.sourceQuery.step,
      legendFormat: target.sourceQuery.legendFormat,
      start: query.sourceQuery.start,
      end: query.sourceQuery.end,
      query: query.sourceQuery.expr,
      responseListLength,
      refId: target.refId,
      valueWithRefId: target.sourceQuery.valueWithRefId,
      meta: {
        /** Fix for showing of Prometheus results in Explore table. We want to show result of instant query in table and the rest of time series in graph */
        preferredVisualisationType: query.sourceQuery.instant ? 'table' : 'graph',
      },
    };
    const series = this.resultTransformer.transform(response, transformerOptions);

    return series;
  };
  /*-- End --*/

  getOriginalMetricName(labelData: { [key: string]: string }) {
    return this.resultTransformer.getOriginalMetricName(labelData);
  }
}

export function prometheusRegularEscape(value: any) {
  return typeof value === 'string' ? value.replace(/'/g, "\\\\'") : value;
}

//removed . in replace for fixing devicename having issues
export function prometheusSpecialRegexEscape(value: any) {
  return typeof value === 'string'
    ? prometheusRegularEscape(value.replace(/\\/g, '\\\\\\\\').replace(/[$^*{}\[\]+?()|]/g, '\\\\$&'))
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
