import { AuthHelper } from './AuthHelper';

export class ADEAuthHelper extends AuthHelper {
  private static instance: ADEAuthHelper;

  constructor() {
    super();
  }

  static getInstance() {
    if (!ADEAuthHelper.instance) {
      ADEAuthHelper.instance = new ADEAuthHelper();
    }
    return ADEAuthHelper.instance;
  }

  initToken(backendSrv: any) {
    return this.getJWTTokenFromContext(backendSrv);
  }

  async getToken(tokenObj: any) {
    // do nothing
  }

  private getJWTTokenFromContext(backendSrv: any) {
	  let imsJWTTokenObj: any = { adeJWTToken: ''};
    imsJWTTokenObj.adeJWTToken =  "JWT PLACEHOLDER";
    return imsJWTTokenObj;
  }
}
