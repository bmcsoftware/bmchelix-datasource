import { AbstCSRequestHandler } from './AbstCSRequestHandler';
import { BMCDataSourceQuery } from '../../../types';
import { DataQueryRequest, DataQueryResponse } from '@grafana/data';
import { CSConstants } from '../CloudSecurityConstants';
import { CSResponseParser } from './CSResponseHandler';

export class RiskAccountRequestHandler extends AbstCSRequestHandler {
  private static instance: RiskAccountRequestHandler;
  private constructor() {
    super();
  }

  public static getInstance() {
    if (!RiskAccountRequestHandler.instance) {
      RiskAccountRequestHandler.instance = new RiskAccountRequestHandler();
    }
    return RiskAccountRequestHandler.instance;
  }

  async handleRequest(ds: any, options: DataQueryRequest<BMCDataSourceQuery>, target: any): Promise<DataQueryResponse> {
    let queryObject = ds.queryBuilder.buildRiskAccountQuery(options);
    const riskAccountQuery = JSON.stringify(queryObject);

    let result: any;
    result = this.post(ds, CSConstants.RISK_ACCOUNT_URL, riskAccountQuery).then((response: any) => {
      try {
        return new CSResponseParser(response, target.refId).parseRiskAccountQueryResult();
      } catch (err) {
        console.log(err);
        throw { message: CSConstants.CS_RESPONSE_ERROR };
      }
    });

    if (result) {
      return result;
    } else {
      return Promise.resolve({ data: [] });
    }
  }
}
