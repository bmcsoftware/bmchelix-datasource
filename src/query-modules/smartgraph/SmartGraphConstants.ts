export class SmartGraphConstants {
  public static readonly SMARTGRAPH_SEARCH_SERVICE_URL: string =
    'smart-graph-api/api/v1.2/data/search?format=object&query=search BusinessService show ' +
    encodeURIComponent('#id') +
    ',name';
  public static readonly SMARTGRAPH_SEARCH_SERVICE_URL_V1: string =
    'smart-graph-api/api/v1.2/data/search?limit=1000&format=object&query=';
}