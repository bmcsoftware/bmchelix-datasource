import { getTimeZones, TimeZone } from '@grafana/data';
import _ from 'lodash';
import {
  RemedyQuery,
  RemedyForm,
  RemedyMetaForm,
  SourceList,
  HeaderList,
  SelectionList,
  Qualification,
  RightOperand,
  SortField,
  LeftOperand,
  CalculatedFieldList,
  RemedyRequestBody,
  RemedyHeader,
} from './RemedyTypes';
import {
  EMPTY,
  SPACE,
  FUNCTION_SYMBOL,
  OPENING_BRACKET,
  CLOSING_BRACKET,
  OPERATOR_EQUAL,
  RELATIONAL,
  DEFAULT_DATE_RAW_SQL,
  KEYWORD_FORM,
  KEYWORD_SQL,
  KEYWORD_VALUE,
  VALUE,
  CHAR,
  INTEGER,
  COLUMN_TYPE_FIELD,
  COLUMN_TYPE_SELECT_FORM_NAME,
  COLUMN_TYPE_SELECT_COLUMN_NAME,
  SQL_ASCENDING,
  SQL_DESCENDING,
  DEFAULT_GROUP,
  TABLE,
  KEYWORD_TIME,
  KEYWORD_METRIC,
  SQL_DST_SERVER,
  SQL_APPLYDST,
  SQL_IGNOREDST,
  CALCULATED_FIELD,
  DEFAULT_DATE_FORMAT,
  DEFAULT_DATE_TIME_FORMAT,
  COLUMN_IDENTIFIER_PREFIX,
  CALCULATED_IDENTIFIER,
} from './remedy_literal_string';

export const queryType: any[] = [
  { label: KEYWORD_FORM, value: KEYWORD_FORM },
  { label: KEYWORD_SQL, value: KEYWORD_SQL },
];

export const dstType: any[] = [
  { label: SQL_DST_SERVER, value: SQL_DST_SERVER },
  { label: SQL_APPLYDST, value: SQL_APPLYDST },
  { label: SQL_IGNOREDST, value: SQL_IGNOREDST },
];
export function getDSTType() {
  return _.filter(dstType, (f) => {
    return true;
  });
}

export const formatAs: any[] = [
  { label: TABLE, value: TABLE },
  { label: 'TimeSeries', value: 'TimeSeries' },
];

export const DBFunctions = {
  Field: {
    text: COLUMN_TYPE_FIELD,
    label: COLUMN_TYPE_FIELD,
    value: COLUMN_TYPE_FIELD,
    function: 'Field',
    sql: '',
    argType: CHAR,
  },
  Average: { text: 'Average', label: 'Average', value: 'Average', function: 'DBAvg', sql: 'AVG', argType: INTEGER },
  Count: { text: 'Count', label: 'Count', value: 'Count', function: 'DBCount', sql: 'COUNT', argType: INTEGER },
  Maximum: { text: 'Maximum', label: 'Maximum', value: 'Maximum', function: 'DBMax', sql: 'MAX', argType: INTEGER },
  Minimum: { text: 'Minimum', label: 'Minimum', value: 'Minimum', function: 'DBMin', sql: 'MIN', argType: INTEGER },
  Sum: { text: 'Sum', label: 'Sum', value: 'Sum', function: 'DBSum', sql: 'SUM', argType: INTEGER },
  Date: { text: 'Date', label: 'Date', value: 'Date', function: 'Date', sql: 'DATE', argType: CHAR },
  Weekday: {
    text: 'Weekday',
    label: 'Weekday',
    value: 'Weekday',
    function: 'Weekday',
    sql: 'WEEKDAY',
    argType: INTEGER,
  },
  Day: { text: 'Day', label: 'Day', value: 'Day', function: 'Day', sql: 'DAY', argType: CHAR },
  Month: { text: 'Month', label: 'Month', value: 'Month', function: 'Month', sql: 'MONTH', argType: INTEGER },
  Quarter: {
    text: 'Quarter',
    label: 'Quarter',
    value: 'Quarter',
    function: 'Quarter',
    sql: 'QUARTER',
    argType: INTEGER,
  },
  Year: { text: 'Year', label: 'Year', value: 'Year', function: 'Year', sql: 'YEAR', argType: INTEGER },
  Time: { text: 'Time', label: 'Time', value: 'Time', function: 'Time', sql: 'TIME', argType: CHAR },
  Hour: { text: 'Hour', label: 'Hour', value: 'Hour', function: 'Hour', sql: 'HOUR', argType: INTEGER },
  Minute: { text: 'Minute', label: 'Minute', value: 'Minute', function: 'Minute', sql: 'MINUTE', argType: INTEGER },
  Second: { text: 'Second', label: 'Second', value: 'Second', function: 'Second', sql: 'SECOND', argType: INTEGER },
  Upper: { text: 'Upper', label: 'Upper', value: 'Upper', function: 'Upper', sql: 'UPPER', argType: CHAR },
  Lower: { text: 'Lower', label: 'Lower', value: 'Lower', function: 'Lower', sql: 'LOWER', argType: CHAR },
  Ltrim: { text: 'Ltrim', label: 'Ltrim', value: 'Ltrim', function: 'Ltrim', sql: 'LTRIM', argType: CHAR },
  Rtrim: { text: 'Rtrim', label: 'Rtrim', value: 'Rtrim', function: 'Rtrim', sql: 'RTRIM', argType: CHAR },
  Distinct: {
    text: 'Distinct',
    label: 'Distinct',
    value: 'Distinct',
    function: 'Distinct',
    sql: 'DISTINCT',
    argType: CHAR,
  },
};

