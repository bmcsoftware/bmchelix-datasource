import {
  DataQueryError,
  DataQueryRequest,
  DataQueryResponse,
  DataQueryResponseData,
  DataSourceApi,
  DataSourceInstanceSettings,
  MetricFindValue,
} from '@grafana/data';
import { FetchResponse, getBackendSrv } from '@grafana/runtime';
import { BMCDataSource } from 'datasource';
import defaults from 'lodash/defaults';
import {
  Datamart,
  DatamartDataResponse,
  DatamartDomain,
  DatamartMetadataResponse,
  DatamartsDataSourceQuery,
  DatamartsQuery,
  DatamartTag,
  DatamartTagTypeData,
  DatamartTagViewModel,
  RequestFilter,
} from 'modules/datamarts/utilities/datamartTypes';
import { from, Observable, of } from 'rxjs';
import { catchError, concatMap, filter, map, tap } from 'rxjs/operators';
import { BMCDataSourceOptions } from 'types';
import { DatamartsConstants } from './DatamartsConstants';

export class DatamartsDatasource extends DataSourceApi<DatamartsDataSourceQuery, BMCDataSourceOptions> {
  testDatasource(): Promise<any> {
    throw new Error('Method not implemented.');
  }

  private static instance: DatamartsDatasource;
  lookupsDisabled: any;
  datamartsUrl!: string;
  templateSrv: any;

  private constructor(instanceSettings: DataSourceInstanceSettings<BMCDataSourceOptions>, templateSrv: any) {
    super(instanceSettings);
    this.refreshSettings(instanceSettings);
    this.templateSrv = templateSrv;
  }

  static getInstance(
    instanceSettings: DataSourceInstanceSettings<BMCDataSourceOptions>,
    templateSrv: any
  ): DatamartsDatasource {
    if (!DatamartsDatasource.instance) {
      DatamartsDatasource.instance = new DatamartsDatasource(instanceSettings, templateSrv);
    }
    DatamartsDatasource.instance.refreshSettings(instanceSettings);
    return DatamartsDatasource.instance;
  }

  query(
    options: DataQueryRequest<DatamartsDataSourceQuery>
  ): Promise<DataQueryResponse> | Observable<DataQueryResponse> {
    return from(options.targets).pipe(
      filter((target) => target.sourceQuery.erid !== undefined),
      tap(
        (target) =>
          (target.sourceQuery.erid = this.templateSrv.replace(
            `${target.sourceQuery.erid}`,
            {},
            this.interpolateQueryExpr
          ))
      ),
      concatMap((target) =>
        this.getDatamartData(target.sourceQuery.erid, target.sourceQuery).pipe(
          map((response) => this.transformData(response.data, target.sourceQuery.datamartName)), //transform data to DataQueryResponseData
          map((resArr) => {
            return { data: [resArr] }; // create DataQueryResponse
          })
        )
      )
    );
  }
  interpolateQueryExpr(value: string | string[] = [], variable: any) {
    return value;
  }
  metricFindQuery(query: string): Promise<MetricFindValue[]> {
    if (query === 'all') {
      return this._request<any>(DatamartsConstants.API_DATAMARTS_GET_ALL, null, {
        method: 'GET',
        headers: {},
      })
        .pipe(
          map((result) => result.data.datamarts || []),
          map((datamarts: Datamart[]) =>
            datamarts.map((datamart) => ({ text: datamart.name, value: datamart.erid, expandable: true }))
          ),
          catchError((e) => of([]))
        )
        .toPromise<MetricFindValue[]>();
    }

    return Promise.resolve([]);
  }

  transformData(data: any, name: string): DataQueryResponseData {
    const results = {
      name: name,
      fields: [] as Array<{ name: string; values: any[] }>,
    };

    if (data === undefined) {
      return results;
    }

    const length = data.length;
    const fieldsResults: any = {};
    for (var i = 0; i < length; i++) {
      Object.keys(data[i]).forEach((key: string) => {
        if (!fieldsResults[key]) {
          fieldsResults[key] = new Array<any>(length);
        }
        fieldsResults[key][i] = data[i][key];
      });
    }
    const tData: Array<{ name: string; values: any[] }> = [];
    Object.keys(fieldsResults).forEach((key) =>
      tData.push({
        name: key,
        values: fieldsResults[key],
      })
    );
    results.fields = tData;
    return results;
  }

  refreshSettings(instSet: DataSourceInstanceSettings<BMCDataSourceOptions>) {
    this.datamartsUrl = instSet.url as string;
    this.lookupsDisabled = false;
  }

  async getDatamarts(): Promise<{ loading: boolean; values: Datamart[] }> {
    const result: any = await this._request<any>(DatamartsConstants.API_DATAMARTS_GET_ALL, null, {
      method: 'GET',
      headers: {},
    }).toPromise();
    return {
      loading: false,
      values: result.data.datamarts.sort(function (a: Datamart, b: Datamart) {
        return a.name.localeCompare(b.name);
      }),
    };
  }

  getTagTypes(): Observable<DatamartTag[]> {
    return this._request<any>(
      DatamartsConstants.API_CATALOGPROXY_TAG_TYPES,
      {
        entity_type_ids: [],
      },
      {
        method: 'POST',
        headers: {},
      }
    ).pipe(map((response) => response.data['tag.types']));
  }

