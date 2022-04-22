import { DataQueryRequest, DataQueryResponse } from '@grafana/data';
import { BMCDataSourceQuery } from '../../../types';
import { ItsmInsightsConstants } from '../ItsmInsightsConstants';
import { AbstItsmInsightsRequestHandler } from './AbstItsmInsightsRequestHandler';
import { ItsmInsightsResponseParser } from './ItsmInsightsResponseParser';
import { MOCK_JSON_NUMBER_OF_JOBS_CREATED } from '../itsm-insights-mock-data';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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

  handleRequest(ds: any, options: DataQueryRequest<BMCDataSourceQuery>, target: any): Observable<DataQueryResponse> {
    let requestBody = ds.queryBuilder.buildJobsKpiRequest(options);
    const requestBodyJson = JSON.stringify(requestBody);

    if (!ItsmInsightsConstants.MOCK) {
      return this.post(ds, ItsmInsightsConstants.JOBS_CREATED_URL, requestBodyJson).pipe(
        map((response: any) => {
          try {
            return new ItsmInsightsResponseParser(response, target.refId).parseJobsKpiResult(target);
          } catch (err) {
            console.log(err);
            throw { message: ItsmInsightsConstants.ITSM_INSIGHTS_RESPONSE_ERROR };
          }
        }),
        catchError((err: any) => {
          if (err.status === ItsmInsightsConstants.STATUS_FORBIDDEN) {
            throw { message: ItsmInsightsConstants.ITSM_INSIGHTS_FORBIDDEN_ERROR };
          }
          throw err;
        })
      );
    } else {
      return of(
        new ItsmInsightsResponseParser(MOCK_JSON_NUMBER_OF_JOBS_CREATED, target.refId).parseJobsKpiResult(target)
      );
    }
  }
}
