import { getBackendSrv } from '@grafana/runtime';

export class AuthHelper {
  constructor() {}

  async post(url: any) {
    try {
      const results = await this.request(url, 'POST');
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



  private request(url: any, method: string) {
    const options: any = {
      url: url,
      method: method
    };
    return getBackendSrv().datasourceRequest(options);
  }
  
}
