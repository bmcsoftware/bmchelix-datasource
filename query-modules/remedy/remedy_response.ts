import TableModel from 'grafana/app/core/table_model';
import _ from 'lodash';

export class RemedyResponse {
  constructor(private responses: any) {
    this.responses = responses;
  }
  getData() {
    const seriesList: any[] = [];
    for (let i = 0; i < this.responses.length; i++) {
      if (this.responses[i].type === 'table') {
        seriesList.push(this.getTable(this.responses[i]));
      } else {
        seriesList.push(this.getTime(this.responses[i]));
      }
    }
    return { data: seriesList };
  }

  getTable(tData: any) {
    const table = new TableModel();
    table.type = 'table';
    table.columns = tData.columns;
    table.rows = tData.rows;
    return table;
  }

  getTime(tData: any) {
    return {
      datapoints: tData.datapoints,
      title: tData.target,
    };
  }

  /*
    @depricated Method not used
  */
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

  /*
    @depricated Method not used
  */
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
