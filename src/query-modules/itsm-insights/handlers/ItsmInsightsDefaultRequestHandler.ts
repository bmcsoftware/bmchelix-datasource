import { AbstItsmInsightsRequestHandler } from './AbstItsmInsightsRequestHandler';
import { BMCDataSourceQuery } from '../../../types';
import { DataQueryRequest, DataQueryResponse } from '@grafana/data';

export class ItsmInsightsDefaultRequestHandler extends AbstItsmInsightsRequestHandler {
  async handleRequest(ds: any, options: DataQueryRequest<BMCDataSourceQuery>, target: any): Promise<DataQueryResponse> {
    return Promise.resolve({ data: [] });
  }
}
