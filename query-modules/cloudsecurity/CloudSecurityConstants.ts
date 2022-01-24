export class CSConstants {
  // URL Constants
  public static readonly ASSET_COMPLIANCE_URL = 'cloudsecurity/api/v1/resources/search';
  public static readonly POLICY_STATUS_URL: string = 'cloudsecurity/api/v1/ruleresults/search';
  public static readonly COMPLIANCE_TREND_URL = 'cloudsecurity/api/v1/timeseriesdata/search';
  public static readonly POLICY_COMPLIANCE_URL: string = 'cloudsecurity/api/v1/ruleresults/search';
  public static readonly RISK_ACCOUNT_URL: string = 'cloudsecurity/api/v1/ruleresults/parallelsearch';
  public static readonly OPERATIONS_URL: string = 'cloudsecurity/api/v1/actioninvocations/search';
  public static readonly RESOURCE_POOL_SEARCH_URL: string = 'cloudops/api/v1/resource_pools/search';
  public static readonly RESOURCE_POOL_RISK_SEARCH_URL: string = 'cloudsecurity/api/v1/ruleresults/search';

  // Value Constants
  public static readonly ASSET_COMPLIANCE = 'AssetCompliance';
  public static readonly POLICY_COMPLIANCE = 'PolicyCompliance';
  public static readonly COMPLIANCE_TREND = 'ComplianceTrend';
  public static readonly RISK_ACCOUNT = 'RiskAccount';
  public static readonly OPERATIONS = 'Operations';
  public static readonly BUSINESS_SERVICE = 'BusinessService';
  public static readonly RESOURCE_POOL = 'ResourcePool';
  public static readonly CS_RESPONSE_ERROR = 'Error Parsing Cloud Secuirty Response';
}
