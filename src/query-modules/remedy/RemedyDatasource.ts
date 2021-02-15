import angular from 'angular';
import _ from 'lodash';
import { DataSourceInstanceSettings, DataQueryRequest, DataQueryResponse, DataSourceApi } from '@grafana/data';

import { getBackendSrv } from '@grafana/runtime';
import { BMCDataSourceOptions } from 'types';
import { RemedyDataSourceQuery } from './RemedyTypes';
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
} from './remedy_literal_string';
import TableModel from 'grafana/app/core/table_model';
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

  private request(method: string, url: string, data?: undefined) {
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
      this.backendSrv.dependencies.contextSrv.user &&
      this.backendSrv.dependencies.contextSrv.user.adeJWTToken
    ) {
      imsJWTToken = this.backendSrv.dependencies.contextSrv.user.adeJWTToken;
      loginId = this.backendSrv.dependencies.contextSrv.user.Login;
    }
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

  private post(url: string, data: any) {
    return this.request('POST', url, data)
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

  async query(options: DataQueryRequest<RemedyDataSourceQuery>): Promise<DataQueryResponse> {
    const targets: RemedyDataSourceQuery[] = _.cloneDeep(options.targets);

    // add global adhoc filters to timeFilter
    const adhocFilters = this.templateSrv.getAdhocFilters(this.name);

    const data: any[] = [];
    for (const target of targets) {
      if (target.hide) {
        continue;
      }

      let queryObj;
      queryObj = this.queryBuilder.build(target, adhocFilters);
      const esQuery = angular.toJson(queryObj);

      // Support: Variable
      let payload = this.variableSupport(esQuery, options);

      // this.remedyUrl;
      const returnData = this.post(RemedyConstants.REMEDY_QUERY_URL, payload).then((response: any) => {
        const res = new RemedyResponse(response);

        if (target.sourceQuery.formatAs === TABLE) {
          return res.getTableData(target.refId);
        } else {
          return res.getTimeSeries(target.refId);
        }
      });
      data.push(returnData);
    }
    if (data.length > 0) {
      return Promise.all(data).then(values => {
        if (values.length > 1) {
          let seriesList = this.mergeTable(values);
          if (seriesList && seriesList[0].columns.length > 0) {
            return {
              data: seriesList,
            };
          }
        }
        // Return First Element
        return {
          data: values[0].data,
        };
      });
    } else {
      return Promise.resolve({ data: [] });
    }
  }

  private variableSupport(esQuery: string, options: DataQueryRequest<RemedyDataSourceQuery>) {
    // Support: Variables
    let payload = this.templateSrv.replace(esQuery, options.scopedVars, 'sqlstring');

    // Support: Millisecond epoch
    payload = payload.replace(/\$timeFrom/g, options.range.from.valueOf().toString());
    payload = payload.replace(/\$timeTo/g, options.range.to.valueOf().toString());
    payload = this.templateSrv.replace(payload, options.scopedVars);
    return payload;
  }

  mergeTable(values: any) {
    let caller = this;
    const seriesList: any[] = [];
    const table = new TableModel();
    table.rows = [];
    _.each(values, function(value, index) {
      if (value.type === 'table') {
        table.type = 'table';
        table.columns = table.columns.concat(value.data[0].columns);
        if (table.rows.length > 0) {
          table.rows = caller.addColumn(table.rows, value.data[0].rows);
        } else {
          table.rows = value.data[0].rows;
        }
      }
    });
    seriesList.push(table);
    return seriesList;
  }

  addColumn(rows: any[], newColumn: any[]) {
    _.each(rows, function(column, index) {
      column[column.length] = newColumn[index];
    });
    return rows;
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
    console.log('Form Query: ' + RemedyConstants.REMEDY_METRIC_FORM_URL);
    let result = this.get(RemedyConstants.REMEDY_METRIC_FORM_URL).then((result: any) => {
      let formNames: any[] = [];
      console.log('Form Result: ' + result.length);
      _.each(result, name => {
        formNames.push({ text: name, value: name });
      });
      return formNames;
    });
    return result;
  }

  getColumns(query: any) {
    let url = RemedyConstants.REMEDY_METRIC_COLUMN_URL + query.name + RemedyConstants.REMEDY_METRIC_COLUMN_QUERY_PARAM;
    console.log('Column Query: ' + url);
    let result = this.get(url).then((result: any) => {
      let columnNames: any[] = [];
      console.log('Column Result: ' + result.length);
      _.each(result, column => {
        if (column && column.name && column.field_option !== 'DISPLAY') {
          columnNames.push({ text: column.name, value: column.name });
        }
      });
      console.log('Column Result reduced: ' + columnNames.length);
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
      let payload = angular.toJson(queryObj);
      const returnData = this.post(RemedyConstants.REMEDY_QUERY_URL, payload).then((response: any) => {
        const res = new RemedyResponse(response);
        return res.getTableData('A');
      });
      data.push(returnData);
      return Promise.all(data).then(values => {
        const fields: any = {};
        _.each(values, function(value, index) {
          _.each(value.data[0].rows, function(row, index) {
            // pick first, ignore rest column
            if (row[0] !== undefined) {
              fields[value.data[0].columns[0].text + ':' + row[0]] = {
                text: row[0],
                type: value.data[0].columns[0].type,
              };
            }
          });
        });
        // console.log('fields: ' + JSON.stringify(fields));
        // transform to array
        return _.map(fields, value => {
          return value;
        });
      });
    } else {
      return Promise.resolve([]);
    }
  }

  testDatasource(): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
