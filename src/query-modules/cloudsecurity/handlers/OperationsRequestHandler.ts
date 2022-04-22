import { BMCDataSourceQuery } from '../../../types';
import { DataQueryRequest, DataQueryResponse } from '@grafana/data';
import { CSConstants } from '../CloudSecurityConstants';
import { CSResponseParser } from './CSResponseHandler';
import { AbstCSRequestHandler } from './AbstCSRequestHandler';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export class OperationsRequestHandler extends AbstCSRequestHandler {
  private static instance: OperationsRequestHandler;
  private constructor() {
    super();
  }

  public static getInstance() {
    if (!OperationsRequestHandler.instance) {
      OperationsRequestHandler.instance = new OperationsRequestHandler();
    }
    return OperationsRequestHandler.instance;
  }

  handleRequest(ds: any, options: DataQueryRequest<BMCDataSourceQuery>, target: any): Observable<DataQueryResponse> {
    let queryObject = ds.queryBuilder.buildOperationsQuery(options);
    const operationsPayload = JSON.stringify(queryObject);

    return this.post(ds, CSConstants.OPERATIONS_URL, operationsPayload).pipe(
      map((response: any) => {
        try {
          return new CSResponseParser(response, target.refId).parseOperationsResult(target);
        } catch (err) {
          console.log(err);
          throw { message: CSConstants.CS_RESPONSE_ERROR };
        }
      })
    );
  }
}
