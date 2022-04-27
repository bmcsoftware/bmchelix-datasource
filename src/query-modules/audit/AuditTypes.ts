import { BMCDataSourceQuery } from '../../types';

export interface AuditDataSourceQuery extends BMCDataSourceQuery {
  sourceQuery: AuditQuery;
}

export type AuditQuery = {
  searchQuery: string;
  selectQuery: string;
};
