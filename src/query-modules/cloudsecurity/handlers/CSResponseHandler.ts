import _, { upperCase } from 'lodash';
import { DataQueryResponse, MutableDataFrame, DataFrame, FieldType } from '@grafana/data';

export class CSResponseParser {
  constructor(private response: any, private refId: string) {}

  getDataFrame1(field: string, dataType: FieldType, target: any) {
    let frame = new MutableDataFrame({
      refId: target.refId,
      fields: [{ name: field, type: dataType }],
    });
    return frame;
  }

  getDataFrame2(field1: string, dataType1: FieldType, field2: string, dataType2: FieldType, target: any) {
    let frame = new MutableDataFrame({
      refId: target.refId,
      fields: [
        { name: field1, type: dataType1 },
        { name: field2, type: dataType2 },
      ],
    });
    return frame;
  }

  parseAssetComplianceResult(target: any): DataQueryResponse {
    const data: any[] = [];
    if (this.response && this.response.data && this.response.data.data) {
      let result = this.response.data.data;
      if (target.sourceQuery.csQueryFor.totalAssets) {
        if (result.length > 0) {
          let total = 0;
          _.each(result, valObj => {
            total += valObj.count;
          });

          let frame = this.getDataFrame1('Total Assets', FieldType.number, target);
          frame.add({ 'Total Assets': total });
          data.push(frame);
        }
      } else {
        let datetime = new Date();
        for (let i = 0; i < result.length; i++) {
          let row = result[i];
          let dps = [];
          dps.push([row.count, datetime]);

          data.push({
            target: row.complianceStatus,
            datapoints: dps,
            refId: this.refId,
          });
        }
      }
    }

    return { data: data };
  }

  parseComplianceTrendQueryResult(target: any): DataQueryResponse {
    const data: any[] = [];
    let trend = target.sourceQuery.csQueryFor.trend;
    let label = this.getLabel(trend);
    let dps: any = [];
    if (this.response && this.response.data) {
      var result = this.response.data;
      var keys = Object.keys(result);
      _.each(keys, timestamp => {
        var vals = result[timestamp];
        _.each(vals, valObj => {
          if (label === valObj.label) {
            dps.push([valObj.count, Number(timestamp)]);
          }
        });
      });

      data.push({
        target: trend,
        datapoints: dps,
        refId: this.refId,
      });
    }

    return { data: data };
  }

  getLabel(trend: any) {
    if (trend === 'Compliance' || trend === 'Non Compliance') {
      return 'RuleResult';
    } else if (trend === 'Remediation') {
      return 'ActionInvocation';
    }
    return '';
  }

  parseRiskAccountQueryResult(): DataQueryResponse {
    const dataFrame: DataFrame[] = [];
    if (
      this.response &&
      this.response.data &&
      this.response.data.searchbaraccountName0 &&
      this.response.data.searchbaraccountName0.data &&
      this.response.data.searchbaraccountName0.data.length !== 0
    ) {
      const frame = new MutableDataFrame({
        refId: this.refId,
        fields: [
          { name: 'Account Name', type: FieldType.string },
          { name: 'Non-compliance rules', type: FieldType.number },
        ],
      });
      for (let i = 0; i < this.response.data.searchbaraccountName0.data.length; i++) {
        let row = this.response.data.searchbaraccountName0.data[i];
        frame.add({ 'Account Name': row.accountName, 'Non-compliance rules': row.count });
      }
      dataFrame.push(frame);
    }
    return { data: dataFrame };
  }

  /**
   * Response Handler for Policy Compliance.
   * @param target
   */
  parsePolicyComplianceResult(target: any): DataQueryResponse {
    const data: any[] = [];
    if (this.response && this.response.data) {
      let result = this.response.data.data;

      let datetime = new Date();
      for (let i = 0; i < result.length; i++) {
        let row = result[i];
        let dps = [];
        dps.push([row.count, datetime]);

        data.push({
          target: this.getTrendName(row.complianceStatus),
          datapoints: dps,
          refId: this.refId,
        });
      }
    }

    return { data: data };
  }

  getTrendName(name: string) {
    if (name === 'Compliant') {
      return 'Compliant rules';
    } else if (name === 'NonCompliant') {
      return 'Non-compliant rules';
    } else {
      return 'Indeterminate rules';
    }
  }

