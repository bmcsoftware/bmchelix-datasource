import { BMCDataSourceQuery } from '../../types';

export interface ItsmInsightsDataSourceQuery extends BMCDataSourceQuery {
  sourceQuery: ItsmInsightsQuery;
}

export type ItsmInsightsQuery = {
  itsmInsigntsQueryType: string;
  limitTopRecords: number;
};
