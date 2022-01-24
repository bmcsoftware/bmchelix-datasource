import angular from 'angular';
import * as queryDef from './remedy_query_def';
import _ from 'lodash';
import {
  AnnotationEvent,
  DataSourceInstanceSettings,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  ScopedVars,
} from '@grafana/data';

import { getBackendSrv } from '@grafana/runtime';
import { BMCDataSourceOptions } from 'types';
import { HeaderList, RemedyRequestBody, RemedyDataSourceQuery } from './RemedyTypes';
import { RemedyQueryBuilder } from './remedy_query_builder';
import { RemedyResponse } from './remedy_response';
import { RemedyConstants } from './RemedyConstants';
import {
  DOT,
  COLON,
  COMMA,
  EMPTY,
  SPACE,
  KEYWORD_COLUMN,
  KEYWORD_FORM,
  DEFAULT_DATE_FORMAT,
  TABLE,
  NEWLINE,
  DEFAULT_DATE_TIME_FORMAT,
} from './remedy_literal_string';
import { BMCDataSource } from 'DataSource';

export class RemedyDatasource extends DataSourceApi<RemedyDataSourceQuery, BMCDataSourceOptions> {
  private static instance: RemedyDatasource;
  remedyUrl!: string;
  dsName!: string;

  /*-- Below variables will be removed once end to end integration happens. --*/
  index!: string;
  timeField!: string;
  interval!: string;
  authorization!: string;
  queryBuilder!: RemedyQueryBuilder;
  platformQueue!: string;

  /*-- End --*/
  /** @ngInject */
  private constructor(
    instanceSettings: DataSourceInstanceSettings<BMCDataSourceOptions>,
    private templateSrv: any,
    private backendSrv: any
  ) {
    super(instanceSettings);
    this.refreshSettings(instanceSettings);
  }

  refreshSettings(instSet: DataSourceInstanceSettings<BMCDataSourceOptions>) {
    this.remedyUrl = instSet.url as string;
    this.dsName = instSet.name;

    /*-- Below assignments will be removed once end to end integration happens. --*/
    const settingsData = instSet.jsonData || ({} as BMCDataSourceOptions);
    this.timeField = settingsData.timeField || 'headers.messageIngestedTimestamp';
    this.interval = settingsData.timeInterval || '10s';
    this.queryBuilder = new RemedyQueryBuilder();
    this.platformQueue = settingsData.platformQueue;
    /*-- End --*/
  }

  static getInstance(
    instSet: DataSourceInstanceSettings<BMCDataSourceOptions>,
    templateSrv: any,
    backendSrv: any
  ): RemedyDatasource {
    if (!RemedyDatasource.instance) {
      RemedyDatasource.instance = new RemedyDatasource(instSet, templateSrv, backendSrv);
    }
    RemedyDatasource.instance.refreshSettings(instSet);
    return RemedyDatasource.instance;
  }

  private request(method: string, url: string, data?: undefined, headers?: Array<{ key: string; value: string }>) {
    const options: any = {
      url: this.remedyUrl + '/' + url,
      method: method,
      data: data,
      headers: { Authorization: EMPTY },
    };
    let imsJWTToken: string = BMCDataSource.tokenObj.adeJWTToken;
    let loginId = 'Admin';
    if (
      this.backendSrv.dependencies &&
      this.backendSrv.dependencies.contextSrv &&
      this.backendSrv.dependencies.contextSrv.user
    ) {
      loginId = this.backendSrv.dependencies.contextSrv.user.Login;
      // Set User timezone
      //Commenting This code to fix DRJ71-2892 - Grafana panle is already converting TZ before rendering hence we dont need explicit conversion
      // options.headers[queryDef.HeaderFunctions.Timezone.arKey] =
      //   this.backendSrv.dependencies.contextSrv.user.timezone === 'browser'
      //     ? Intl.DateTimeFormat().resolvedOptions().timeZone
      //    : this.backendSrv.dependencies.contextSrv.user.timezone;    
      // Check/Set User locale against remedy locales
      options.headers[queryDef.HeaderFunctions.Locale.arKey] = queryDef.getRemedyLocale(
        this.backendSrv.dependencies.contextSrv.user.locale
      ).value;
    }
    // Add Headers, Override any user settings
    if (headers !== undefined) {
      headers.forEach((data) => {
        options.headers[data.key] = data.value;
      });
    }
    // Add Queue
    if (this.platformQueue !== undefined) {
      options.headers[queryDef.HeaderFunctions.Queue.arKey] = this.platformQueue;
    }

    // Helix dashboard client type
    options.headers['X-AR-Client-Type'] = 4021;

    if (imsJWTToken !== undefined) {
      options.headers['Authorization'] = 'IMS-JWT ' + imsJWTToken;
      options.headers['X-Requested-By'] = loginId;
    }

    if (method === 'GET') {
      options.headers = {
        'Content-Type': 'application/json',
        Accept: '*/*',
        Authorization: 'IMS-JWT ' + imsJWTToken,
        'X-Requested-By': loginId,
      };
    }
    return getBackendSrv().datasourceRequest(options);
  }

