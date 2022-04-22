import _ from 'lodash';
import { Column, TableData, QueryResultMeta } from '@grafana/data';

/**
 * Extends the standard Column class with variables that get
 * mutated in the angular table panel.
 */
export interface MutableColumn extends Column {
  title?: string;
  sort?: boolean;
  desc?: boolean;
  type?: string;
}

export default class TableModel implements TableData {
  columns: MutableColumn[];
  rows: any[];
  type: string;
  columnMap: any;
  refId?: string;
  meta?: QueryResultMeta;

  constructor(table?: any) {
    this.columns = [];
    this.columnMap = {};
    this.rows = [];
    this.type = 'table';

    if (table) {
      if (table.columns) {
        for (const col of table.columns) {
          this.addColumn(col);
        }
      }
      if (table.rows) {
        for (const row of table.rows) {
          this.addRow(row);
        }
      }
    }
  }

  addColumn(col: MutableColumn) {
    if (!this.columnMap[col.text]) {
      this.columns.push(col);
      this.columnMap[col.text] = col;
    }
  }

  addRow(row: any[]) {
    this.rows.push(row);
  }
}
