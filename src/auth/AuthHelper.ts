import { getBackendSrv } from '@grafana/runtime';
import { catchError } from 'rxjs/operators';

export class AuthHelper {
  constructor() {}

  post(url: any, restEndPoint: string, data: any) {
    return this.request(url, 'POST', restEndPoint, data).pipe(
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

  private request(url: any, method: string, restEndPoint: string, data?: undefined) {
    const options: any = {
      url: url + '/' + restEndPoint,
      method: method,
      data: data,
    };
    return getBackendSrv().fetch(options);
  }
}
