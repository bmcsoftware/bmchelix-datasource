import { cloneDeep, first as _first, isNumber, isObject, isString, map as _map } from 'lodash';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { getBackendSrv } from '@grafana/runtime';
import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  getDefaultTimeRange,
  MetricFindValue,
  ScopedVars,
  TimeRange,
  toUtc,
} from '@grafana/data';

import { IndexPattern } from './index_pattern';
import { BMCDataSourceOptions } from 'types';
import { LogDataSourceQuery, TermsQuery } from './logTypes';
import { LogQueryBuilder } from './log_query_builder';
import { LogResponse } from './log_response';
import { LogConstants } from './LogConstants';
import { BMCDataSource } from '../../datasource';
import { BucketAggregation } from 'modules/event/components/QueryEditor/BucketAggregationsEditor/aggregations';

export class LogDatasource extends DataSourceApi<LogDataSourceQuery, BMCDataSourceOptions> {
  private static instance: LogDatasource;
  eventUrl!: string;
  dsName!: string;

  /*-- Below variables will be removed once end to end integration happens. --*/
  /*-- Below variables will be removed once end to end integration happens. --*/
  index!: string;
  timeField!: string;
  interval!: string;
  queryBuilder!: LogQueryBuilder;
  indexPattern!: IndexPattern;

  private constructor(
    instanceSettings: DataSourceInstanceSettings<BMCDataSourceOptions>,
    private templateSrv: any,
    private timeSrv: any
  ) {
    super(instanceSettings);
    this.refreshSettings(instanceSettings);
  }

  refreshSettings(instSet: DataSourceInstanceSettings<BMCDataSourceOptions>) {
    this.eventUrl = instSet.url as string;
    this.dsName = instSet.name;

    /*-- Below assignments will be removed once end to end integration happens. --*/
    const settingsData = instSet.jsonData || ({} as BMCDataSourceOptions);
    this.timeField = settingsData.timeField || '@timestamp';
    this.indexPattern = new IndexPattern(this.index, settingsData.interval);
    this.interval = settingsData.timeInterval || '10s';
    this.queryBuilder = new LogQueryBuilder({
      timeField: this.timeField,
    });
    /*-- End --*/
  }

  public static getInstance(
    instSet: DataSourceInstanceSettings<BMCDataSourceOptions>,
    templateSrv: any,
    timeSrv: any
  ): LogDatasource {
    if (!LogDatasource.instance) {
      LogDatasource.instance = new LogDatasource(instSet, templateSrv, timeSrv);
    }
    LogDatasource.instance.refreshSettings(instSet);
    return LogDatasource.instance;
  }