  private get(url: string) {
    return this.request('GET', url)
      .then((results: any) => {
        results.data.$$config = results.config;
        return results.data;
      })
      .catch((err: any) => {
        throw err;
      });
  }

  private post(url: string, data: any, header?: Array<{ key: string; value: string }>) {
    return this.request('POST', url, data, header)
      .then((results: any) => {
        results.data.$$config = results.config;
        return results.data;
      })
      .catch((err: any) => {
        if (err.data[0] && err.data[0].messageNumber && err.data[0].messageText) {
          throw {
            message:
              err.data[0].messageNumber +
              COLON +
              SPACE +
              err.data[0].messageText +
              (err.data[0].messageAppendedText ? COMMA + SPACE + err.data[0].messageAppendedText : DOT),
            error: err.data[0].messageNumber,
          };
        }

        throw err;
      });
  }

  async annotationQuery(options: any): Promise<any> {
    const annotation = options.annotation;
    const queryString = annotation.query || '*';
    const timeField = annotation.timeField || EMPTY;
    const timeEndField = annotation.timeEndField || EMPTY;
    const titleField = annotation.titleField || EMPTY;
    const textField = annotation.textField || EMPTY;
    const tagsField = annotation.tagsField || EMPTY;

    // required fields
    if (timeField === EMPTY || titleField === EMPTY) {
      return Promise.resolve([]);
    }

    const query = {
      date_time_format: DEFAULT_DATE_FORMAT,
      output_type: TABLE,
      sql: queryString,
    };
    const esQuery = angular.toJson(query);
    // Support: Variables
    let payload = this.variableSupport(esQuery, options);

    return this.post(RemedyConstants.REMEDY_QUERY_URL, payload).then((response: any) => {
      const getFieldIndexFromColumn = (columns: any, fieldName: any) => {
        for (let i = 0; i < columns.length; i++) {
          if (columns[i].text === fieldName) {
            return i;
          }
        }
        return -1;
      };

      const eventList: AnnotationEvent[] = [];
      const res = new RemedyResponse(response).getTableData('A').data[0];
      const rows = res.rows;
      const columns = res.columns;
      for (let i = 0; i < rows.length; i++) {
        let event: AnnotationEvent = {};
        event.annotation = annotation;
        if (timeField !== EMPTY) {
          let index = getFieldIndexFromColumn(columns, timeField);
          event.time = rows[i][index] ? rows[i][index] : EMPTY;
        }
        if (timeEndField !== EMPTY) {
          let index = getFieldIndexFromColumn(columns, timeEndField);
          event.timeEnd = rows[i][index] ? rows[i][index] : EMPTY;
        }
        if (titleField !== EMPTY) {
          let index = getFieldIndexFromColumn(columns, titleField);
          event.text = rows[i][index] ? rows[i][index] : EMPTY;
        }
        if (textField !== EMPTY) {
          let index = getFieldIndexFromColumn(columns, textField);
          // Add description as second line
          event.text = rows[i][index] ? event.text + NEWLINE + rows[i][index] : event.text;
        }
        if (tagsField !== EMPTY) {
          let index = getFieldIndexFromColumn(columns, tagsField);
          let data: string = EMPTY + rows[i][index];
          if (data) {
            event.tags = data.indexOf(COMMA) > -1 ? data.split(COMMA) : [data];
          }
        }
        eventList.push(event);
      }
      return eventList;
    });
  }