export function getDBFunctions(text: string) {
  const returnValue = _.find(DBFunctions, function (f) {
    return f.text.includes(text);
  });
  if (returnValue) {
    return returnValue;
  }
  return DBFunctions.Field;
}

export function isDBFunctionsAggregate(text: string) {
  const returnValue = _.find(aggregateFunctions.options, function (f) {
    return f.text.includes(text);
  });
  if (returnValue) {
    return returnValue;
  }
  return false;
}

export const HeaderFunctions = {
  DateFormat: {
    text: 'Date Format',
    value: DEFAULT_DATE_FORMAT,
    collapseHeader: false,
    dataType: 'string',
    arType: 'body',
    arKey: 'date_format',
  },
  DateTimeFormat: {
    text: 'Date/Time Format',
    value: DEFAULT_DATE_TIME_FORMAT,
    collapseHeader: false,
    dataType: 'string',
    arType: 'body',
    arKey: 'date_time_format',
  },
  Locale: {
    text: 'Locale',
    value: 'en-US',
    collapseHeader: false,
    dataType: 'selection',
    arType: 'header',
    arKey: 'Accept-Language',
  },
  RowLimit: {
    text: 'Row limit',
    value: '0',
    collapseHeader: false,
    dataType: 'number',
    arType: 'body',
    arKey: 'rowLimit',
  },
  Timeout: {
    text: 'Timeout',
    value: '120',
    collapseHeader: false,
    dataType: 'number',
    arType: 'header',
    arKey: 'X-AR-Timeout',
  },
  Timezone: {
    text: 'TimeZone',
    value: 'America/Los_Angeles',
    collapseHeader: false,
    dataType: 'selection',
    arType: 'header',
    arKey: 'X-AR-Timezone',
  },
  Queue: {
    text: 'Queue',
    value: '',
    collapseHeader: false,
    dataType: 'string',
    arType: 'header',
    arKey: 'X-AR-RPC-Queue',
  },
};

export function getHeaderFunctions() {
  const headerTypes: any[] = [];
  headerTypes.push(HeaderFunctions.DateFormat);
  headerTypes.push(HeaderFunctions.DateTimeFormat);
  headerTypes.push(HeaderFunctions.Locale);
  headerTypes.push(HeaderFunctions.RowLimit);
  headerTypes.push(HeaderFunctions.Timeout);
  headerTypes.push(HeaderFunctions.Timezone);
  return headerTypes;
}
export function getHeaderDataType(text: string) {
  const returnValue = _.find(HeaderFunctions, function (f) {
    return f.text.includes(text);
  });
  if (returnValue) {
    return returnValue;
  }
  return HeaderFunctions.DateFormat;
}