  private request(method: string, url: string, data?: undefined): Observable<any> {
    const options: any = {
      url: this.eventUrl + '/' + url,
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
    return getBackendSrv()
      .fetch<any>(options)
      .pipe(
        map((results) => {
          results.data.$$config = results.config;
          return results.data;
        })
      );
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
    return this.request('GET', url);
  }

  /*private async requestAllIndices(indexList: string[], url: string): Promise<any> {
    const maxTraversals = 7; // do not go beyond one week (for a daily pattern)
    const listLen = indexList.length;
    for (let i = 0; i < Math.min(listLen, maxTraversals); i++) {
      try {
        return await this.request('GET', indexList[listLen - i - 1] + url);
      } catch (err) {
        if (err.status !== 404 || i === maxTraversals - 1) {
          throw err;
        }
      }
    }
  }*/

  private post(url: string, data: any) {
    return this.request('POST', url, data).pipe(
      catchError((err) => {
        if (err.data) {
          const message = err.data.error?.root_cause?.reason ?? err.data.error.root_cause.reason ?? 'Unknown error';

          return throwError({
            message: 'Elasticsearch error: ' + message,
            error: err.data.error,
          });
        }

        return throwError(err);
      })
    );
  }

  async annotationQuery(options: any): Promise<any> {
    const annotation = options.annotation;
    const timeField = annotation.timeField || '@timestamp';
    const timeEndField = annotation.timeEndField || null;
    const queryString = annotation.query || '*';
    const tagsField = annotation.tagsField || 'tags';
    const textField = annotation.textField || null;
    const sizeField = annotation.sizeField || 10000;

    const dateRanges = [];
    const rangeStart: any = {};
    rangeStart[timeField] = {
      from: options.range.from.valueOf(),
      to: options.range.to.valueOf(),
      format: 'epoch_millis',
    };
    dateRanges.push({ range: rangeStart });

    if (timeEndField) {
      const rangeEnd: any = {};
      rangeEnd[timeEndField] = {
        from: options.range.from.valueOf(),
        to: options.range.to.valueOf(),
        format: 'epoch_millis',
      };
      dateRanges.push({ range: rangeEnd });
    }

    const queryInterpolated = this.interpolateLuceneQuery(queryString);
    const query: any = {
      bool: {
        filter: [
          {
            bool: {
              should: dateRanges,
              minimum_should_match: 1,
            },
          },
        ],
      },
    };

    if (queryInterpolated) {
      query.bool.filter.push({
        query_string: {
          query: queryInterpolated,
        },
      });
    }
    const data: any = {
      query,
      size: sizeField,
    };

    // BMC change to not send header in the payload
    // const header: any = {
    //   search_type: 'query_then_fetch',
    //   ignore_unavailable: true,
    // };

    // // old elastic annotations had index specified on them
    // if (annotation.index) {
    //   header.index = annotation.index;
    // } else {
    //   header.index = this.indexPattern.getIndexList(options.range.from, options.range.to);
    // }

    const payload = JSON.stringify(data) + '\n';

    return this.post(LogConstants.LOG_MSEARCH_URL, payload)
      .toPromise()
      .then((res: any) => {
        const list = [];
        const hits = res.responses[0].hits.hits;

        const getFieldFromSource = (source: any, fieldName: any) => {
          if (!fieldName) {
            return;
          }

          const fieldNames = fieldName.split('.');
          let fieldValue = source;

          for (let i = 0; i < fieldNames.length; i++) {
            fieldValue = fieldValue[fieldNames[i]];
            if (!fieldValue) {
              console.log('could not find field in annotation: ', fieldName);
              return '';
            }
          }

          return fieldValue;
        };

        for (let i = 0; i < hits.length; i++) {
          const source = hits[i]._source;
          let time = getFieldFromSource(source, timeField);
          if (typeof hits[i].fields !== 'undefined') {
            const fields = hits[i].fields;
            if (isString(fields[timeField]) || isNumber(fields[timeField])) {
              time = fields[timeField];
            }
          }

          const event: {
            annotation: any;
            time: number;
            timeEnd?: number;
            text: string;
            tags: string | string[];
          } = {
            annotation: annotation,
            time: toUtc(time).valueOf(),
            text: getFieldFromSource(source, textField),
            tags: getFieldFromSource(source, tagsField),
          };

          if (timeEndField) {
            const timeEnd = getFieldFromSource(source, timeEndField);
            if (timeEnd) {
              event.timeEnd = toUtc(timeEnd).valueOf();
            }
          }

          // legacy support for title tield
          if (annotation.titleField) {
            const title = getFieldFromSource(source, annotation.titleField);
            if (title) {
              event.text = title + '\n' + event.text;
            }
          }

          if (typeof event.tags === 'string') {
            event.tags = event.tags.split(',');
          }

          list.push(event);
        }
        return list;
      });
  }

  private interpolateLuceneQuery(queryString: string, scopedVars?: ScopedVars) {
    return this.templateSrv.replace(queryString, scopedVars, 'lucene');
  }

  interpolateVariablesInQueries(queries: LogDataSourceQuery[], scopedVars: ScopedVars): LogDataSourceQuery[] {
    // We need a separate interpolation format for lucene queries, therefore we first interpolate any
    // lucene query string and then everything else
    const interpolateBucketAgg = (bucketAgg: BucketAggregation): BucketAggregation => {
      if (bucketAgg.type === 'filters') {
        return {
          ...bucketAgg,
          settings: {
            ...bucketAgg.settings,
            filters: bucketAgg.settings?.filters?.map((filter) => ({
              ...filter,
              query: this.interpolateLuceneQuery(filter.query, scopedVars) || '*',
            })),
          },
        };
      }

      return bucketAgg;
    };

    const expandedQueries = queries.map(
      (query): LogDataSourceQuery => ({
        ...query,
        sourceQuery: {
          ...query.sourceQuery,
          query: this.interpolateLuceneQuery(query.sourceQuery.query || '', scopedVars),
          bucketAggs: query.sourceQuery.bucketAggs?.map(interpolateBucketAgg),
        },
      })
    );

    const finalQueries: LogDataSourceQuery[] = JSON.parse(
      this.templateSrv.replace(JSON.stringify(expandedQueries), scopedVars)
    );

    return finalQueries;
  }

  query(options: DataQueryRequest<LogDataSourceQuery>): Observable<DataQueryResponse> {
    let payload = '';
    const targets = this.interpolateVariablesInQueries(cloneDeep(options.targets), options.scopedVars);
    const sentTargets: LogDataSourceQuery[] = [];

    // add global adhoc filters to timeFilter
    const adhocFilters = this.templateSrv.getAdhocFilters(this.name);

    for (const target of targets) {
      if (target.hide) {
        continue;
      }

      let queryObj;

      if (target.sourceQuery && target.sourceQuery.alias) {
        target.sourceQuery.alias = this.interpolateLuceneQuery(target.sourceQuery.alias, options.scopedVars);
      }

      queryObj = this.queryBuilder.build(target.sourceQuery, adhocFilters);

      const esQuery = JSON.stringify(queryObj);

      payload += esQuery + '\n';

      sentTargets.push(target);
    }

    if (sentTargets.length === 0) {
      return of({ data: [] });
    }

    // We replace the range here for actual values. We need to replace it together with enclosing "" so that we replace
    // it as an integer not as string with digits. This is because elastic will convert the string only if the time
    // field is specified as type date (which probably should) but can also be specified as integer (millisecond epoch)
    // and then sending string will error out.
    payload = payload.replace(/"\$timeFrom"/g, options.range.from.valueOf().toString());
    payload = payload.replace(/"\$timeTo"/g, options.range.to.valueOf().toString());
    payload = this.templateSrv.replace(payload, options.scopedVars);

    const url = this.getMultiSearchUrl();

    return this.post(url, payload).pipe(
      map((res) => {
        const er = new LogResponse(sentTargets, res);

        return er.getTimeSeries();
      })
    );
  }

  getFields(type?: string[], range?: TimeRange): Observable<MetricFindValue[]> {
    return this.get(LogConstants.LOG_MAPPING_URL).pipe(
      map((result: any) => {
        const typeMap: Record<string, string> = {
          float: 'number',
          double: 'number',
          integer: 'number',
          long: 'number',
          date: 'date',
          string: 'string',
          text: 'string',
          scaled_float: 'number',
          nested: 'nested',
        };

        const shouldAddField = (obj: any, key: string) => {
          if (key[0] === '_') {
            return false;
          }

          if (!type || type.length === 0) {
            return true;
          }

          // equal query type filter, or via typemap translation
          return type.includes(obj.type) || type.includes(typeMap[obj.type]);
        };

        // Store subfield names: [system, process, cpu, total] -> system.process.cpu.total
        const fieldNameParts: any = [];
        const fields: any = {};

        function getFieldsRecursively(obj: any) {
          for (const key in obj) {
            const subObj = obj[key];

            // Check mapping field for nested fields
            if (isObject(subObj.properties)) {
              fieldNameParts.push(key);
              getFieldsRecursively(subObj.properties);
            }

            if (isObject(subObj.fields)) {
              fieldNameParts.push(key);
              getFieldsRecursively(subObj.fields);
            }

            if (isString(subObj.type)) {
              const fieldName = fieldNameParts.concat(key).join('.');

              // Hide meta-fields and check field type
              if (shouldAddField(subObj, key)) {
                fields[fieldName] = {
                  text: fieldName,
                  type: subObj.type,
                };
              }
            }
          }
          fieldNameParts.pop();
        }

        for (const indexName in result) {
          const index = result[indexName];
          if (index && index.mappings) {
            const mappings = index.mappings;
            const properties = mappings.properties;
            getFieldsRecursively(properties);
          }
        }

        // transform to array
        return _map(fields, (value) => {
          return value;
        });
      })
    );
  }

  getTerms(queryDef: TermsQuery, range = getDefaultTimeRange()): Observable<MetricFindValue[]> {
    const dashboardRange = this.timeSrv.timeRange();
    let esQuery = JSON.stringify(this.queryBuilder.getTermsQuery(queryDef));

    esQuery = esQuery.replace(/\$timeFrom/g, dashboardRange.from.valueOf().toString());
    esQuery = esQuery.replace(/\$timeTo/g, dashboardRange.to.valueOf().toString());
    esQuery = esQuery + '\n';

    const url = this.getMultiSearchUrl();

    return this.post(url, esQuery).pipe(
      map((res) => {
        if (!res.responses[0].aggregations) {
          return [];
        }

        const buckets = res.responses[0].aggregations['1'].buckets;
        return _map(buckets, (bucket) => {
          return {
            text: bucket.key_as_string || bucket.key,
            value: bucket.key,
          };
        });
      })
    );
  }

  getMultiSearchUrl() {
    return LogConstants.LOG_MSEARCH_URL;
  }

  metricFindQuery(query: string, options?: any): Promise<MetricFindValue[]> {
    const range = options?.range;
    const parsedQuery = JSON.parse(query);
    if (query) {
      if (parsedQuery.find === 'fields') {
        parsedQuery.type = this.interpolateLuceneQuery(parsedQuery.type);
        return this.getFields(parsedQuery.type, range).toPromise();
      }

      if (parsedQuery.find === 'terms') {
        parsedQuery.field = this.interpolateLuceneQuery(parsedQuery.field);
        parsedQuery.query = this.interpolateLuceneQuery(parsedQuery.query || '*');
        return this.getTerms(parsedQuery, range).toPromise();
      }
    }

    return Promise.resolve([]);
  }

  getTagKeys() {
    return this.getFields().toPromise();
  }

  getTagValues(options: any) {
    return this.getTerms({ field: options.key, query: '*' }).toPromise();
  }

  targetContainsTemplate(target: any) {
    if (
      this.templateSrv.variableExists(target.sourceQuery.query) ||
      this.templateSrv.variableExists(target.sourceQuery.alias)
    ) {
      return true;
    }

    for (const bucketAgg of target.sourceQuery.bucketAggs) {
      if (this.templateSrv.variableExists(bucketAgg.field) || this.objectContainsTemplate(bucketAgg.settings)) {
        return true;
      }
    }

    for (const metric of target.sourceQuery.metrics) {
      if (
        this.templateSrv.variableExists(metric.field) ||
        this.objectContainsTemplate(metric.settings) ||
        this.objectContainsTemplate(metric.meta)
      ) {
        return true;
      }
    }

    return false;
  }

  private isPrimitive(obj: any) {
    if (obj === null || obj === undefined) {
      return true;
    }
    if (['string', 'number', 'boolean'].some((type) => type === typeof true)) {
      return true;
    }

    return false;
  }

  private objectContainsTemplate(obj: any) {
    if (!obj) {
      return false;
    }

    for (const key of Object.keys(obj)) {
      if (this.isPrimitive(obj[key])) {
        if (this.templateSrv.variableExists(obj[key])) {
          return true;
        }
      } else if (Array.isArray(obj[key])) {
        for (const item of obj[key]) {
          if (this.objectContainsTemplate(item)) {
            return true;
          }
        }
      } else {
        if (this.objectContainsTemplate(obj[key])) {
          return true;
        }
      }
    }

    return false;
  }

  testDatasource(): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
