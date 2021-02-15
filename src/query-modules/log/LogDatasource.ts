import angular from 'angular';
import _ from 'lodash';
import {
  DataSourceInstanceSettings,
  DataQueryRequest,
  DataQueryResponse,
  ScopedVars,
  DataSourceApi,
} from '@grafana/data';

import { IndexPattern } from './index_pattern';
import { toUtc } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { BMCDataSourceOptions } from 'types';
import { LogDataSourceQuery } from './logTypes';
import { LogQueryBuilder } from './log_query_builder';
import { LogResponse } from './log_response';
import { LogConstants } from './LogConstants';
import { BMCDataSource } from '../../DataSource';

export class LogDatasource extends DataSourceApi<LogDataSourceQuery, BMCDataSourceOptions> {
  private static instance: LogDatasource;
  logUrl!: string;
  dsName!: string;

  /*-- Below variables will be removed once end to end integration happens. --*/
  /*-- Below variables will be removed once end to end integration happens. --*/
  index!: string;
  timeField!: string;
  interval!: string;
  queryBuilder!: LogQueryBuilder;
  indexPattern!: IndexPattern;

  /*-- End --*/
  /** @ngInject */
  private constructor(
    instanceSettings: DataSourceInstanceSettings<BMCDataSourceOptions>,
    private templateSrv: any,
    private timeSrv: any
  ) {
    super(instanceSettings);
    this.refreshSettings(instanceSettings);
  }

