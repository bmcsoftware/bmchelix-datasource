import TableModel from 'grafana/app/core/table_model';

export class TableModelCustom extends TableModel {
  refId: string;
  constructor(refId: string) {
    super();
    this.refId = refId;
  }
}

// Remedy classes
export class RestType {
  type: string;
  constructor(type: string) {
    this.type = type;
  }
}

export class RestOperand extends RestType {
  alias: string | null;

  constructor(type: string, alias: string | null) {
    super(type);
    this.alias = alias;
  }
}

export class RestQuerySource extends RestType {
  constructor(type: string) {
    super(type);
  }
}

export class RestFormQuerySource extends RestQuerySource {
  form_name: string;
  alias: string;

  constructor(type: string, form_name: string, alias: string) {
    super(type);
    this.form_name = form_name;
    this.alias = alias;
  }
}

export class RestFormJoinQuerySource extends RestQuerySource {
  join_type: string;
  left_source: RestQuerySource;
  right_source: RestQuerySource;
  join_qualification: RestQualification;

  constructor(
    type: string,
    join_type: string,
    left_source: RestQuerySource,
    right_source: RestQuerySource,
    join_qualification: RestQualification
  ) {
    super(type);
    this.join_type = join_type;
    this.left_source = left_source;
    this.right_source = right_source;
    this.join_qualification = join_qualification;
  }
}

export class RestFieldOperand extends RestOperand {
  field_name: string;
  source_alias: string;

  constructor(type: string, alias: string, field_name: string, source_alias: string) {
    super(type, alias);
    this.field_name = field_name;
    this.source_alias = source_alias;
  }
}

export class RestCurrencyFieldOperand extends RestFieldOperand {
  currency_part_type: string;
  currency_code: string;

  constructor(
    type: string,
    alias: string,
    form_name: string,
    source_alias: string,
    currency_part_type: string,
    currency_code: string
  ) {
    super(type, alias, form_name, source_alias);
    this.currency_part_type = currency_part_type;
    this.currency_code = currency_code;
  }
}

export class RestAliasOperand extends RestOperand {
  source_alias: string;
  constructor(type: string, alias: string, source_alias: string) {
    super(type, alias);
    this.source_alias = source_alias;
  }
}

export class RestBinaryArithmeticOperand extends RestOperand {
  arithmetic_operator: string;
  left_operand: RestOperand;
  right_operand: RestOperand;

  constructor(
    type: string,
    alias: string,
    arithmetic_operator: string,
    left_operand: RestOperand,
    right_operand: RestOperand
  ) {
    super(type, alias);
    this.arithmetic_operator = arithmetic_operator;
    this.left_operand = left_operand;
    this.right_operand = right_operand;
  }
}

export class RestFunctionOperand extends RestOperand {
  function_code: string;
  function_arguments: RestOperand[];

  constructor(type: string, alias: string | null, function_code: string, function_arguments: RestOperand[]) {
    super(type, alias);
    this.function_code = function_code;
    this.function_arguments = function_arguments;
  }
}

export class RestValueOperand extends RestOperand {
  data_type: string;
  value: any;

  constructor(type: string, alias: string, data_type: string, value: any) {
    super(type, alias);
    this.data_type = data_type;
    this.value = value;
  }
}

export class RestValueListOperand extends RestOperand {
  value_list: RestValueOperand[];

  constructor(type: string, alias: string, value_list: RestValueOperand[]) {
    super(type, alias);
    this.value_list = value_list;
  }
}

export class RestQualification {
  type: string;
  constructor(type: string) {
    this.type = type;
  }
}

export class RestBinaryLogicalQualification extends RestQualification {
  logical_operator: string;
  left_qualification: RestQualification | null;
  right_qualification: RestQualification | null;
  constructor(
    type: string,
    logical_operator: string,
    left_qualification: RestQualification | null,
    right_qualification: RestQualification | null
  ) {
    super(type);
    this.logical_operator = logical_operator;
    this.left_qualification = left_qualification;
    this.right_qualification = right_qualification;
  }
}

export class RestRelationalQualification extends RestQualification {
  relational_operator: string;
  left_operand: RestOperand;
  right_operand: RestQualification;
  constructor(type: string, relational_operator: string, left_operand: RestOperand, right_operand: RestOperand) {
    super(type);
    this.relational_operator = relational_operator;
    this.left_operand = left_operand;
    this.right_operand = right_operand;
  }
}

export class RestUnaryLogicalQualification extends RestQualification {
  logical_operator: string;
  qualification: RestQualification;
  constructor(type: string, logical_operator: string, qualification: RestQualification) {
    super(type);
    this.logical_operator = logical_operator;
    this.qualification = qualification;
  }
}

export class RestSortInfo {
  sort_operand: RestOperand;
  sort_order: string;

  constructor(sort_operand: RestOperand, sort_order: string) {
    this.sort_operand = sort_operand;
    this.sort_order = sort_order;
  }
}

export class RestQuery {
  output_type: string;

  constructor(output_type: string) {
    this.output_type = output_type;
  }
}

export class RestFormQuery extends RestQuery {
  source_list: RestQuerySource[] | null;
  selection_list: RestOperand[] | null;
  qualification: RestQualification | null;
  sort_list: RestSortInfo[] | null;
  group_by_list: RestOperand[] | null;
  having_qualification: RestQualification | null;
  start_entry: number;
  max_entries: number;
  use_locale: boolean;
  use_distinct: boolean;

  constructor(
    output_type: string,
    source_list: RestQuerySource[] | null,
    selection_list: RestOperand[] | null,
    qualification: RestQualification | null,
    sort_list: RestSortInfo[] | null,
    group_by_list: RestOperand[] | null,
    having_qualification: RestQualification | null,
    start_entry: number,
    max_entries: number,
    use_locale: boolean,
    use_distinct: boolean
  ) {
    super(output_type);
    this.source_list = source_list;
    this.selection_list = selection_list;
    this.qualification = qualification;
    this.sort_list = sort_list;
    this.group_by_list = group_by_list;
    this.having_qualification = having_qualification;
    this.start_entry = start_entry;
    this.max_entries = max_entries;
    this.use_locale = use_locale;
    this.use_distinct = use_distinct;
  }
}
