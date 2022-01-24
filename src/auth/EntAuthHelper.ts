import { JWT_TOKEN_STORAGE_KEY } from './../Constants';
import * as Constants from 'Constants';
import { from, Observable } from 'rxjs';
import { JWTTokenResponse } from 'TokenModel';
import { AuthHelper } from './AuthHelper';

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

  async initToken(instSettings: any) {
    return this.getToken(instSettings);
  }

  async getToken(instSettings: any) {
    let tokenObject = new JWTTokenResponse();
    const localStorageObject = localStorage.getItem(JWT_TOKEN_STORAGE_KEY);
    if (localStorageObject) {
      tokenObject = JSON.parse(localStorageObject);
    }
    if (!tokenObject || !tokenObject.adeJWTToken || tokenObject.expiry <= new Date().getTime()) {
      return this.refreshToken(instSettings);
    }
    return tokenObject;
  }

  private async refreshToken(instSettings: any) {
    let payload = {
      access_key: instSettings.jsonData.accessKey,
      access_secret_key: instSettings.jsonData.secretKey,
      tenant_id: instSettings.jsonData.tenantId,
    };
    const requestJson = JSON.stringify(payload);
    const tokenResponse = await this.getJWTToken(instSettings.url, requestJson).toPromise();
    localStorage.setItem(JWT_TOKEN_STORAGE_KEY, JSON.stringify(tokenResponse));
    return tokenResponse;
  }

  private getJWTToken(url: any, payload: any): Observable<JWTTokenResponse> {
    return from(
      new Promise<JWTTokenResponse>(resolve => {
        const jwtToken = new JWTTokenResponse();
        this.post(url, Constants.JWT_TOKEN_GEN_URL, payload).then(
          (response: any) => {
            jwtToken.status = response.status;
            if (response && response.status === 200) {
              jwtToken.adeJWTToken = response.data.json_web_token;
              let currentTime = new Date();
              jwtToken.expiry = currentTime.setMinutes(currentTime.getMinutes() + 5);
            }
            resolve(jwtToken);
          },
          (errorResponse: any) => {
            jwtToken.status = errorResponse.error;
            resolve(jwtToken);
          }
        );
      })
    );
  }
}