  refreshSettings(instSet: DataSourceInstanceSettings<BMCDataSourceOptions>) {
    this.logUrl = instSet.url as string;
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

  private request(method: string, url: string, data?: undefined) {
    const options: any = {
      url: this.logUrl + '/' + url,
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
    return this.request('POST', url, data)
      .then((results: any) => {
        results.data.$$config = results.config;
        return results.data;
      })
      .catch((err: any) => {
        if (err.data && err.data.error) {
          throw {
            message: 'Elasticsearch error: ' + err.data.error.reason,
            error: err.data.error,
          };
        }

        throw err;
      });
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

    const queryInterpolated = this.templateSrv.replace(queryString, {}, 'lucene');
    const query = {
      bool: {
        filter: [
          {
            bool: {
              should: dateRanges,
              minimum_should_match: 1,
            },
          },
          {
            query_string: {
              query: queryInterpolated,
            },
          },
        ],
      },
    };

    const data: any = {
      query,
      size: sizeField,
    };

    const payload = angular.toJson(data) + '\n';

    return this.post(LogConstants.LOG_MSEARCH_URL, payload).then((res: any) => {
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
          if (_.isString(fields[timeField]) || _.isNumber(fields[timeField])) {
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

  interpolateVariablesInQueries(queries: LogDataSourceQuery[], scopedVars: ScopedVars): LogDataSourceQuery[] {
    let expandedQueries = queries;
    if (queries && queries.length > 0) {
      expandedQueries = queries.map(query => {
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

  async query(options: DataQueryRequest<LogDataSourceQuery>): Promise<DataQueryResponse> {
    let payload = '';
    const targets = _.cloneDeep(options.targets);
    const sentTargets: LogDataSourceQuery[] = [];

    // add global adhoc filters to timeFilter
    const adhocFilters = this.templateSrv.getAdhocFilters(this.name);

    for (const target of targets) {
      if (target.hide) {
        continue;
      }

      let queryString = this.templateSrv.replace(target.sourceQuery.query, options.scopedVars, 'lucene');
      // Elasticsearch queryString should always be '*' if empty string
      if (!queryString || queryString === '') {
        queryString = '*';
      }

      let queryObj;

      if (target.sourceQuery.alias) {
        target.sourceQuery.alias = this.templateSrv.replace(target.sourceQuery.alias, options.scopedVars, 'lucene');
      }

      queryObj = this.queryBuilder.build(target.sourceQuery, adhocFilters, queryString);

      const esQuery = angular.toJson(queryObj);

      payload += esQuery + '\n';

      sentTargets.push(target);
    }

    if (sentTargets.length === 0) {
      return Promise.resolve({ data: [] });
    }

    // We replace the range here for actual values. We need to replace it together with enclosing "" so that we replace
    // it as an integer not as string with digits. This is because elastic will convert the string only if the time
    // field is specified as type date (which probably should) but can also be specified as integer (millisecond epoch)
    // and then sending string will error out.
    payload = payload.replace(/"\$timeFrom"/g, options.range.from.valueOf().toString());
    payload = payload.replace(/"\$timeTo"/g, options.range.to.valueOf().toString());
    payload = this.templateSrv.replace(payload, options.scopedVars);

    const url = this.getMultiSearchUrl();

    return this.post(url, payload).then((res: any) => {
      const er = new LogResponse(sentTargets, res);

      return er.getTimeSeries();
    });
  }

  async getFields(query: any) {
    return this.get(LogConstants.LOG_MAPPING_URL).then((result: any) => {
      const typeMap: any = {
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

      function shouldAddField(obj: any, key: any, query: any) {
        if (key[0] === '_') {
          return false;
        }

        if (!query.type) {
          return true;
        }

        // equal query type filter, or via typemap translation
        return query.type === obj.type || query.type === typeMap[obj.type];
      }

      // Store subfield names: [system, process, cpu, total] -> system.process.cpu.total
      const fieldNameParts: any = [];
      const fields: any = {};

      function getFieldsRecursively(obj: any) {
        for (const key in obj) {
          const subObj = obj[key];

          // Check mapping field for nested fields
          if (_.isObject(subObj.properties)) {
            fieldNameParts.push(key);
            getFieldsRecursively(subObj.properties);
          }

          if (_.isObject(subObj.fields)) {
            fieldNameParts.push(key);
            getFieldsRecursively(subObj.fields);
          }

          if (_.isString(subObj.type)) {
            const fieldName = fieldNameParts.concat(key).join('.');

            // Hide meta-fields and check field type
            if (shouldAddField(subObj, key, query)) {
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
      return _.map(fields, value => {
        return value;
      });
    });
  }

  getTerms(queryDef: any) {
    const range = this.timeSrv.timeRange();
    let esQuery = angular.toJson(this.queryBuilder.getTermsQuery(queryDef));

    esQuery = esQuery.replace(/\$timeFrom/g, range.from.valueOf().toString());
    esQuery = esQuery.replace(/\$timeTo/g, range.to.valueOf().toString());
    esQuery = esQuery + '\n';

    const url = this.getMultiSearchUrl();

    return this.post(url, esQuery).then((res: any) => {
      if (!res.responses[0].aggregations) {
        return [];
      }

      const buckets = res.responses[0].aggregations['1'].buckets;
      return _.map(buckets, bucket => {
        return {
          text: bucket.key_as_string || bucket.key,
          value: bucket.key,
        };
      });
    });
  }

  getMultiSearchUrl() {
    return LogConstants.LOG_MSEARCH_URL;
  }

  metricFindQuery(query: any) {
    query = angular.fromJson(query);
    if (query) {
      if (query.find === 'fields') {
        query.field = this.templateSrv.replace(query.field, {}, 'lucene');
        return this.getFields(query);
      }

      if (query.find === 'terms') {
        query.field = this.templateSrv.replace(query.field, {}, 'lucene');
        query.query = this.templateSrv.replace(query.query || '*', {}, 'lucene');
        return this.getTerms(query);
      }
    }

    return Promise.resolve([]);
  }

  getTagKeys() {
    return this.getFields({});
  }

  getTagValues(options: any) {
    return this.getTerms({ field: options.key, query: '*' });
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
    if (['string', 'number', 'boolean'].some(type => type === typeof true)) {
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
