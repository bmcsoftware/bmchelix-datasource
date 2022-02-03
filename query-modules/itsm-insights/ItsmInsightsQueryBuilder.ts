/* eslint-disable no-restricted-imports */
import { DataQueryRequest } from '@grafana/data';
import { BMCDataSourceQuery } from '../../types';
import { ItsmInsightsConstants } from './ItsmInsightsConstants';
export class ItsmInsightsQueryBuilder {
  /** @ngInject */
  constructor(public templateSrv: any, public timeSrv: any, public backendSrv: any) {}

  getTimeFilter(key: string, options: DataQueryRequest<BMCDataSourceQuery>) {
    let from = options.range.from.valueOf().toString();
    let to = options.range.to.valueOf().toString();
    return {
      from,
      to,
    };
  }

  getFilters(options: DataQueryRequest<BMCDataSourceQuery>) {
    let filters = '';
    for (const target of options.targets) {
      if (target.hide) {
        continue;
      }
      filters = target.sourceQuery.filters;
    }

    return filters;
  }

  getLimitTopRecords(options: DataQueryRequest<BMCDataSourceQuery>) {
    let limitTopRecords: number = ItsmInsightsConstants.DEFAULT_LIMIT_TOP_EMERGING_CLUSTERS;
    for (const target of options.targets) {
      if (target.hide) {
        continue;
      }
      limitTopRecords = target.sourceQuery.limitTopRecords;
    }
    return limitTopRecords;
  }

  /**
   * Returns Request Body for Jobs KPI API
   * @param options
   */
  buildJobsKpiRequest(options: DataQueryRequest<BMCDataSourceQuery>) {
    //https://grafana.com/docs/grafana/latest/packages_api/runtime/templatesrv/
    //https://grafana.com/docs/grafana/v7.5/variables/advanced-variable-format-options/
    let companyNames: string[] = [];
    try {
      let interpolatedVar = JSON.parse(this.templateSrv.replace('$companies', options.scopedVars, 'json'));
      companyNames =   Array.isArray(interpolatedVar) ? interpolatedVar : [interpolatedVar];
    } catch (error) {}

    var range = this.getTimeFilter('lastFeedTime', options);
    let requestBody: RequestBody = {
      filters: {
        range,
        companyNames,
      },
    };

    return requestBody;
  }

  /**
   *Returns Request Body for Executions KPI API
   * @param options
   */
  buildExecutionsKpiRequest(options: DataQueryRequest<BMCDataSourceQuery>) {
    let companyNames: string[] = [];
    try {
      let interpolatedVar = JSON.parse(this.templateSrv.replace('$companies', options.scopedVars, 'json'));
      companyNames =   Array.isArray(interpolatedVar) ? interpolatedVar : [interpolatedVar];
    } catch (error) {}

    var range = this.getTimeFilter('lastFeedTime', options);
    let requestBody: RequestBody = {
      filters: {
        range,
        companyNames,
      },
    };

    return requestBody;
  }

  /**
   *Returns Request Body for Emerging incident clusters KPI API
   * @param options
   */
  buildEmergingClustersRequest(options: DataQueryRequest<BMCDataSourceQuery>) {
    let limitTopRecords = this.getLimitTopRecords(options);
    let companyNames: string[] = [];
    try {
      let interpolatedVar = JSON.parse(this.templateSrv.replace('$companies', options.scopedVars, 'json'));
      companyNames =   Array.isArray(interpolatedVar) ? interpolatedVar : [interpolatedVar];
    } catch (error) {}

    var range = this.getTimeFilter('lastFeedTime', options);
    let requestBody: RequestBody = {
      filters: {
        range,
         limitTopRecords,
         companyNames,
      },
    };

    return requestBody;
  }
}

export interface RequestBody {
  filters: Filters;
}

export interface Filters {
  range: Range;
  limitTopRecords?: number;
  companyNames?: string[];
}
export interface Range {
  from: string;
  to: string;
}
