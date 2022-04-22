import { AbstCSRequestHandler } from './AbstCSRequestHandler';
import { BMCDataSourceQuery } from '../../../types';
import { DataQueryRequest, DataQueryResponse } from '@grafana/data';
import { CSConstants } from '../CloudSecurityConstants';
import { CSResponseParser } from './CSResponseHandler';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export class ComplianceTrendRequestHandler extends AbstCSRequestHandler {
  private static instance: ComplianceTrendRequestHandler;
  private constructor() {
    super();
  }

  public static getInstance() {
    if (!ComplianceTrendRequestHandler.instance) {
      ComplianceTrendRequestHandler.instance = new ComplianceTrendRequestHandler();
    }
    return ComplianceTrendRequestHandler.instance;
  }

  handleRequest(ds: any, options: DataQueryRequest<BMCDataSourceQuery>, target: any): Observable<DataQueryResponse> {
    let queryObject = ds.queryBuilder.buildComplianceTrendQuery(options);
    const complianceTrendQuery = JSON.stringify(queryObject);

    return this.post(ds, CSConstants.COMPLIANCE_TREND_URL, complianceTrendQuery).pipe(
      map((response: any) => {
        try {
          return new CSResponseParser(response, target.refId).parseComplianceTrendQueryResult(target);
        } catch (err) {
          console.log(err);
          throw { message: CSConstants.CS_RESPONSE_ERROR };
        }
      })
    );
  }
}
