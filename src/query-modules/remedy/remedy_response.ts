import TableModel from 'grafana/app/core/table_model';
import _ from 'lodash';

export class RemedyResponse {
  constructor(private responses: any) {
    this.responses = responses;
  }

  getTableData(refId: string) {
    const seriesList = [];
    for (let i = 0; i < this.responses.length; i++) {
      const response = this.responses[i];
      const table = new TableModel();
      table.type = 'table';
      table.columns = response.columns;
      table.rows = response.rows;
      seriesList.push(table);
    }
    return { data: seriesList, type: 'table', refId: refId };
  }

  getTimeSeries(refId: string) {
    const seriesList = [];
    for (let i = 0; i < this.responses.length; i++) {
      const response = this.responses[i];
      seriesList.push({
        datapoints: response.datapoints,
        title: response.target,
      });
    }
    return { data: seriesList, type: 'timeseries', refId: refId };
  }
}
