import { getBackendSrv } from '@grafana/runtime';
import { BMCDataSourceQuery } from '../../../types';
import { DataQueryRequest, DataQueryResponse } from '@grafana/data';
import { BMCDataSource } from '../../../datasource';
import { catchError, map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export abstract class AbstCSRequestHandler {
  headerSettings: any = { 'Content-Type': 'application/json' };
  abstract handleRequest(
    ds: any,
    options: DataQueryRequest<BMCDataSourceQuery>,
    target: any
  ): Observable<DataQueryResponse>;

  post(ds: any, url: string, data: any) {
    return this.request(ds, 'POST', url, data).pipe(
      map((results: any) => {
        return results;
      }),
      catchError((err: any) => {
        if (err.data && err.data.error) {
          throw {
            message: 'Error: ' + err.data.error.reason,
            error: err.data.error,
          };
        }
        throw err;
      })
    );
  }

  request(ds: any, method: string, url: string, data?: undefined) {
    const options: any = {
      url: ds.csUrl + '/' + url,
      method: method,
      data: data,
      headers: this.headerSettings,
    };
    this.appendJWTToken(ds, options);
    return getBackendSrv().fetch(options);
  }

  appendJWTToken(ds: any, options: any) {
    let imsJWTToken: string = BMCDataSource.tokenObj.adeJWTToken;

    if (imsJWTToken !== undefined && imsJWTToken !== '') {
      options.headers['Authorization'] = 'Bearer ' + imsJWTToken;
    } else {
      console.log('Unable to get JWT token.');
    }
  }
}
