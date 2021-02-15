export class RemedyConstants {
  static readonly REMEDY_QUERY_URL: string = 'api/arsys/v1.0/report/arsqlquery';
  static readonly REMEDY_FORM_URL: string = 'api/arsys/v1.0/report/formquery';
  static readonly REMEDY_METRIC_FORM_URL: string = 'api/arsys/v1.0/form';
  static readonly REMEDY_METRIC_COLUMN_URL: string = 'api/arsys/v1.0/fields/';
  static readonly REMEDY_METRIC_COLUMN_QUERY_PARAM: string = '?field_criteria=NAME,DATATYPE,OPTIONS&field_type=DATA';
}