  interpolateVariablesInQueries(queries: RemedyDataSourceQuery[], scopedVars: ScopedVars): RemedyDataSourceQuery[] {
    let expandedQueries = queries;
    if (queries && queries.length > 0) {
      expandedQueries = queries.map((query) => {
        const expandedQuery = {
          ...query,
          datasource: this.name,
          query: this.templateSrv.replace(query.sourceQuery.rawQuery, scopedVars, this.interpolateVariable),
        };
        return expandedQuery;
      });
    }
    return expandedQueries;
  }

  async query(options: DataQueryRequest<RemedyDataSourceQuery>): Promise<DataQueryResponse> {
    const targets: RemedyDataSourceQuery[] = _.cloneDeep(options.targets);

    // add global adhoc filters to timeFilter
    const adhocFilters = this.templateSrv.getAdhocFilters(this.name);

    const data: any[] = [];
    let remedyHeaderFirst: Array<{ key: string; value: string }> | undefined = [];
    targets.forEach((target: any, index: any) => {
      if (!target.hide) {
        let remedyBody = new RemedyRequestBody(
          DEFAULT_DATE_FORMAT,
          DEFAULT_DATE_TIME_FORMAT,
          target.sourceQuery.formatAs,
          ''
        );
        let remedyHeader: Array<{ key: string; value: string }> | undefined = [];
        if (
          target.sourceQuery.header !== undefined &&
          target.sourceQuery.header.hideHeader !== undefined &&
          !target.sourceQuery.header.hideHeader
        ) {
          // Process/Split header values
          [remedyBody, remedyHeader] = this.processHeaderList(target.sourceQuery.header.headerList);
          // Pick only first Header Ignore rest
          if (index === 0) {
            remedyHeaderFirst = remedyHeader;
          }
        }
        // Build Request body
        let queryObj = this.queryBuilder.build(target, remedyBody, adhocFilters);
        data.push(queryObj);
      }
    });

    // Check if there is any payload
    // Backward compatibility: Support server w/o new api
    if (data.length === 1) {
      // Support: Variables
      let payload = this.variableSupport(angular.toJson(data[0]), options);
      return this.post(RemedyConstants.REMEDY_QUERY_URL, payload, remedyHeaderFirst).then((response: any) => {
        const res = new RemedyResponse(response);
        let returnData = res.getData();
        return returnData;
      });
    } else if (data.length >= 2) {
      // Support: Variables
      let payload = this.variableSupport(angular.toJson(data), options);
      return this.post(RemedyConstants.REMEDY_QUERIES_URL, payload, remedyHeaderFirst).then((response: any) => {
        const res = new RemedyResponse(response);
        let returnData = res.getData();
        return returnData;
      });
    } else {
      return Promise.resolve({ data: [] });
    }
  }