  searchTags(query: string): Observable<DatamartTagViewModel[]> {
    return this._request<any>(
      DatamartsConstants.API_CATALOGPROXY_TAGS_SEARCH,
      {
        'search.string': query,
      },
      {
        method: 'POST',
        headers: {},
      }
    ).pipe(
      map((response) => response.data['tag.types'] as DatamartTagTypeData[]),
      map((types: DatamartTagTypeData[]) => {
        return types.reduce((acc: DatamartTagViewModel[], curr: DatamartTagTypeData) => {
          const tagsViewModel: DatamartTagViewModel[] = curr.tags.map((tag) => ({
            tagId: tag.tagid,
            tagName: tag.tag,
            tagTypeId: curr.tagtypeid,
            tagTypeName: curr.name,
          }));
          acc = acc.concat(tagsViewModel);
          return acc;
        }, []);
      })
    );
  }

  searchDomains(query: string): Observable<DatamartDomain[]> {
    return this._request<any>(
      DatamartsConstants.API_CATALOGPROXY_DOMAINS_SEARCH,
      { filter: { 'search.string': query }, pagination: { page: 0, size: 1000000 } },
      {
        method: 'POST',
        headers: {},
      }
    ).pipe(map((response) => (response.data['children'] ? response.data['children']['APP'] || [] : [])));
  }

  getDatamartMetadata(datamartId: string): Observable<DatamartMetadataResponse> {
    var url = DatamartsConstants.API_DATAMARTS_GET_DATAMART_METADATA;
    url = url.replace('<erid>', datamartId);
    return this._request<DatamartMetadataResponse>(url, null, { method: 'GET', headers: {} }).pipe(
      map((res) => res.data) //Get only response body (DatamartMetadataResponse)
    );
  }

  getDatamartData(datamartId: string, query: DatamartsQuery): Observable<DatamartDataResponse> {
    var url = DatamartsConstants.API_DATAMARTS_GET_DATAMART_DATA;
    url = url.replace('<erid>', datamartId);
    const options = { pagesize: -1 };
    let body: any = { options: options };
    const filters = this.handleQueryFilters(query);
    if (filters.length > 0) {
      body.filters = filters;
    }
    return this._request<DatamartDataResponse>(url, body, { method: 'POST', headers: {} }).pipe(
      map((res) => res.data) //Get only response body (DatamartDataResponse)
    );
  }

  private buildFilter = (sourceFilter: RequestFilter): RequestFilter => {
    const filter: RequestFilter = { name: sourceFilter.name, condition: sourceFilter.condition };
    if (sourceFilter.value) {
      filter.value = sourceFilter.value;
    }
    if (sourceFilter.values) {
      filter.values = sourceFilter.values;
    }
    return filter;
  };
  private handleQueryFilters = (query: DatamartsQuery) => {
    const filters: RequestFilter[] = [];

    if (query.timeFilter) {
      filters.push(this.buildFilter(query.timeFilter));
    }
    if (query.tagFilter) {
      filters.push(this.buildFilter(query.tagFilter));
    }
    if (query.domainFilter) {
      filters.push(this.buildFilter(query.domainFilter));
    }
    return filters;
  };

  /**
   * Any request done from this data source should go through here as it contains some common processing for the
   * request. Any processing done here needs to be also copied on the backend as this goes through data source proxy
   * but not through the same code as alerting.
   */
  _request<T>(url: string, data?: string | object | null, options?: RequestOptions): Observable<FetchResponse<T>> {
    options = defaults(options || {}, {
      url: this.datamartsUrl + '/' + url,
      method: 'GET',
      headers: { Authorization: '' },
    });

    let imsJWTToken: string = BMCDataSource.tokenObj.adeJWTToken;

    if (imsJWTToken !== undefined) {
      options.headers['Authorization'] = 'Bearer ' + imsJWTToken;
    }

    if (options.method === 'GET') {
      if (data && Object.keys(data).length) {
        options.url =
          options.url +
          '?' +
          Object.entries(data)
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
            .join('&');
      }
    } else {
      options.headers['Content-Type'] = 'application/json';
      options.data = data;
    }
    return getBackendSrv().fetch(options as Required<RequestOptions>);
  }
}

export const handleErrors = (err: any, refId: string) => {
  const error: DataQueryError = {
    message: (err && err.statusText) || 'Unknown error during query transaction. Please check JS console logs.',
    refId: refId,
  };

  if (err.data) {
    if (typeof err.data === 'string') {
      error.message = err.data;
    } else if (err.data.error) {
      error.message = safeStringifyValue(err.data.error);
    }
  } else if (err.message) {
    error.message = err.message;
  } else if (typeof err === 'string') {
    error.message = err;
  }

  error.status = err.status;
  error.statusText = err.statusText;

  return error;
};

const safeStringifyValue = (value: any, space?: number) => {
  if (!value) {
    return '';
  }

  try {
    return JSON.stringify(value, null, space);
  } catch (error) {
    console.error(error);
  }

  return '';
};

interface RequestOptions {
  method?: string;
  url?: string;
  headers: Record<string, string>;
  data?: any;
  requestId?: string;
}
