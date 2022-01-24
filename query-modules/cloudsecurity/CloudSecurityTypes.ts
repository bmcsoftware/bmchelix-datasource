import { BMCDataSourceQuery } from '../../types';

export interface CloudSecurityDataSourceQuery extends BMCDataSourceQuery {
  sourceQuery: CloudSecurityQuery;
}

export type CloudSecurityQuery = {
  csQueryType: string;
  csQueryFor: any;
  filters: string[];
};
