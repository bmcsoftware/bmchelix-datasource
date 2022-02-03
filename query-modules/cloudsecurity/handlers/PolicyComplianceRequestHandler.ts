import { BMCDataSourceQuery } from '../../../types';
import { DataQueryRequest, DataQueryResponse } from '@grafana/data';
import { CSConstants } from '../CloudSecurityConstants';
import { CSResponseParser } from './CSResponseHandler';
import { AbstCSRequestHandler } from './AbstCSRequestHandler';

export class PolicyComplianceRequestHandler extends AbstCSRequestHandler {
  private static instance: PolicyComplianceRequestHandler;
  private constructor() {
    super();
  }

  public static getInstance() {
    if (!PolicyComplianceRequestHandler.instance) {
      PolicyComplianceRequestHandler.instance = new PolicyComplianceRequestHandler();
    }
    return PolicyComplianceRequestHandler.instance;
  }

  async handleRequest(ds: any, options: DataQueryRequest<BMCDataSourceQuery>, target: any): Promise<DataQueryResponse> {
    let result: any;
    if (target.sourceQuery.csQueryFor.policyStatus) {
      result = this.handlePolicyStatusRequest(ds, options, target);
    } else {
      result = this.handlePolicyCompliance(ds, options, target);
    }

    if (result) {
      return result;
    } else {
      return Promise.resolve({ data: [] });
    }
  }

  handlePolicyCompliance(ds: any, options: DataQueryRequest<BMCDataSourceQuery>, target: any) {
    let queryObject = ds.queryBuilder.buildPolicyComplianceQuery(options);
    const policyComplianceQuery = JSON.stringify(queryObject);

    return this.post(ds, CSConstants.POLICY_COMPLIANCE_URL, policyComplianceQuery).then((response: any) => {
      try {
        return new CSResponseParser(response, target.refId).parsePolicyComplianceResult(target);
      } catch (err) {
        console.log(err);
        throw { message: CSConstants.CS_RESPONSE_ERROR };
      }
    });
  }

  handlePolicyStatusRequest(ds: any, options: DataQueryRequest<BMCDataSourceQuery>, target: any) {
    let policyStatusRequestObj = ds.queryBuilder.buildPolicyStatusQuery(options);
    const policyStatusRequestJson = JSON.stringify(policyStatusRequestObj);
    return this.post(ds, CSConstants.POLICY_STATUS_URL, policyStatusRequestJson).then(response => {
      try {
        return new CSResponseParser(response, target.refId).parsePolicyStatusQueryResult(target);
      } catch (err) {
        console.log(err);
        throw { message: CSConstants.CS_RESPONSE_ERROR };
      }
    });
  }
}