export const RemedyLocale = {
  English: { label: 'en-US', value: 'en-US' },
  French: { label: 'fr', value: 'fr' },
  German: { label: 'de', value: 'de' },
  Italian: { label: 'it', value: 'it' },
  Japanese: { label: 'ja', value: 'ja' },
  Korean: { label: 'ko', value: 'ko' },
  Portuguese: { label: 'pt-BR', value: 'pt-BR' },
  Russian: { label: 'ru', value: 'ru' },
  Simplified_Chinese: { label: 'zh-CN', value: 'zh-CN' },
  Spanish: { label: 'es', value: 'es' },
  Dutch: { label: 'nl', value: 'nl' },
  Swedish: { label: 'sv', value: 'sv' },
  Danish: { label: 'da', value: 'da' },
  Norwegian: { label: 'no', value: 'no' },
};
export function getRemedyLocaleList() {
  const locales: any[] = [];
  locales.push(RemedyLocale.English);
  locales.push(RemedyLocale.French);
  locales.push(RemedyLocale.German);
  locales.push(RemedyLocale.Italian);
  locales.push(RemedyLocale.Japanese);
  locales.push(RemedyLocale.Korean);
  locales.push(RemedyLocale.Portuguese);
  locales.push(RemedyLocale.Russian);
  locales.push(RemedyLocale.Simplified_Chinese);
  locales.push(RemedyLocale.Spanish);
  locales.push(RemedyLocale.Dutch);
  locales.push(RemedyLocale.Swedish);
  locales.push(RemedyLocale.Danish);
  locales.push(RemedyLocale.Norwegian);
  return locales;
}
export function getRemedyLocale(text: string) {
  const returnValue = _.find(RemedyLocale, function (f) {
    return f.label.includes(text);
  });
  if (returnValue) {
    return returnValue;
  }
  return RemedyLocale.English;
}

export function getTimeZoneList() {
  let timezone: TimeZone[] = getTimeZones();
  let returnValue: any[] = [];
  timezone.forEach((tz) => {
    returnValue.push({ label: tz, value: tz });
  });
  return returnValue;
}

export function getAutoComplete() {
  return {
    locale: getRemedyLocaleList(),
    timezone: getTimeZoneList(),
    metaFullFormNames: [],
    metaColumnNames: [],
    metaGroupNames: [],
    metaOrderNames: [],
    metaHavingNames: [],
    metaCalculatedFields: [],
  };
}

// Default Data
// Sort
export function getSortFieldSortOperand() {
  return new SelectionList(COLUMN_TYPE_FIELD, COLUMN_TYPE_SELECT_COLUMN_NAME, EMPTY, EMPTY);
}

export function getSortField() {
  return [new SortField(getSortFieldSortOperand(), SQL_ASCENDING)];
}
// Group
export function getGroupByField() {
  return [new SelectionList(COLUMN_TYPE_FIELD, COLUMN_TYPE_SELECT_COLUMN_NAME, EMPTY, EMPTY)];
}
// Having
export function getHavingLeftOperand() {
  return new LeftOperand(COLUMN_TYPE_FIELD, null, COLUMN_TYPE_SELECT_COLUMN_NAME, EMPTY);
}
export function getHavingRightOperand() {
  return new RightOperand(VALUE, null, CHAR, EMPTY, COLUMN_TYPE_SELECT_COLUMN_NAME, EMPTY);
}
export function getHavingQualification() {
  return [
    new Qualification(
      false,
      1,
      DEFAULT_GROUP,
      RELATIONAL,
      EMPTY,
      OPERATOR_EQUAL,
      null,
      null,
      getHavingLeftOperand(),
      getHavingRightOperand()
    ),
  ];
}
// Where
export function getWhereLeftOperand() {
  return new LeftOperand(COLUMN_TYPE_FIELD, null, COLUMN_TYPE_SELECT_COLUMN_NAME, EMPTY);
}
export function getWhereRightOperand() {
  return new RightOperand(VALUE, null, CHAR, EMPTY, COLUMN_TYPE_SELECT_COLUMN_NAME, EMPTY);
}
export function getWhereQualification() {
  return [
    new Qualification(
      false,
      1,
      DEFAULT_GROUP,
      RELATIONAL,
      EMPTY,
      OPERATOR_EQUAL,
      null,
      null,
      getWhereLeftOperand(),
      getWhereRightOperand()
    ),
  ];
}
// Column
export function getSelectionList() {
  return [new SelectionList(COLUMN_TYPE_FIELD, COLUMN_TYPE_SELECT_COLUMN_NAME, EMPTY, `${COLUMN_IDENTIFIER_PREFIX}1`)];
}

