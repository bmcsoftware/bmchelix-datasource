/* eslint-disable no-restricted-imports */
import _ from 'lodash';
import { DataQueryRequest } from '@grafana/data';
import { BMCDataSourceQuery } from '../../types';
import moment from 'moment';

export interface ComplianceTrendRequest {
  min?: number;
  max?: number;
  timezone?: string;
  interval?: string;
  dataSeries?: any;
}

export class CloudSecurityQueryBuilder {
  getTimeFilter(key: string, options: DataQueryRequest<BMCDataSourceQuery>) {
    let from = options.range.from.valueOf().toString();
    let to = options.range.to.valueOf().toString();
    return '(' + key + ' >= ' + from + ' && ' + key + ' <=' + to + ')';
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

  getQueryForObj(options: DataQueryRequest<BMCDataSourceQuery>) {
    let csQueryFor: any = {};
    for (const target of options.targets) {
      if (target.hide) {
        continue;
      }
      csQueryFor = target.sourceQuery.csQueryFor;
    }
    return csQueryFor;
  }

  /**
   * Asset Compliance Query
   * @param options
   */
  getAssetComplianceQuery(options: DataQueryRequest<BMCDataSourceQuery>) {
    let query;
    let csQueryFor = this.getQueryForObj(options);

    if (csQueryFor.compliant) {
      query = "(complianceStatus == 'Compliant')";
    }
    if (csQueryFor.nonCompliant) {
      query = "(complianceStatus == 'NonCompliant')";
    }
    if ((csQueryFor.compliant && csQueryFor.nonCompliant) || csQueryFor.totalAssets) {
      query = "(complianceStatus == 'Compliant' || complianceStatus == 'NonCompliant')";
    }

    return query;
  }

  /**
   * Returns query for Query Type Asset Compliance.
   * @param options
   */
  buildAssetComplianceQuery(options: DataQueryRequest<BMCDataSourceQuery>) {
    var filter = this.getTimeFilter('lastFeedTime', options);

    let assetComlianceQuery = this.getAssetComplianceQuery(options);
    if (assetComlianceQuery) {
      filter = filter + ' && ' + assetComlianceQuery;
    }

    const compliancePostureJson = {
      period: '$LATEST',
      aggregatedOn: 'complianceStatus',
      filter: filter,
    };

    return compliancePostureJson;
  }

  /**
   * Returns the Compliance Trend Query
   * Compliant, NonCompliant or Remediation Trend
   * @param options
   */
  buildComplianceTrendQuery(options: DataQueryRequest<BMCDataSourceQuery>) {
    var queryForObj = this.getQueryForObj(options);
    let trendRequest: ComplianceTrendRequest = {};
    let timeBucket = this.getTimeBucket(options);
    trendRequest.min = options.range.from.valueOf();
    trendRequest.max = options.range.to.valueOf();
    trendRequest.timezone = '+00:00';
    trendRequest.interval = timeBucket;
    trendRequest.dataSeries = this.getDataSeriesObj(queryForObj.trend, timeBucket, options);

    return trendRequest;
  }

  getDataSeriesObj(trend: string, timeBucket: string, options: DataQueryRequest<BMCDataSourceQuery>) {
    let dataSeries: any[] = [];
    let bucketTimeStampFilter = this.getTimeFilter('bucketTimeStamp', options);
    let triggerTimestampFilter = this.getTimeFilter('triggerTimestamp', options);
    let queryFor = trend === 'Compliance' ? 'Compliant' : 'NonCompliant';
    dataSeries = [
      {
        type: 'RuleResult',
        aggregation: 'PIT',
        metric: 'COUNTS',
        aggregationFilter: "complianceStatus = '" + queryFor + "'",
        filter: 'timeBucket == ' + timeBucket + ' && ' + bucketTimeStampFilter,
      },
      {
        type: 'PolicyResult',
        aggregation: 'PIT',
        metric: 'COUNTS',
        aggregationFilter: "complianceStatus = '" + queryFor + "'",
        filter: 'timeBucket == ' + timeBucket + ' && ' + bucketTimeStampFilter,
      },
      {
        type: 'ActionInvocation',
        filter: triggerTimestampFilter,
      },
    ];
    return dataSeries;
  }

  /**
   * Based on time duration, set appropriate time bucket
   * @param options
   */
  getTimeBucket(options: DataQueryRequest<BMCDataSourceQuery>) {
    let startTime = moment(options.range.from.valueOf());
    let end = moment(options.range.to.valueOf());
    let duration = moment.duration(end.diff(startTime));
    let months = duration.asMonths();
    let days = duration.asDays();

    if (months > 1) {
      return 'month';
    }
    if (days > 1) {
      return 'day';
    }
    return 'hour';
  }

  buildRiskAccountQuery(options: DataQueryRequest<BMCDataSourceQuery>) {
    let filter = this.getTimeFilter('resultTimeStamp', options);
    filter = filter + ' && ' + "complianceStatus=='NonCompliant'";
    const riskAccountQueryJson = {
      searchbaraccountName0: {
        period: '$LATEST',
        aggregatedOn: 'accountName',
        filter: filter,
      },
    };

    return riskAccountQueryJson;
  }

  buildOperationsQuery(options: DataQueryRequest<BMCDataSourceQuery>) {
    let filter = this.getTimeFilter('lastStatusTimestamp', options);

    const operationsQueryJson = {
      aggregatedOn: 'lastStatusTimestamp, status',
      sortedOn: 'lastStatusTimestamp',
      period: '$HISTORIC',
      filter: filter,
    };

    return operationsQueryJson;
  }

  buildPolicyComplianceQuery(options: DataQueryRequest<BMCDataSourceQuery>) {
    let filter = this.getTimeFilter('resultTimeStamp', options);

    let assetComlianceQuery = this.getPolicyComplianceQuery(options);
    if (assetComlianceQuery && assetComlianceQuery !== '') {
      filter = filter + ' && ' + assetComlianceQuery;
    }

    const policyComplianceQueryJson = {
      period: '$LATEST',
      aggregatedOn: 'complianceStatus',
      filter: filter,
    };

    return policyComplianceQueryJson;
  }

  getPolicyComplianceQuery(options: DataQueryRequest<BMCDataSourceQuery>) {
    let query = '';
    let csQueryFor = this.getQueryForObj(options);
    if (csQueryFor.compliantRules) {
      query = "complianceStatus == 'Compliant'";
    }
    if (csQueryFor.nonCompliantRules) {
      query = query !== '' ? query + ' || ' : '';
      query += "complianceStatus == 'NonCompliant'";
    }
    if (csQueryFor.indeterminateRules) {
      query = query !== '' ? query + ' || ' : '';
      query += "complianceStatus == 'Indeterminate'";
    }

    return query;
  }

  buildPolicyDetailsQuery(options: DataQueryRequest<BMCDataSourceQuery>) {
    let filter = this.getTimeFilter('resultTimeStamp', options);
    const policyDetailsQueryJson = {
      period: '$LATEST',
      aggregatedOn: 'policyId',
      sortedOn: 'policyId',
      filter: filter,
    };
    return policyDetailsQueryJson;
  }

  buildPolicyStatusQuery(options: DataQueryRequest<BMCDataSourceQuery>) {
    let filter = this.getTimeFilter('resultTimeStamp', options);
    const PolicyStatusQueryJson = {
      period: '$LATEST',
      aggregatedOn: 'policyId,complianceStatus',
      sortedOn: 'policyId',
      filter: filter,
    };
    return PolicyStatusQueryJson;
  }

  buildResourcePoolQuery(options: DataQueryRequest<BMCDataSourceQuery>, resourcePoolAtRiskMap: any) {
    let filter: any = '';
    let i = 0;
    if (resourcePoolAtRiskMap.size > 0) {
      filter = 'resource_pool_id IN [';
      for (let resourcePoolId of resourcePoolAtRiskMap.keys()) {
        filter = filter + "'" + resourcePoolId + "'";
        if (i === resourcePoolAtRiskMap.size - 1) {
          i++;
          filter = filter + ']';
          break;
        }
        filter = filter + ', ';
        i++;
      }
    }
    const resourcePoolQueryJson = {
      size: 10,
      from: 0,
      filter: filter,
    };
    return resourcePoolQueryJson;
  }

  /**
   *
   * @param options Build query for Resource Pool at risk.
   */
  buildResourcePoolRiskQuery(options: DataQueryRequest<BMCDataSourceQuery>) {
    let filter = this.getTimeFilter('resultTimeStamp', options);
    filter = filter + " && complianceStatus == 'NonCompliant'";
    const rpRiskQueryJson = {
      period: '$LATEST',
      aggregatedOn: 'resourcePools.poolId',
      filter: filter,
      pageNumber: 0,
      pageSize: 10,
    };
    return rpRiskQueryJson;
  }
}
