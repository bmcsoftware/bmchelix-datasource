import { QueryHint, SelectableValue } from '@grafana/data';
import { BMCDataSourceQuery } from '../../../types';

export interface DatamartsDataSourceQuery extends BMCDataSourceQuery {
  sourceQuery: DatamartsQuery;
}

export type DatamartsQuery = {
  erid: string;
  datamartName: string;
  timeFilter?: RequestFilter;
  tagFilter?: RequestFilter;
  domainFilter?: RequestFilter;
};

export type RequestFilter = {
  name: string;
  condition: string;
  value?: string;
  values?: string[];
  originalValues?: SelectableValue[];
};

export interface DatamartsQueryRequest extends BMCDataSourceQuery {
  sourceQuery: DatamartsSourceQueryRequest;
}

export interface DatamartsSourceQueryRequest extends DatamartsQuery {
  step?: any;
  requestId?: string;
  headers?: any;
}

export interface Datamarts {
  loading: boolean;
  values: Datamart[];
}

export interface DatamartDataResponse {
  data: Object[];
}

export interface DatamartMetadataResponse {
  standardfiltermetadata: {
    domainfilter: DatamartMetadataFilter;
    tagfilter: DatamartMetadataFilter;
    timefilter: DatamartMetadataFilter;
  };
}

export interface DatamartMetadataFilter {
  description: string;
  filtertype: string;
  label: string;
  name: string;
}

export enum DatamartTimeFilterType {
  LAST_X_DAYS = 'lastxdays-time-filter',
  FIXED = 'time-filter-fixed',
}

export interface Datamart {
  erid: string;
  name: string;
  ertypeid: string;
  physname: string;
  description?: string;
  ownership: number;
  creationdate: string;
  updatedate: string;
  statusid: number;
}

export interface DatamartQueryFieldState {
  datamarts: Datamarts;
  datamartsBrowserVisible: boolean;
  datamartTimeFilter: DatamartTimeFilter;
  syntaxLoaded: boolean;
  hint: QueryHint | null;
  tagsFilter: SearchItemState;
  domainsFilter: SearchItemState;
}

export interface SearchItemState {
  show: boolean;
  options: SelectableValue[];
  selected: SelectableValue[];
  loading: boolean;
}

export interface DatamartTag {
  tag: string;
  tagid: string;
}

export interface DatamartTagViewModel {
  tagName: string;
  tagId: string;
  tagTypeId: string;
  tagTypeName: string;
}

export interface DatamartTagTypeData {
  tagtypeid: string;
  name: string;
  tags: DatamartTag[];
}

export interface DatamartDomain {
  name: string;
  id: string;
  breadcrumb: Breadcrumb[];
}

export interface Breadcrumb {
  name: string;
  id: number;
}

export interface DatamartTimeFilter {
  showTimeFilter: boolean;
  type?: string;
  label?: string;
}

export type OnDatamartSelect = (item: Datamart) => void;