export function getNewCalculatedFieldList() {
  return [
    new CalculatedFieldList(
      CALCULATED_FIELD,
      COLUMN_TYPE_SELECT_COLUMN_NAME,
      `${CALCULATED_IDENTIFIER}1`,
      EMPTY,
      true,
      false
    ),
  ];
}
// Form
// JoinClause
export function getJoinClauseLeftOperand() {
  return new LeftOperand(COLUMN_TYPE_FIELD, null, COLUMN_TYPE_SELECT_COLUMN_NAME, EMPTY);
}

export function getJoinClauseRightOperand() {
  return new RightOperand(COLUMN_TYPE_FIELD, null, CHAR, EMPTY, COLUMN_TYPE_SELECT_COLUMN_NAME, EMPTY);
}
export function getJoinClauseQualification() {
  return [
    new Qualification(
      false,
      1,
      DEFAULT_GROUP,
      RELATIONAL,
      EMPTY,
      OPERATOR_EQUAL,
      null,
      null,
      getJoinClauseLeftOperand(),
      getJoinClauseRightOperand()
    ),
  ];
}
export function getSourceList() {
  return [new SourceList(KEYWORD_FORM, COLUMN_TYPE_SELECT_FORM_NAME, EMPTY, false, getJoinClauseQualification())];
}
export function getRemedyMeta() {
  return new RemedyMetaForm(false, false, EMPTY, false, EMPTY, [], [], [], []);
}

export function getRemedyForm() {
  return new RemedyForm(
    getRemedyMeta(),
    getSourceList(),
    getSelectionList(),
    true,
    getWhereQualification(),
    true,
    getGroupByField(),
    true,
    getHavingQualification(),
    true,
    getSortField(),
    SQL_DST_SERVER,
    true,
    true,
    0,
    100,
    true,
    true,
    getNewCalculatedFieldList()
  );
}

// Remedy Body
export function getRemedyBody() {
  return new RemedyRequestBody(DEFAULT_DATE_FORMAT, DEFAULT_DATE_TIME_FORMAT, TABLE, '');
}
export function getHeaderList() {
  return [
    new HeaderList(
      HeaderFunctions.DateFormat.text,
      HeaderFunctions.DateFormat.value,
      HeaderFunctions.DateFormat.collapseHeader,
      HeaderFunctions.DateFormat.dataType,
      HeaderFunctions.DateFormat.arType,
      HeaderFunctions.DateFormat.arKey
    ),
  ];
}

export function getRemedyHeader() {
  return new RemedyHeader(true, getHeaderList());
}

// Remedy Query
export function getRemedyQuery() {
  return new RemedyQuery(
    '1.0',
    queryType[0].value,
    formatAs[0].value,
    DEFAULT_DATE_RAW_SQL,
    getRemedyForm(),
    dstType[0].value,
    getRemedyHeader(),
    guid()
  );
}

export function guid() {
  function _p8(s?: boolean) {
    var p = (Math.random().toString(16) + '000000000').substr(2, 8);
    return s ? '-' + p.substr(0, 4) + '-' + p.substr(4, 4) : p;
  }
  return _p8() + _p8(true) + _p8(true) + _p8();
}
export const DBFormType = {
  FORM: {
    text: KEYWORD_FORM,
    label: KEYWORD_FORM,
    value: KEYWORD_FORM,
    type: KEYWORD_FORM,
    sql: KEYWORD_FORM,
  },
  INNER_JOIN: {
    text: 'Inner Join',
    label: 'Inner Join',
    value: 'Inner Join',
    type: 'INNER',
    sql: 'INNER JOIN',
  },
  LEFT_INNER_JOIN: {
    text: 'Left Outer Join',
    label: 'Left Outer Join',
    value: 'Left Outer Join',
    type: 'LEFT',
    sql: 'LEFT OUTER JOIN',
  },
  RIGHT_INNER_JOIN: {
    text: 'Right Outer Join',
    label: 'Right Outer Join',
    value: 'Right Outer Join',
    type: 'RIGHT',
    sql: 'RIGHT OUTER JOIN',
  },
};

