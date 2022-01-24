import { DataQueryRequest, DataQueryResponse } from '@grafana/data';
import { BMCDataSourceQuery } from '../../../types';
import { ItsmInsightsConstants } from '../ItsmInsightsConstants';
import { AbstItsmInsightsRequestHandler } from './AbstItsmInsightsRequestHandler';
import { ItsmInsightsResponseParser } from './ItsmInsightsResponseParser';
import { MOCK_JSON_NUMBER_OF_EXECUTIONS } from '../itsm-insights-mock-data';

export class ExecutionsRequestHandler extends AbstItsmInsightsRequestHandler {
  private static instance: ExecutionsRequestHandler;
  private constructor() {
    super();
  }

  public static getInstance() {
    if (!ExecutionsRequestHandler.instance) {
      ExecutionsRequestHandler.instance = new ExecutionsRequestHandler();
    }
    return ExecutionsRequestHandler.instance;
  }

  async handleRequest(ds: any, options: DataQueryRequest<BMCDataSourceQuery>, target: any): Promise<DataQueryResponse> {
    let result: any;
    let requestBody = ds.queryBuilder.buildExecutionsKpiRequest(options);
    const requestBodyJson = JSON.stringify(requestBody);
    if (!ItsmInsightsConstants.MOCK) {
      result = this.post(ds, ItsmInsightsConstants.NUMBER_OF_EXECUTIONS_URL, requestBodyJson).then(
        (response: any) => {
          try {
            return new ItsmInsightsResponseParser(response, target.refId).parseExecutionsKpiResult(target);
          } catch (err) {
            console.log(err);
            throw { message: ItsmInsightsConstants.ITSM_INSIGHTS_RESPONSE_ERROR };
          }
        },
        (err: any) => {
          if (err.status === ItsmInsightsConstants.STATUS_FORBIDDEN) {
            throw { message: ItsmInsightsConstants.ITSM_INSIGHTS_FORBIDDEN_ERROR };
          }
        }
      );
    } else {
      result = new ItsmInsightsResponseParser(MOCK_JSON_NUMBER_OF_EXECUTIONS, target.refId).parseExecutionsKpiResult(
        target
      );
    }

    if (result) {
      return result;
    } else {
      return Promise.resolve({ data: [] });
    }
  }
}
