import { AbstCSRequestHandler } from './AbstCSRequestHandler';
import { AssetComplianceRequestHandler } from './AssetComplianceRequestHandler';
import { CSDefaultRequestHandler } from './CSDefaultRequestHandler';
import { ComplianceTrendRequestHandler } from './ComplianceTrendRequestHandler';
import { RiskAccountRequestHandler } from './RiskAccountRequestHandler';
import { OperationsRequestHandler } from './OperationsRequestHandler';
import { PolicyComplianceRequestHandler } from './PolicyComplianceRequestHandler';
import { ResourcePoolRequestHandler } from './ResourcePoolRequestHandler';
import { CSConstants } from '../CloudSecurityConstants';

export class CSRquestHandlerFactory {
  static getRequestHandler(type: string): AbstCSRequestHandler {
    switch (type) {
      case CSConstants.ASSET_COMPLIANCE:
        return AssetComplianceRequestHandler.getInstance();
      case CSConstants.POLICY_COMPLIANCE:
        return PolicyComplianceRequestHandler.getInstance();
      case CSConstants.COMPLIANCE_TREND:
        return ComplianceTrendRequestHandler.getInstance();
      case CSConstants.RISK_ACCOUNT:
        return RiskAccountRequestHandler.getInstance();
      case CSConstants.OPERATIONS:
        return OperationsRequestHandler.getInstance();
      case CSConstants.RESOURCE_POOL:
        return ResourcePoolRequestHandler.getInstance();
      default:
        return new CSDefaultRequestHandler();
    }
  }
}
