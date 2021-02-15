import { getBackendSrv } from '@grafana/runtime';

export class AuthHelper {
  constructor() {}

  async post(url: any, restEndPoint: string, data: any) {
    try {
      const results = await this.request(url, 'POST', restEndPoint, data);
      return results;
    } catch (err) {
      if (err.data && err.data.error) {
        throw {
          message: 'Error: ' + err.data.error.reason,
          error: err.data.error,
        };
      }

      throw err;
    }
  }

  private request(url: any, method: string, restEndPoint: string, data?: undefined) {
    const options: any = {
      url: url + '/' + restEndPoint,
      method: method,
      data: data,
    };
    return getBackendSrv().datasourceRequest(options);
  }
}
