import { JWT_TOKEN_STORAGE_KEY } from './../Constants';
import * as Constants from 'Constants';
import { Observable, of } from 'rxjs';
import { JWTTokenResponse } from 'TokenModel';
import { AuthHelper } from './AuthHelper';
import { map, catchError } from 'rxjs/operators';

export class EntAuthHelper extends AuthHelper {
  private static instance: EntAuthHelper;

  constructor() {
    super();
  }

  static getInstance() {
    if (!EntAuthHelper.instance) {
      EntAuthHelper.instance = new EntAuthHelper();
    }
    return EntAuthHelper.instance;
  }

  initToken(instSettings: any) {
    return this.getToken(instSettings);
  }

  getToken(instSettings: any) {
    let tokenObject = new JWTTokenResponse();
    const localStorageObject = localStorage.getItem(JWT_TOKEN_STORAGE_KEY);
    if (localStorageObject) {
      tokenObject = JSON.parse(localStorageObject);
    }
    if (!tokenObject || !tokenObject.adeJWTToken || tokenObject.expiry <= new Date().getTime()) {
      return this.refreshToken(instSettings);
    }
    return of(tokenObject);
  }

  private refreshToken(instSettings: any): Observable<JWTTokenResponse> {
    let payload = {
      access_key: instSettings.jsonData.accessKey,
      access_secret_key: instSettings.jsonData.secretKey,
      tenant_id: instSettings.jsonData.tenantId,
    };
    const requestJson = JSON.stringify(payload);
    return this.getJWTToken('/api/datasources/' + instSettings.id + '/resources', requestJson).pipe(
      map((tokenResponse: any) => {
        localStorage.setItem(JWT_TOKEN_STORAGE_KEY, JSON.stringify(tokenResponse));
        return tokenResponse;
      })
    );
  }

  private getJWTToken(url: any, payload: any): Observable<JWTTokenResponse> {
    const jwtToken = new JWTTokenResponse();
    return this.post(url, Constants.JWT_TOKEN_GEN_URL, payload).pipe(
      map((response: any) => {
        jwtToken.status = response.status;
        if (response && response.status === 200) {
          jwtToken.adeJWTToken = response.data.json_web_token;
          let currentTime = new Date();
          jwtToken.expiry = currentTime.setMinutes(currentTime.getMinutes() + 5);
        }
        return jwtToken;
      }),
      catchError((err: any) => {
        jwtToken.status = err.error;
        return of(jwtToken);
      })
    );
  }
}
