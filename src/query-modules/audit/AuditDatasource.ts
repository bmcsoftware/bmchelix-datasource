import _ from 'lodash';
import { BMCDataSourceOptions } from 'types';
import { AuditDataSourceQuery } from './AuditTypes';
import { AuditConstants } from './AuditConstants';
import { DataSourceInstanceSettings, DataQueryRequest, DataQueryResponse, DataSourceApi } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { BMCDataSource } from '../../datasource';
import TableModel from './table_model';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export class AuditDatasource extends DataSourceApi<AuditDataSourceQuery, BMCDataSourceOptions> {
  private static instance: AuditDatasource;
  auditUrl!: string;
  dsName!: string;

  
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
    this.auditUrl = instSet.url as string;
    this.dsName = instSet.name;
  }

  public static getInstance(
    instSet: DataSourceInstanceSettings<BMCDataSourceOptions>,
    templateSrv: any,
    timeSrv: any,
    backendSrv: any
  ): AuditDatasource {
    if (!AuditDatasource.instance) {
      AuditDatasource.instance = new AuditDatasource(instSet, templateSrv, timeSrv, backendSrv);
    }

    return AuditDatasource.instance;
  }

  query(options: DataQueryRequest<AuditDataSourceQuery>): Observable<DataQueryResponse> {
    const targets: AuditDataSourceQuery[] = _.cloneDeep(options.targets);
    let fromTimeRange;
    let toTimeRange;
    let searchQueryString;
    let selectQueryString;
    for (const target of targets) {
      if (target.hide) {
        continue;
      }
      if (target.sourceQuery && target.sourceQuery.searchQuery) {
        searchQueryString = this.templateSrv.replace(
          target.sourceQuery.searchQuery,
          options.scopedVars,
          this.interpolateVariable
        );
      }
      if (target.sourceQuery && target.sourceQuery.selectQuery) {
        selectQueryString = this.templateSrv.replace(
          target.sourceQuery.selectQuery,
          options.scopedVars,
          this.interpolateVariable
        );
      }
    }

    fromTimeRange = this.getDateTimeInUTCForAudit(options.range.from);
    toTimeRange = this.getDateTimeInUTCForAudit(options.range.to);

    const payload = {
      search_string: searchQueryString,
      select_string: selectQueryString,
      activity_from_date_time: fromTimeRange,
      activity_to_date_time: toTimeRange,
    };

    const url = AuditConstants.AUDIT_SEARCH_URL;

    return this.post(url, payload).pipe(
      map((auditData: any) => {
        return this.responseHandle(auditData);
      })
    );
  }

  getDateTimeInUTCForAudit(auditDateTime: any) {
    const date = auditDateTime.toDate();
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();

    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    const second = date.getUTCSeconds();

    return this.formateTime(year, month, day, hour, minute, second);
  }

  formateTime(year: any, month: any, date: any, hour: any, minute: any, second: any) {
    return (
      year +
      '-' +
      this.makeDoubleDigit(month) +
      '-' +
      this.makeDoubleDigit(date) +
      ' ' +
      this.makeDoubleDigit(hour) +
      ':' +
      this.makeDoubleDigit(minute) +
      ':' +
      this.makeDoubleDigit(second)
    );
  }

  makeDoubleDigit(x: any) {
    return x < 10 ? '0' + x : x;
  }

  responseHandle(auditData: any) {
    let finalResult = [];
    const table = new TableModel();
    table.type = 'table';
    if (auditData.data.data) {
      if (table.columns.length === 0) {
        for (const colKey of _.keys(auditData.data.data[0])) {
          table.addColumn({ text: colKey, type: 'String' });
        }

        for (const data of auditData.data.data) {
          table.rows.push(Object.values(data));
        }
      }
    }
    finalResult.push(table);
    return { data: finalResult };
  }
  testDatasource(): Promise<any> {
    throw new Error('Method not implemented.');
  }

  private request(method: string, url: string, data?: undefined) {
    const options: any = {
      url: this.auditUrl + '/' + url,
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
    return getBackendSrv().fetch(options);
  }

  post(url: string, data: any) {
    return this.request('POST', url, data).pipe(
      catchError((err: any) => {
        if (err.data && err.data.error) {
          return throwError({
            message: 'Error: ' + err.data.error.reason,
            error: err.data.error,
            status: err.status,
            statusText: err.statusText,
          });
        }
        throw err;
      })
    );
  }

  metricFindQuery(query: string) {
    let fromTimeRange;
    let toTimeRange;

    if (!query) {
      return Promise.resolve([]);
    }
    let data: any[] = [];
    const index = query.indexOf(',');
    const queryArr = [query.slice(0, index), query.slice(index + 1)];
    const searchQuery = queryArr[0].trim();
    const selectQuery = queryArr[1].trim();
    if (this.templateSrv.timeRange) {
      fromTimeRange = this.getDateTimeInUTCForAudit(this.templateSrv.timeRange.from);
      toTimeRange = this.getDateTimeInUTCForAudit(this.templateSrv.timeRange.to);
    }
    const payload = {
      search_string: searchQuery,
      select_string: selectQuery,
      activity_from_date_time: fromTimeRange,
      activity_to_date_time: toTimeRange,
    };
    const returnData = this.post(AuditConstants.AUDIT_SEARCH_URL, payload)
      .toPromise()
      .then((response: any) => {
        return this.responseHandle(response);
      });
    data.push(returnData);
    return Promise.all(data).then((values) => {
      const fields = values[0].data[0].rows.flat();
      return _.map(fields, (value) => {
        return { text: value };
      });
    });
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

  quoteLiteral(value: any) {
    // Handle backslash data
    value = String(value).replace(/\\/g, '\\\\');
    // Handle single and double quote
    value = String(value).replace(/'/g, "\\\\'");
    value = String(value).replace(/\"/g, '\\"');
    return "'" + value + "'";
  }

  annotationQuery(options: any): Promise<any> {
    return Promise.resolve([]);
  }
}
