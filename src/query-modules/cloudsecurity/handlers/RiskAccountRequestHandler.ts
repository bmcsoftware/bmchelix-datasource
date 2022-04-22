import { AbstCSRequestHandler } from './AbstCSRequestHandler';
import { BMCDataSourceQuery } from '../../../types';
import { DataQueryRequest, DataQueryResponse } from '@grafana/data';
import { CSConstants } from '../CloudSecurityConstants';
import { CSResponseParser } from './CSResponseHandler';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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

  handleRequest(ds: any, options: DataQueryRequest<BMCDataSourceQuery>, target: any): Observable<DataQueryResponse> {
    let queryObject = ds.queryBuilder.buildRiskAccountQuery(options);
    const riskAccountQuery = JSON.stringify(queryObject);

    return this.post(ds, CSConstants.RISK_ACCOUNT_URL, riskAccountQuery).pipe(
      map((response: any) => {
        try {
          return new CSResponseParser(response, target.refId).parseRiskAccountQueryResult();
        } catch (err) {
          console.log(err);
          throw { message: CSConstants.CS_RESPONSE_ERROR };
        }
      })
    );
  }
}
