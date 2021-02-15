import { BMCDataSourceQuery } from '../../types';

export interface SmartGraphDataSourceQuery extends BMCDataSourceQuery {
  sourceQuery: SmartGraphQuery;
}

export type SmartGraphQuery = {
   query?: string;
 };
