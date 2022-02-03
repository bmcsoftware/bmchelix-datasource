import { DataQueryRequest, DataQueryResponse } from '@grafana/data';
import { BMCDataSourceQuery } from '../../../types';
import { ItsmInsightsConstants } from '../ItsmInsightsConstants';
import { AbstItsmInsightsRequestHandler } from './AbstItsmInsightsRequestHandler';
import { ItsmInsightsResponseParser } from './ItsmInsightsResponseParser';
import { MOCK_JSON_TOP_EMERGING_CLUSTERS } from '../itsm-insights-mock-data';

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

  async handleRequest(ds: any, options: DataQueryRequest<BMCDataSourceQuery>, target: any): Promise<DataQueryResponse> {
    let result: any;
    let requestBody = ds.queryBuilder.buildEmergingClustersRequest(options);
    const requestBodyJson = JSON.stringify(requestBody);

    if (!ItsmInsightsConstants.MOCK_EMERGING_CLUSTERS) {
      result = this.post(ds, ItsmInsightsConstants.EMERGING_CLUSTERS_URL, requestBodyJson).then(
        (response: any) => {
          try {
            return new ItsmInsightsResponseParser(response, target.refId).parseEmergingClustersResult(target);
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
      // const data: any[] = [];
      result = { data: MOCK_JSON_TOP_EMERGING_CLUSTERS }; //new ItsmInsightsResponseParser(MOCK_JSON_TOP_EMERGING_CLUSTERS, target.refId).parseEmergingClustersResult(target);
    }

    if (result) {
      return result;
    } else {
      return Promise.resolve({ data: [] });
    }
  }
}
