import { AbstItsmInsightsRequestHandler } from './AbstItsmInsightsRequestHandler';
import { BMCDataSourceQuery } from '../../../types';
import { DataQueryRequest, DataQueryResponse } from '@grafana/data';
import { Observable, of } from 'rxjs';

export class ItsmInsightsDefaultRequestHandler extends AbstItsmInsightsRequestHandler {
  handleRequest(ds: any, options: DataQueryRequest<BMCDataSourceQuery>, target: any): Observable<DataQueryResponse> {
    return of({ data: [] });
  }
}
