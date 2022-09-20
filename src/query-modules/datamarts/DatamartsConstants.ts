export class DatamartsConstants {
  private static readonly API_DATAMARTS_SERVICE = 'opt/api/v1/datamartservice/';
  private static readonly API_CATALOGPROXY = 'opt/api/v1/catalogproxy/';
  static readonly API_DATAMARTS_GET_ALL = DatamartsConstants.API_DATAMARTS_SERVICE + 'datamarts';
  static readonly API_DATAMARTS_GET_DATAMART_DATA = DatamartsConstants.API_DATAMARTS_GET_ALL + '/<erid>/data';
  static readonly API_DATAMARTS_GET_DATAMART_METADATA = DatamartsConstants.API_DATAMARTS_GET_ALL + '/<erid>/metadata';
  static readonly API_CATALOGPROXY_TAG_TYPES = `${DatamartsConstants.API_CATALOGPROXY}tags/types`;
  static readonly API_CATALOGPROXY_TAGS_SEARCH = `${DatamartsConstants.API_CATALOGPROXY}tags/search`;
  static readonly API_CATALOGPROXY_DOMAINS_SEARCH = `${DatamartsConstants.API_CATALOGPROXY}entities/APP/0/flatsearch`;
}
