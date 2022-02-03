import { AbstCSRequestHandler } from './AbstCSRequestHandler';
import { BMCDataSourceQuery } from '../../../types';
import { DataQueryRequest, DataQueryResponse } from '@grafana/data';

export class CSDefaultRequestHandler extends AbstCSRequestHandler {
  async handleRequest(ds: any, options: DataQueryRequest<BMCDataSourceQuery>, target: any): Promise<DataQueryResponse> {
    return Promise.resolve({ data: [] });
  }
}