  quoteLiteral(value: any) {
    // Handle backslash data
    value = String(value).replace(/\\/g, '\\\\');
    // Handle single and double quote
    value = String(value).replace(/'/g, "\\\\'");
    value = String(value).replace(/\"/g, '\\"');
    return "'" + value + "'";
  }

  interpolateVariable = (value: string | string[], variable: { multi: any; includeAll: any }) => {
    let checkNumber: any = value;
    if (!isNaN(parseFloat(checkNumber)) && !isNaN(checkNumber - 0)) {
      return value;
    } else if (typeof value === 'string') {
      return this.quoteLiteral(value);
    } else if (Array.isArray(value)) {
      const quotedValues = _.map(value, (v) => {
        let checkNumber: any = v;
        if (!isNaN(parseFloat(checkNumber)) && !isNaN(0 - checkNumber)) {
          return v;
        } else if (typeof v === 'string') {
          return this.quoteLiteral(v);
        }
        return v;
      });
      return quotedValues.join(',');
    } else {
      return value;
    }
  };

  private variableSupport(esQuery: string, options: DataQueryRequest<RemedyDataSourceQuery>) {
    // Support: Variables
    let payload = this.templateSrv.replace(esQuery, options.scopedVars, this.interpolateVariable);
    // Support: Time Filter using regex match
    payload = payload.replace(/\$__/g, '$$');
    payload = payload.replace(/\$_/g, '$$');
    payload = payload.replace(/\$timeFilter\(([\w|\s|:|'|`|\.]*)\)/g, '$1 BETWEEN $timeFrom AND $timeTo');
    // Support: Millisecond epoch
    payload = payload.replace(/\$timeFrom/g, options.range.from.valueOf().toString());
    payload = payload.replace(/\$timeTo/g, options.range.to.valueOf().toString());
    payload = this.templateSrv.replace(payload, options.scopedVars);
    return payload;
  }

  metricFindData(query: any) {
    query = angular.fromJson(query);
    if (query) {
      if (query.find === KEYWORD_FORM) {
        return this.getForms(query);
      }
      if (query.find === KEYWORD_COLUMN) {
        return this.getColumns(query);
      }
    }
    return [];
  }

  getForms(query: any) {
    let result = this.get(RemedyConstants.REMEDY_METRIC_FORM_URL).then((result: any) => {
      let formNames: any[] = [];
      _.each(result, (name) => {
        formNames.push({ text: name, value: name });
      });
      return formNames;
    });
    return result;
  }

  getColumns(query: any) {
    let url = RemedyConstants.REMEDY_METRIC_COLUMN_URL + query.name + RemedyConstants.REMEDY_METRIC_COLUMN_QUERY_PARAM;
    let result = this.get(url).then((result: any) => {
      let columnNames: any[] = [];
      _.each(result, (column) => {
        if (column && column.name && column.field_option !== 'DISPLAY') {
          columnNames.push({ text: column.name, value: column.name });
        }
      });
      return columnNames;
    });
    return result;
  }

  metricFindQuery(query: any) {
    let sql = angular.fromJson(query).sql;
    if (sql) {
      const data: any[] = [];
      let queryObj = {
        date_time_format: DEFAULT_DATE_FORMAT,
        output_type: TABLE,
        sql,
      };
      // Support: Variables
      let payload = this.templateSrv.replace(angular.toJson(queryObj), {}, this.interpolateVariable);
      const returnData = this.post(RemedyConstants.REMEDY_QUERY_URL, payload).then((response: any) => {
        const res = new RemedyResponse(response);
        return res.getTableData('A');
      });
      data.push(returnData);
      return Promise.all(data).then((values) => {
        const fields: any = {};
        _.each(values, function (value, index) {
          _.each(value.data[0].rows, function (row, index) {
            // pick first, ignore rest column
            if (row[0] !== undefined) {
              fields[value.data[0].columns[0].text + ':' + row[0]] = {
                text: row[0],
                type: value.data[0].columns[0].type,
              };
            }
          });
        });
        // transform to array
        return _.map(fields, (value) => {
          return value;
        });
      });
    } else {
      return Promise.resolve([]);
    }
  }
  processHeaderList(headerList: HeaderList[]): [any, any] {
    const remedyRequestBody: RemedyRequestBody = new RemedyRequestBody(
      DEFAULT_DATE_FORMAT,
      DEFAULT_DATE_TIME_FORMAT,
      TABLE,
      ''
    );
    const remedyHeader: Array<{ key: string; value: string }> = [];
    headerList.forEach((header) => {
      switch (header.arKey) {
        case 'date_format':
          remedyRequestBody.date_format = header.value;
          break;
        case 'date_time_format':
          remedyRequestBody.date_time_format = header.value;
          break;
        case 'rowLimit':
          remedyRequestBody.rowLimit = header.value;
          break;
        default:
          // Add all other in header
          remedyHeader.push({ key: header.arKey, value: header.value });
          break;
      }
    });
    return [remedyRequestBody, remedyHeader];
  }

  testDatasource(): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
