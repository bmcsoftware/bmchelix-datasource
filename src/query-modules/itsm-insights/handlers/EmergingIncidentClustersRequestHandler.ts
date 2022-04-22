import { DataQueryRequest, DataQueryResponse } from '@grafana/data';
import { BMCDataSourceQuery } from '../../../types';
import { ItsmInsightsConstants } from '../ItsmInsightsConstants';
import { AbstItsmInsightsRequestHandler } from './AbstItsmInsightsRequestHandler';
import { ItsmInsightsResponseParser } from './ItsmInsightsResponseParser';
import { MOCK_JSON_TOP_EMERGING_CLUSTERS } from '../itsm-insights-mock-data';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export class EmergingIncidentClustersRequestHandler extends AbstItsmInsightsRequestHandler {
  private static instance: EmergingIncidentClustersRequestHandler;
  private constructor() {
    super();
  }

  public static getInstance() {
    if (!EmergingIncidentClustersRequestHandler.instance) {
      EmergingIncidentClustersRequestHandler.instance = new EmergingIncidentClustersRequestHandler();
    }
    return EmergingIncidentClustersRequestHandler.instance;
  }

  handleRequest(ds: any, options: DataQueryRequest<BMCDataSourceQuery>, target: any): Observable<DataQueryResponse> {
    let requestBody = ds.queryBuilder.buildEmergingClustersRequest(options);
    const requestBodyJson = JSON.stringify(requestBody);

    if (!ItsmInsightsConstants.MOCK_EMERGING_CLUSTERS) {
      return this.post(ds, ItsmInsightsConstants.EMERGING_CLUSTERS_URL, requestBodyJson).pipe(
        map((response: any) => {
          try {
            return new ItsmInsightsResponseParser(response, target.refId).parseEmergingClustersResult(target);
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
      // const data: any[] = [];
      return of({ data: MOCK_JSON_TOP_EMERGING_CLUSTERS }); //new ItsmInsightsResponseParser(MOCK_JSON_TOP_EMERGING_CLUSTERS, target.refId).parseEmergingClustersResult(target);
    }
  }
}
