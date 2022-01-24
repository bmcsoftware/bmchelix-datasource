import { DataQueryRequest, DataQueryResponse } from '@grafana/data';
import { BMCDataSourceQuery } from '../../../types';
import { ItsmInsightsConstants } from '../ItsmInsightsConstants';
import { AbstItsmInsightsRequestHandler } from './AbstItsmInsightsRequestHandler';
import { ItsmInsightsResponseParser } from './ItsmInsightsResponseParser';
import { MOCK_JSON_NUMBER_OF_JOBS_CREATED } from '../itsm-insights-mock-data';

export class JobsRequestHandler extends AbstItsmInsightsRequestHandler {
  private static instance: JobsRequestHandler;
  private constructor() {
    super();
  }

  public static getInstance() {
    if (!JobsRequestHandler.instance) {
      JobsRequestHandler.instance = new JobsRequestHandler();
    }
    return JobsRequestHandler.instance;
  }

  async handleRequest(ds: any, options: DataQueryRequest<BMCDataSourceQuery>, target: any): Promise<DataQueryResponse> {
    let result: any;

    let requestBody = ds.queryBuilder.buildJobsKpiRequest(options);
    const requestBodyJson = JSON.stringify(requestBody);

    if (!ItsmInsightsConstants.MOCK) {
      result = this.post(ds, ItsmInsightsConstants.JOBS_CREATED_URL, requestBodyJson).then(
        (response: any) => {
          try {
            return new ItsmInsightsResponseParser(response, target.refId).parseJobsKpiResult(target);
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
      result = new ItsmInsightsResponseParser(MOCK_JSON_NUMBER_OF_JOBS_CREATED, target.refId).parseJobsKpiResult(
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
