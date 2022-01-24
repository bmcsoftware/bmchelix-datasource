import { DataQueryResponse, FieldType, MutableDataFrame } from '@grafana/data';
import _ from 'lodash';

export class ItsmInsightsResponseParser {
  constructor(private response: any, private refId: string) {}

  parseEmergingClustersResult(target: any): DataQueryResponse {
    const data: any[] = [];
    if (this.response && this.response.data && this.response.data.response) {
      let result = this.response.data.response;
      if (result) {
        let plotData: any = {
          columns: [
            {
              text: 'Clusters',
              type: 'string',
            },
            {
              text: 'Incidents',
              type: 'number',
            },
          ],
          type: 'table',
        };

        plotData.rows = Object.keys(result.emergingClusters).map((key) => [key, result.emergingClusters[key]]);
        data.push(plotData);
      }
    }
    return { data: data };
  }

  parseExecutionsKpiResult(target: any): DataQueryResponse {
    const data: any[] = [];
    if (this.response && this.response.data && this.response.data.response) {
      let valObj = this.response.data.response;
      if (valObj) {
        let total = valObj.numOfExecutions;
        let frame = new MutableDataFrame({
          refId: this.refId,
          fields: [{ name: 'Total', type: FieldType.number }],
        });
        frame.add({ Total: total });
        data.push(frame);
      }
    }
    return { data: data };
  }

  parseJobsKpiResult(target: any): DataQueryResponse {
    const data: any[] = [];
    if (this.response && this.response.data && this.response.data.response) {
      let valObj = this.response.data.response;
      if (valObj) {
        let total = valObj.numOfJobs;
        let frame = new MutableDataFrame({
          refId: this.refId,
          fields: [{ name: 'Total', type: FieldType.number }],
        });
        frame.add({ Total: total });
        data.push(frame);
      }
    }

    return { data: data };
  }
}
