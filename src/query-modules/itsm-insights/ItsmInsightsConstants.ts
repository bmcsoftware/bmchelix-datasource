export class ItsmInsightsConstants {
  // URL Constants
  public static readonly JOBS_CREATED_URL = 'aif/api/v1.0/algorithm/count';
  public static readonly NUMBER_OF_EXECUTIONS_URL: string = 'aif/api/v1.0/algorithm/executions/count';
  public static readonly EMERGING_CLUSTERS_URL = 'aif/api/v1.0/algorithm/clusters';

  // Value Constants
  public static readonly NUMBER_OF_JOBS_CREATED = 'NUMBER_OF_JOBS_CREATED';
  public static readonly NUMBER_OF_JOB_EXECUTIONS = 'NUMBER_OF_JOB_EXECUTIONS';
  public static readonly TOP_EMERGING_CLUSTERS = 'TOP_EMERGING_CLUSTERS';

  public static readonly ITSM_INSIGHTS_RESPONSE_ERROR = 'Error Parsing ITSM Insights Response';

  public static readonly ITSM_INSIGHTS_FORBIDDEN_ERROR = 'Error: Insufficient access to a view this resource';
  public static readonly STATUS_FORBIDDEN = 403;

  public static readonly MOCK = false;
  public static readonly MOCK_EMERGING_CLUSTERS = false

  public static readonly DEFAULT_LIMIT_TOP_EMERGING_CLUSTERS = 5;

}