export function getDBFormJoinType(text: string) {
  const returnValue = _.find(DBFormType, function (f) {
    return f.text.includes(text);
  });
  if (returnValue) {
    return returnValue;
  }
  return DBFormType.FORM;
}

export function getFormTypes() {
  const formTypes: any[] = [];
  formTypes.push(DBFormType.FORM);
  formTypes.push(DBFormType.INNER_JOIN);
  formTypes.push(DBFormType.LEFT_INNER_JOIN);
  formTypes.push(DBFormType.RIGHT_INNER_JOIN);
  return formTypes;
}

export let formNames: any[] = [{ text: EMPTY, value: EMPTY }];
export function getFormNames(formList?: any[]) {
  if (formList && formList.length > 0) {
    return _.filter(formList, (f) => {
      return true;
    });
  }
  return _.filter(formNames, (f) => {
    return true;
  });
}

export const formAliases: any[] = [{ text: EMPTY, value: EMPTY }];
export function getFormAliases() {
  return _.filter(formAliases, (f) => {
    return true;
  });
}

const basicFunctions = {
  text: 'Basic' + SPACE + OPENING_BRACKET + FUNCTION_SYMBOL + CLOSING_BRACKET,
  label: 'Basic' + SPACE + OPENING_BRACKET + FUNCTION_SYMBOL + CLOSING_BRACKET,
  value: 'Basic',
  options: [DBFunctions.Field],
};
const aggregateFunctions = {
  text: 'Aggregates' + SPACE + OPENING_BRACKET + FUNCTION_SYMBOL + CLOSING_BRACKET,
  label: 'Aggregates' + SPACE + OPENING_BRACKET + FUNCTION_SYMBOL + CLOSING_BRACKET,
  value: 'Aggregates',
  options: [DBFunctions.Average, DBFunctions.Count, DBFunctions.Sum, DBFunctions.Maximum, DBFunctions.Minimum],
};
const dateFunctions = {
  text: 'Date' + SPACE + OPENING_BRACKET + FUNCTION_SYMBOL + CLOSING_BRACKET,
  label: 'Date' + SPACE + OPENING_BRACKET + FUNCTION_SYMBOL + CLOSING_BRACKET,
  value: 'Date',
  options: [
    DBFunctions.Date,
    DBFunctions.Weekday,
    DBFunctions.Day,
    DBFunctions.Month,
    DBFunctions.Quarter,
    DBFunctions.Year,
  ],
};
const timeFunctions = {
  text: 'Time' + SPACE + OPENING_BRACKET + FUNCTION_SYMBOL + CLOSING_BRACKET,
  label: 'Time' + SPACE + OPENING_BRACKET + FUNCTION_SYMBOL + CLOSING_BRACKET,
  value: 'Time',
  options: [DBFunctions.Time, DBFunctions.Hour, DBFunctions.Minute, DBFunctions.Second],
};
const stringFunctions = {
  text: 'String' + SPACE + OPENING_BRACKET + FUNCTION_SYMBOL + CLOSING_BRACKET,
  label: 'String' + SPACE + OPENING_BRACKET + FUNCTION_SYMBOL + CLOSING_BRACKET,
  value: 'String',
  options: [DBFunctions.Upper, DBFunctions.Lower, DBFunctions.Ltrim, DBFunctions.Rtrim],
};
export function getColumnTypes() {
  const columnTypes: any[] = [];
  columnTypes.push(basicFunctions);
  columnTypes.push(aggregateFunctions);
  columnTypes.push(dateFunctions);
  columnTypes.push(timeFunctions);
  columnTypes.push(stringFunctions);
  return columnTypes;
}

