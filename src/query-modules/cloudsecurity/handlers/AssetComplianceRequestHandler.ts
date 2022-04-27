import { AbstCSRequestHandler } from './AbstCSRequestHandler';
import { BMCDataSourceQuery } from '../../../types';
import { DataQueryRequest, DataQueryResponse } from '@grafana/data';
import { CSConstants } from '../CloudSecurityConstants';
import { CSResponseParser } from './CSResponseHandler';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export class AssetComplianceRequestHandler extends AbstCSRequestHandler {
  private static instance: AssetComplianceRequestHandler;
  private constructor() {
    super();
  }

  public static getInstance() {
    if (!AssetComplianceRequestHandler.instance) {
      AssetComplianceRequestHandler.instance = new AssetComplianceRequestHandler();
    }
    return AssetComplianceRequestHandler.instance;
  }

  handleRequest(ds: any, options: DataQueryRequest<BMCDataSourceQuery>, target: any): Observable<DataQueryResponse> {
    let queryObject = ds.queryBuilder.buildAssetComplianceQuery(options);
    const assetComplianceQuery = JSON.stringify(queryObject);

    return this.post(ds, CSConstants.ASSET_COMPLIANCE_URL, assetComplianceQuery).pipe(
      map((response: any) => {
        try {
          return new CSResponseParser(response, target.refId).parseAssetComplianceResult(target);
        } catch (err) {
          console.log(err);
          throw { message: CSConstants.CS_RESPONSE_ERROR };
        }
      })
    );
  }
}
