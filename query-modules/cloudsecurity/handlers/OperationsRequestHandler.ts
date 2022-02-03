import { BMCDataSourceQuery } from '../../../types';
import { DataQueryRequest, DataQueryResponse } from '@grafana/data';
import { CSConstants } from '../CloudSecurityConstants';
import { CSResponseParser } from './CSResponseHandler';
import { AbstCSRequestHandler } from './AbstCSRequestHandler';

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

  async handleRequest(ds: any, options: DataQueryRequest<BMCDataSourceQuery>, target: any): Promise<DataQueryResponse> {
    let queryObject = ds.queryBuilder.buildOperationsQuery(options);
    const operationsPayload = JSON.stringify(queryObject);

    let result: any;
    result = this.post(ds, CSConstants.OPERATIONS_URL, operationsPayload).then((response: any) => {
      try {
        return new CSResponseParser(response, target.refId).parseOperationsResult(target);
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