  /**
   * Response Handler for Policy Status
   * @param target
   */
  parsePolicyStatusQueryResult(target: any): DataQueryResponse {
    const dataFrame: DataFrame[] = [];
    if (this.response && this.response.data && this.response.data.data && this.response.data.data.length !== 0) {
      let policyPercentageMap = this.getPolicyPercentageMap(this.getPolicyStatusMap(this.response.data.data));
      policyPercentageMap[Symbol.iterator] = function*() {
        yield* [...this.entries()].sort((a, b) => b[1] - a[1]);
      };

      const frame = this.getDataFrame2(
        'Policy Name',
        FieldType.string,
        'Compliance Percentage',
        FieldType.number,
        target
      );

      for (let [policyId, percentage] of policyPercentageMap) {
        frame.add({ 'Policy Name': policyId, 'Compliance Percentage': percentage });
      }
      dataFrame.push(frame);
    }
    return { data: dataFrame };
  }

  getPolicyStatusMap(data: any[]): Map<string, Map<string, number>> {
    let policyStatusMap = new Map<string, Map<string, number>>();
    data.forEach(policy => {
      let complianceStatusMap: any;
      if (policyStatusMap.has(policy.policyId)) {
        complianceStatusMap = policyStatusMap.get(policy.policyId);
      } else {
        complianceStatusMap = new Map<string, number>();
      }
      complianceStatusMap.set(policy.complianceStatus, policy.count);
      policyStatusMap.set(policy.policyId, complianceStatusMap);
    });
    return policyStatusMap;
  }

  getPolicyPercentageMap(policyStatusMap: Map<string, Map<string, number>>): Map<string, number> {
    let compliancePercentageMap = new Map<string, number>();
    for (let [policyId, complianceStatusMap] of policyStatusMap) {
      let compliance: any = 0;
      let nonCompliance: any = 0;
      let indeterminate: any = 0;
      for (let complianceStatus of complianceStatusMap.keys()) {
        if (upperCase(complianceStatus) === upperCase('NonCompliant')) {
          nonCompliance = complianceStatusMap.get(complianceStatus);
        } else if (upperCase(complianceStatus) === upperCase('Compliant')) {
          compliance = complianceStatusMap.get(complianceStatus);
        } else {
          indeterminate = complianceStatusMap.get(complianceStatus);
        }
      }
      compliancePercentageMap.set(policyId, (compliance / (compliance + nonCompliance + indeterminate)) * 100);
    }
    return compliancePercentageMap;
  }

  parseTotalEvaluationQueryResult(target: any) {
    const data: any[] = [];
    let dps: any = [];
    if (this.response && this.response.data) {
      let result = this.response.data;
      _.each(result, valObj => {
        dps.push([valObj.evalCount, Number(valObj.interval)]);
      });
    }
    data.push({
      target: target.sourceQuery.csQueryFor.trend,
      datapoints: dps,
      refId: this.refId,
    });
    return { data: data };
  }

  /**
   * We are removing time and grouping data by date.
   * @param target
   */
  parseOperationsResult(target: any) {
    const dataFrame: DataFrame[] = [];

    if (this.response && this.response.data && this.response.data.data) {
      let result = this.response.data.data;
      let helperMap = new Map<string, any>();

      _.each(result, function(valObj: any) {
        // remove the time from the timestamp
        let dt = new Date(valObj.lastStatusTimestamp).toDateString();
        valObj.lastStatusTimestamp = new Date(dt).getTime();
        var key = valObj.lastStatusTimestamp + '-' + valObj.status;

        if (helperMap.has(key)) {
          let existingObj = helperMap.get(key);
          existingObj.count += valObj.count;
          helperMap.set(key, existingObj);
        } else {
          helperMap.set(key, valObj);
        }
      });

      let frame = new MutableDataFrame({
        refId: target.refId,
        fields: [
          { name: 'time', type: FieldType.time },
          { name: 'status', type: FieldType.string },
          { name: 'count', type: FieldType.number },
        ],
      });

      for (let pObj of helperMap.values()) {
        frame.add({
          time: pObj.lastStatusTimestamp,
          status: pObj.status,
          count: pObj.count,
        });
      }

      dataFrame.push(frame);
    }
    return { data: dataFrame };
  }

  parseResourcePoolQueryResult(resourcePoolAtRiskMap: Map<string, string>, target: any): DataQueryResponse {
    const dataFrame: DataFrame[] = [];
    if (this.response && this.response.data && this.response.data.resource_pools) {
      let result = this.response.data.resource_pools;
      const frame = this.getDataFrame2(
        'Resource Pool Name',
        FieldType.string,
        'Non-compliance rules',
        FieldType.number,
        target
      );

      for (let [resPoolId, count] of resourcePoolAtRiskMap) {
        let resPoolName: string = resPoolId;
        result.forEach((resourcePool: any) => {
          if (resPoolId === resourcePool.resource_pool_id) {
            resPoolName = resourcePool.name;
            return;
          }
        });

        frame.add({
          'Resource Pool Name': resPoolName,
          'Non-compliance rules': count,
        });
      }

      dataFrame.push(frame);
    }
    return { data: dataFrame };
  }
}