export const columnNames: any[] = [{ text: EMPTY, value: EMPTY }];
export function getColumnNames(columnList?: any[]) {
  if (columnList && columnList.length > 0) {
    return _.filter(columnList, (f) => {
      return true;
    });
  } else {
    return _.filter(columnNames, (f) => {
      return true;
    });
  }
}
export const columnAliases: any[] = [
  { text: KEYWORD_TIME, label: KEYWORD_TIME, value: KEYWORD_TIME },
  { text: KEYWORD_METRIC, label: KEYWORD_METRIC, value: KEYWORD_METRIC },
  { text: KEYWORD_VALUE, label: KEYWORD_VALUE, value: KEYWORD_VALUE },
];
export function getColumnAliases() {
  return _.filter(columnAliases, (f) => {
    return true;
  });
}
export function getWhereTypes() {
  const columnTypes: any[] = [];
  columnTypes.push(basicFunctions);
  columnTypes.push(dateFunctions);
  columnTypes.push(timeFunctions);
  columnTypes.push(stringFunctions);
  return columnTypes;
}
export function getHavingTypes() {
  const columnTypes: any[] = [];
  columnTypes.push(aggregateFunctions);
  return columnTypes;
}

export const DBOperator = {
  Equal: { text: OPERATOR_EQUAL, label: OPERATOR_EQUAL, value: OPERATOR_EQUAL, function: OPERATOR_EQUAL, sql: '=' },
  NotEqual: { text: 'Not Equal', label: 'Not Equal', value: 'NotEqual', function: 'NotEqual', sql: '!=' },
  GreaterThan: {
    text: 'Greater Than',
    label: 'Greater Than',
    value: 'GreaterThan',
    function: 'GreaterThan',
    sql: '>',
  },
  GreaterThanOrEqual: {
    text: 'Greater Than Or Equal',
    label: 'Greater Than Or Equal',
    value: 'GreaterThanOrEqual',
    function: 'GreaterThanOrEqual',
    sql: '>=',
  },
  LessThan: { text: 'Less Than', label: 'Less Than', value: 'LessThan', function: 'LessThan', sql: '<' },
  LessThanOrEqual: {
    text: 'Less Than Or Equal',
    label: 'Less Than Or Equal',
    value: 'LessThanOrEqual',
    function: 'LessThanOrEqual',
    sql: '<=',
  },
  In: { text: 'In', label: 'In', value: 'In', function: 'In', sql: 'In' },
  NotIn: { text: 'Not In', label: 'Not In', value: 'NotIn', function: 'NotIn', sql: 'Not In' },
  Like: { text: 'Like', label: 'Like', value: 'Like', function: 'Like', sql: 'Like' },
  NotLike: { text: 'Not Like', label: 'Not Like', value: 'NotLike', function: 'NotLike', sql: 'Not Like' },
  Is: { text: 'Is', label: 'Is', value: 'Is', function: 'Equal', sql: 'IS' },
  IsNot: { text: 'Is Not', label: 'Is Not', value: 'IsNot', function: 'NotEqual', sql: 'IS NOT' },
};

export function getDBOperator(value: string) {
  const returnValue = _.find(DBOperator, function (f) {
    return f.value.includes(value);
  });
  if (returnValue) {
    return returnValue;
  }
  return DBOperator.Equal;
}

export function getRelationalOperator() {
  const relationalOperator: any[] = [
    DBOperator.Equal,
    DBOperator.NotEqual,
    DBOperator.GreaterThan,
    DBOperator.LessThan,
    DBOperator.GreaterThanOrEqual,
    DBOperator.LessThanOrEqual,
    DBOperator.In,
    DBOperator.NotIn,
    DBOperator.Is,
    DBOperator.IsNot,
    DBOperator.Like,
    DBOperator.NotLike,
  ];
  return relationalOperator;
}
export function getFormJoinRelationalOperator() {
  const relationalOperator: any[] = [
    DBOperator.Equal,
    DBOperator.NotEqual,
    DBOperator.GreaterThan,
    DBOperator.LessThan,
    DBOperator.GreaterThanOrEqual,
    DBOperator.LessThanOrEqual,
  ];
  return relationalOperator;
}

export const sortOrder: any[] = [
  { text: SQL_ASCENDING, label: SQL_ASCENDING, value: SQL_ASCENDING },
  { text: SQL_DESCENDING, label: SQL_DESCENDING, value: SQL_DESCENDING },
];
export function getSortOrder() {
  return _.filter(sortOrder, (f) => {
    return true;
  });
}
