import * as cls from './RemedyClasses';
import _ from 'lodash';
import {
  RemedyForm,
  RemedyQuery,
  SourceList,
  SelectionList,
  SortField,
  Qualification,
  GroupQualification,
  CalculatedFieldList,
  RemedyRequestBody,
} from './RemedyTypes';
import * as queryDef from './remedy_query_def';
import {
  DOT,
  COMMA,
  EMPTY,
  ARROW,
  SPACE,
  NEWLINE,
  UNDERSCORE,
  BACK_QUOTE,
  OPENING_BRACKET,
  CLOSING_BRACKET,
  OPERATOR_AND,
  OPERATOR_OR,
  GROUP_IDENTIFIER,
  SINGLE_IDENTIFIER,
  RELATIONAL,
  BINARYLOGICAL,
  SAME,
  IN,
  OUT,
  SPLIT,
  KEYWORD_FORM,
  COLUMN_TYPE_FIELD,
  COLUMN_TYPE_FUNCTION,
  SQL_SELECT,
  SQL_AS,
  SQL_FROM,
  SQL_WHERE,
  SQL_ONE_EQUAL_ONE,
  SQL_GROUPBY,
  SQL_ORDERBY,
  SQL_HAVING,
  SQL_DISTINCT,
  SINGLE_QUOTE,
  DOUBLE_QUOTE,
  SQL_ON,
  KEYWORD_JOIN,
  VALUE,
  CHAR,
  INTEGER,
  VALUELIST,
  NULL,
  SQL_LIMIT,
  SQL_DST_SERVER,
  DOLLAR_SYMBOL,
  CALCULATED_FIELD,
} from './remedy_literal_string';

export class RemedyQueryBuilder {
  constructor() {}

  build(target: any, remedyBody?: RemedyRequestBody, adhocFilters?: any) {
    if (remedyBody === undefined) {
      remedyBody = queryDef.getRemedyBody();
    }
    if (target.sourceQuery.queryType === KEYWORD_FORM) {
      remedyBody.sql = this.buildFullSql(target.sourceQuery.form);
    } else {
      remedyBody.sql = target.sourceQuery.rawQuery;
    }
    return remedyBody;
  }

  buildForm(target: any) {
    const inputQuery: RemedyQuery = target.sourceQuery;
    const inputForm: RemedyForm = target.sourceQuery.form;

    let output_type: string = inputQuery.formatAs;
    //Form
    let source_list: cls.RestQuerySource[] = this.buildSourceList(inputForm.sourceList);
    // Column
    let selection_list: cls.RestOperand[] = this.buildSelectionList(inputForm.selectionList);
    // Where
    let qualification: cls.RestQualification | null = !inputForm.hideQual
      ? this.buildQualification(this.buildGroupQualification(inputForm.qualification))
      : inputForm.useOneEqualOne
      ? this.createBlankQualification()
      : null;
    // Group By
    let group_by_list: cls.RestOperand[] | null = !inputForm.hideGroupBy
      ? this.buildSelectionList(inputForm.groupByField)
      : null;
    // Having
    let having_qualification: cls.RestQualification | null = !inputForm.hideHaving
      ? this.buildQualification(this.buildGroupQualification(inputForm.havingQualification))
      : null;
    // Order By
    let sort_list: cls.RestSortInfo[] | null = !inputForm.hideSort ? this.buildSortField(inputForm.sortField) : null;

    let start_entry: number = inputForm.startEntry;
    let max_entries: number = +inputForm.maxEntries;
    let use_locale: boolean = inputForm.useLocale;
    let use_distinct: boolean = inputForm.useDistinct;

    const outputForm = new cls.RestFormQuery(
      output_type,
      source_list,
      selection_list,
      qualification,
      sort_list,
      group_by_list,
      having_qualification,
      start_entry,
      max_entries,
      use_locale,
      use_distinct
    );
    return outputForm;
  }

  buildSourceList(inputList: SourceList[]) {
    let outputList: cls.RestQuerySource[] = [];
    let joinType = false;
    _.each(inputList, (input) => {
      if (input.sourceFormName) {
        if (input.sourceType.indexOf(KEYWORD_JOIN) > 0) {
          // Break if JOIN is used
          joinType = true;
          return;
        }
        outputList.push(new cls.RestFormQuerySource(input.sourceType, input.sourceFormName, input.sourceAlias));
      }
    });
    // If Form is JOIN then process and override outputList
    let clonedInputList: SourceList[] = Object.assign([], inputList);
    if (joinType && clonedInputList.length >= 2) {
      let first = clonedInputList[0];
      let left = new cls.RestFormQuerySource(KEYWORD_FORM, first.sourceFormName, first.sourceAlias);
      // Remove First element
      clonedInputList.shift();

      // Process recursively all remaining Forms
      let final = this.buildRestFormJoinRecursively(left, clonedInputList);
      outputList = [final];
    }
    return outputList;
  }

  buildRestFormJoinRecursively(left: cls.RestQuerySource, clonedInputList: SourceList[]): cls.RestFormJoinQuerySource {
    let right = clonedInputList[0];
    // Remove First element
    clonedInputList.shift();
    let rightSource = new cls.RestFormQuerySource(KEYWORD_FORM, right.sourceFormName, right.sourceAlias);

    let leftOperand: cls.RestFieldOperand = new cls.RestFieldOperand(
      right.sourceJoinClause[0].leftOperand?.fieldType || EMPTY,
      EMPTY,
      this.splitAndGetColumnName(right.sourceJoinClause[0].leftOperand?.fieldName || EMPTY),
      right.sourceJoinClause[0].leftOperand?.fieldSourceAlias || EMPTY
    );
    let rightOperand: cls.RestFieldOperand = new cls.RestFieldOperand(
      right.sourceJoinClause[0].rightOperand?.fieldType || EMPTY,
      EMPTY,
      this.splitAndGetColumnName(right.sourceJoinClause[0].rightOperand?.fieldName || EMPTY),
      right.sourceJoinClause[0].rightOperand?.fieldSourceAlias || EMPTY
    );
    let join_qualification = new cls.RestRelationalQualification(
      RELATIONAL,
      right.sourceJoinClause[0].relationalOperator,
      leftOperand,
      rightOperand
    );
    let joinForm = new cls.RestFormJoinQuerySource(
      KEYWORD_JOIN,
      queryDef.getDBFormJoinType(right.sourceType).type,
      left,
      rightSource,
      join_qualification
    );

    // Check and process next form recursively
    if (clonedInputList.length >= 1) {
      return this.buildRestFormJoinRecursively(joinForm, clonedInputList);
    }
    return joinForm;
  }

  buildSelectionList(inputList: SelectionList[]) {
    let outputList: cls.RestOperand[] = [];
    _.each(inputList, (input) => {
      switch (input.selectionType) {
        case queryDef.DBFunctions.Field.text: {
          outputList.push(
            new cls.RestFieldOperand(
              input.selectionType,
              this.replaceSpaceWithUnderscore(input.selectionAlias),
              this.splitAndGetColumnName(input.selectionColumnName),
              input.selectionSrcAlias
            )
          );
          break;
        }
        case queryDef.DBFunctions.Average.text:
        case queryDef.DBFunctions.Count.text:
        case queryDef.DBFunctions.Maximum.text:
        case queryDef.DBFunctions.Minimum.text:
        case queryDef.DBFunctions.Sum.text:
        case queryDef.DBFunctions.Date.text:
        case queryDef.DBFunctions.Time.text:
        case queryDef.DBFunctions.Month.text:
        case queryDef.DBFunctions.Day.text:
        case queryDef.DBFunctions.Year.text:
        case queryDef.DBFunctions.Weekday.text:
        case queryDef.DBFunctions.Hour.text:
        case queryDef.DBFunctions.Minute.text:
        case queryDef.DBFunctions.Second.text:
        case queryDef.DBFunctions.Quarter.text:
        case queryDef.DBFunctions.Upper.text:
        case queryDef.DBFunctions.Lower.text:
        case queryDef.DBFunctions.Ltrim.text:
        case queryDef.DBFunctions.Rtrim.text: {
          const funcField = new cls.RestFieldOperand(
            COLUMN_TYPE_FIELD,
            this.replaceSpaceWithUnderscore(input.selectionAlias),
            this.splitAndGetColumnName(input.selectionColumnName),
            input.selectionSrcAlias
          );
          let funcArg: cls.RestOperand[] = [funcField];
          const func = new cls.RestFunctionOperand(
            COLUMN_TYPE_FUNCTION,
            this.replaceSpaceWithUnderscore(input.selectionAlias),
            queryDef.getDBFunctions(input.selectionType).function,
            funcArg
          );
          outputList.push(func);
          break;
        }
      }
    });
    return outputList;
  }

  buildQualification(inputList: GroupQualification[]): cls.RestQualification | null {
    let length = inputList.length;
    let operator = OPERATOR_AND;
    switch (true) {
      case length === 1:
        // Create Relational
        if (inputList[0] && inputList[0].isSingle()) {
          return this.createRelationalQualification(inputList[0].qualification);
        } else {
          // recursive
          if (inputList[0].groupQualification) {
            return this.buildQualification(inputList[0].groupQualification);
          }
        }

      case length === 2:
        // If first element is single create relational
        let inputFirst: GroupQualification | null = inputList[0];
        let leftQual: cls.RestQualification | null = null;
        if (inputFirst && inputFirst.isSingle()) {
          leftQual = this.createRelationalQualification(inputFirst.qualification);
          if (inputFirst.qualification) {
            operator = inputFirst.qualification.logicalOperator;
          }
        } else {
          // else recursive
          if (inputFirst.groupQualification) {
            leftQual = this.buildQualification(inputFirst.groupQualification);
            operator = this.getLastElementOperator(
              inputFirst.groupQualification[inputFirst.groupQualification.length - 1]
            );
          }
        }
        // If Second element is single create relational
        let inputSecond: GroupQualification | null = inputList[1];
        let rightQual: cls.RestQualification | null = null;
        if (inputSecond && inputSecond.isSingle()) {
          rightQual = this.createRelationalQualification(inputSecond.qualification);
        } else {
          // else recursive
          if (inputSecond.groupQualification) {
            rightQual = this.buildQualification(inputSecond.groupQualification);
          }
        }
        return this.createBinaryQualification(leftQual, rightQual, operator);

      default:
        // find First OR Operator
        let index = this.getORIndex(inputList);
        // If OR is not Found or the Last qual use split index as 1
        index = index <= 0 || index === inputList.length ? 1 : index;

        // split left list
        let leftList: GroupQualification[] = inputList.slice(0, index);
        let left: cls.RestQualification | null = this.buildQualification(leftList);
        // split right list
        let rightList: GroupQualification[] = inputList.slice(index, inputList.length);
        let right: cls.RestQualification | null = this.buildQualification(rightList);
        // Left operator
        let lastLeftElement = leftList[leftList.length - 1];
        if (lastLeftElement.isSingle()) {
          let opt = lastLeftElement.qualification?.logicalOperator;
          return this.createBinaryQualification(left, right, opt);
        } else {
          if (lastLeftElement.groupQualification) {
            let lastGroupElement = lastLeftElement.groupQualification[lastLeftElement.groupQualification.length - 1];
            let opt = this.getLastElementOperator(lastGroupElement);
            return this.createBinaryQualification(left, right, opt);
          } else {
            // Will never reach here.
            return null;
          }
        }
    } // end switch
  }

  getLastElementOperator(lastGroupElement: GroupQualification): string {
    if (lastGroupElement.isSingle()) {
      if (lastGroupElement.qualification) {
        return lastGroupElement.qualification?.logicalOperator;
      }
    } else {
      if (lastGroupElement.groupQualification) {
        return this.getLastElementOperator(
          lastGroupElement.groupQualification[lastGroupElement.groupQualification.length - 1]
        );
      }
    }
    return EMPTY;
  }

  getORIndex(inputList: GroupQualification[]): number {
    let orIndex = _.findIndex(inputList, function (qual, index) {
      if (qual.isSingle()) {
        return qual.qualification?.logicalOperator === OPERATOR_OR;
      } else if (qual.groupQualification) {
        let lastGroupElement = qual.groupQualification[qual.groupQualification.length - 1];
        if (lastGroupElement.isSingle()) {
          return lastGroupElement.qualification?.logicalOperator === OPERATOR_OR;
        } else if (lastGroupElement.groupQualification) {
          let operator =
            lastGroupElement.groupQualification[lastGroupElement.groupQualification?.length - 1].qualification
              ?.logicalOperator;
          return operator === OPERATOR_OR;
        } else {
          return false;
        }
      }
      return false;
    });
    return orIndex + 1;
  }

  createBlankQualification(): cls.RestQualification | null {
    let leftOperand: any = new cls.RestValueOperand(VALUE, EMPTY, CHAR, '1');
    let rightOperand: any = new cls.RestValueOperand(VALUE, EMPTY, CHAR, '1');
    let qualification = new cls.RestRelationalQualification(
      RELATIONAL,
      queryDef.DBOperator.Equal.text,
      leftOperand,
      rightOperand
    );
    return qualification;
  }

  createRelationalQualification(input: Qualification | null): cls.RestQualification | null {
    if (input && input.leftOperand && input.rightOperand && input.relationalOperator) {
      let rightOperand: any = new cls.RestValueOperand(
        input.rightOperand.fieldType,
        EMPTY,
        input.rightOperand.fieldDataType,
        input.rightOperand.fieldValue
      );
      if (
        input.relationalOperator === queryDef.DBOperator.Is.value ||
        input.relationalOperator === queryDef.DBOperator.IsNot.value
      ) {
        rightOperand = new cls.RestValueOperand(input.rightOperand.fieldType, EMPTY, NULL, null);
      }
      // If relationalOperator is IN, NOTIN recalculate right Operand
      if (
        input.relationalOperator === queryDef.DBOperator.In.value ||
        input.relationalOperator === queryDef.DBOperator.NotIn.value
      ) {
        let fieldValueList: string[];
        if (input.rightOperand.fieldValue.indexOf(COMMA) > 0) {
          fieldValueList = input.rightOperand.fieldValue.split(COMMA);
        } else {
          fieldValueList = [input.rightOperand.fieldValue];
        }
        let fieldOutputList: cls.RestValueOperand[] = [];
        _.each(fieldValueList, (value) => {
          fieldOutputList.push(new cls.RestValueOperand(VALUE, EMPTY, CHAR, value));
        });
        // Override rightOperand
        rightOperand = new cls.RestValueListOperand(VALUELIST, EMPTY, fieldOutputList);
      }
      switch (input.leftOperand.fieldType) {
        case queryDef.DBFunctions.Field.text:
          let leftOperand: cls.RestFieldOperand = new cls.RestFieldOperand(
            input.leftOperand.fieldType,
            EMPTY,
            this.splitAndGetColumnName(input.leftOperand.fieldName),
            input.leftOperand.fieldSourceAlias
          );

          let qualification = new cls.RestRelationalQualification(
            RELATIONAL,
            queryDef.getDBOperator(input.relationalOperator).function,
            leftOperand,
            rightOperand
          );
          return qualification;

        case queryDef.DBFunctions.Average.text:
        case queryDef.DBFunctions.Count.text:
        case queryDef.DBFunctions.Maximum.text:
        case queryDef.DBFunctions.Minimum.text:
        case queryDef.DBFunctions.Sum.text:
        case queryDef.DBFunctions.Date.text:
        case queryDef.DBFunctions.Time.text:
        case queryDef.DBFunctions.Month.text:
        case queryDef.DBFunctions.Day.text:
        case queryDef.DBFunctions.Year.text:
        case queryDef.DBFunctions.Weekday.text:
        case queryDef.DBFunctions.Hour.text:
        case queryDef.DBFunctions.Minute.text:
        case queryDef.DBFunctions.Second.text:
        case queryDef.DBFunctions.Quarter.text:
        case queryDef.DBFunctions.Upper.text:
        case queryDef.DBFunctions.Lower.text:
        case queryDef.DBFunctions.Ltrim.text:
        case queryDef.DBFunctions.Rtrim.text: {
          const funcField = new cls.RestFieldOperand(
            COLUMN_TYPE_FIELD,
            this.replaceSpaceWithUnderscore(input.leftOperand.fieldAlias || ''),
            this.splitAndGetColumnName(input.leftOperand.fieldName),
            input.leftOperand.fieldSourceAlias
          );
          let funcArg: cls.RestOperand[] = [funcField];
          const func = new cls.RestFunctionOperand(
            COLUMN_TYPE_FUNCTION,
            this.replaceSpaceWithUnderscore(input.leftOperand.fieldAlias || ''),
            queryDef.getDBFunctions(input.leftOperand.fieldType).function,
            funcArg
          );
          let qualification = new cls.RestRelationalQualification(
            RELATIONAL,
            queryDef.getDBOperator(input.relationalOperator).function,
            func,
            rightOperand
          );
          return qualification;
        }
      }
    }
    return null;
  }

  createBinaryQualification(
    left: cls.RestQualification | null,
    right: cls.RestQualification | null,
    operator: string | undefined
  ): cls.RestQualification | null {
    if (left && right) {
      let qualification = new cls.RestBinaryLogicalQualification(
        BINARYLOGICAL,
        operator ? operator : OPERATOR_AND,
        left,
        right
      );
      return qualification;
    }
    return null;
  }

  buildSortField(inputList: SortField[]) {
    let outputList: cls.RestSortInfo[] = [];
    let caller = this;
    _.each(inputList, (input) => {
      let inputList: SelectionList[] = [
        new SelectionList(
          input.sortOperand.selectionType,
          input.sortOperand.selectionColumnName,
          input.sortOperand.selectionSrcAlias,
          this.replaceSpaceWithUnderscore(input.sortOperand.selectionAlias)
        ),
      ];
      let output: cls.RestOperand = caller.buildSelectionList(inputList)[0];
      let sortInfo: cls.RestSortInfo = new cls.RestSortInfo(output, input.sortOrder);
      outputList.push(sortInfo);
    });
    return outputList;
  }

  splitAndGetColumnName(input: string) {
    let isArrowIndex = input.lastIndexOf(ARROW);
    return isArrowIndex <= 0 ? input : input.substring(isArrowIndex + ARROW.length, input.length);
  }

  replaceSpaceWithUnderscore(input: string) {
    return input.replace(/\s/g, UNDERSCORE);
  }

  //  GENERATE SQL

  buildFullSql(inputForm: RemedyForm): string {
    let sql = EMPTY;
    sql += this.buildColumnSql(inputForm.selectionList, inputForm.useDistinct, inputForm.calculatedFieldList);
    if (inputForm.calculatedFieldList !== undefined) {
      sql += this.buildCalculatedFieldSql(inputForm.calculatedFieldList);
    }
    sql += this.buildFormSql(inputForm.sourceList);
    if (!inputForm.hideQual) {
      sql += this.buildWhereSql(inputForm.qualification);
    } else if (inputForm.useOneEqualOne) {
      sql += SQL_WHERE + SPACE + SQL_ONE_EQUAL_ONE + NEWLINE;
    }
    if (!inputForm.hideGroupBy) {
      sql += this.buildGroupBySql(inputForm.groupByField);
    }
    if (!inputForm.hideHaving) {
      sql += this.buildHavingSql(inputForm.havingQualification);
    }
    if (!inputForm.hideSort) {
      sql += this.buildOrderBySql(inputForm.sortField);
    }
    // Don't pass anything for DST_SERVER
    if (inputForm.dstType !== undefined && inputForm.dstType !== SQL_DST_SERVER) {
      sql += NEWLINE + inputForm.dstType + SPACE;
    }
    sql += NEWLINE + SQL_LIMIT + SPACE + inputForm.maxEntries;
    return sql;
  }

  buildColumnSql(
    inputList: SelectionList[],
    use_distinct: boolean,
    calculatedFieldList: CalculatedFieldList[]
  ): string {
    let sql = EMPTY;
    sql += SQL_SELECT;
    if (use_distinct) {
      sql += SPACE + SQL_DISTINCT;
    }
    sql += NEWLINE;
    let caller = this;
    _.each(inputList, function (column, index) {
      let input = column.selectionColumnName;
      if (input && input.length > 0) {
        let isAgg = column.selectionType === COLUMN_TYPE_FIELD ? false : true;
        let selectionType = queryDef.getDBFunctions(column.selectionType).sql;
        sql += isAgg ? selectionType + OPENING_BRACKET : EMPTY;
        // Add only column name
        sql += BACK_QUOTE + input.replace(ARROW, BACK_QUOTE + DOT + BACK_QUOTE) + BACK_QUOTE;
        sql += isAgg ? CLOSING_BRACKET : EMPTY;
        sql += SPACE;
      }
      sql += SQL_AS + SPACE + caller.replaceSpaceWithUnderscore(column.selectionAlias);
      if (index !== inputList.length - 1) {
        sql += COMMA;
      } else if (calculatedFieldList !== undefined) {
        let addComma = false;
        calculatedFieldList.forEach((item: any) => {
          if (!item.hideCalculatedField) {
            addComma = true;
          }
        });
        if (addComma) {
          sql += COMMA;
        }
      }
      sql += caller.isNewLine(sql);
    });
    return sql;
  }

  buildCalculatedFieldSql(calculatedFieldList: CalculatedFieldList[]): string {
    let sql = EMPTY;
    let caller = this;
    _.each(calculatedFieldList, function (column, index) {
      if (!column.hideCalculatedField && column.selectionCalculatedFields !== CALCULATED_FIELD) {
        let input = column.selectionQuery;
        if (input && input.length > 0) {
          let updatedQuery = input.replace(/"/g, BACK_QUOTE);
          sql += updatedQuery;
        }
        sql += SPACE + SQL_AS + SPACE + caller.replaceSpaceWithUnderscore(column.selectionAlias);
        if (index !== calculatedFieldList.length - 1) {
          let addComma = false;
          for (let i = index + 1; i < calculatedFieldList.length; i++) {
            if (!calculatedFieldList[i].hideCalculatedField) {
              addComma = true;
            }
          }
          if (addComma) {
            sql += COMMA;
          }
        }
        sql += caller.isNewLine(sql);
      }
    });
    return sql;
  }

  buildFormSql(inputList: SourceList[]): string {
    let sql = EMPTY;
    sql += SQL_FROM + NEWLINE;
    let caller = this;
    _.each(inputList, function (form, index) {
      if (form.sourceHideClause) {
        sql += queryDef.getDBFormJoinType(form.sourceType).sql + SPACE + OPENING_BRACKET;
        sql += BACK_QUOTE + form.sourceFormName + BACK_QUOTE + SPACE;
        // Support: Form Alias
        // sql += SQL_AS + SPACE + form.sourceAlias;
        sql += CLOSING_BRACKET;

        sql += NEWLINE + SQL_ON + SPACE + OPENING_BRACKET;
        let input = form.sourceJoinClause[0].leftOperand?.fieldName;
        if (input && input.length > 0 && input.indexOf(ARROW)) {
          sql += BACK_QUOTE + input.replace(ARROW, BACK_QUOTE + DOT + BACK_QUOTE) + BACK_QUOTE + SPACE;
        }
        sql += queryDef.getDBOperator(form.sourceJoinClause[0].relationalOperator).sql + SPACE;

        input = form.sourceJoinClause[0].rightOperand?.fieldName;
        if (input && input.length > 0 && input.indexOf(ARROW)) {
          sql += BACK_QUOTE + input.replace(ARROW, BACK_QUOTE + DOT + BACK_QUOTE) + BACK_QUOTE;
        }
        sql += CLOSING_BRACKET;
      } else {
        sql += BACK_QUOTE + form.sourceFormName + BACK_QUOTE + SPACE;
        // Support: Form Alias
        // sql += SQL_AS + SPACE + form.sourceAlias;

        let nextFormElement = inputList[index + 1];
        let nextFormType = nextFormElement ? nextFormElement.sourceType : KEYWORD_FORM;
        // Add comma only if next element is a Form and not the last element
        if (index !== inputList.length - 1 && nextFormType === KEYWORD_FORM) {
          sql += COMMA;
        }
      }
      sql += caller.isNewLine(sql);
    });
    return sql;
  }

  buildWhereSql(inputList: Qualification[]) {
    let sql = EMPTY;
    sql += SQL_WHERE + SPACE;
    sql += NEWLINE + OPENING_BRACKET + NEWLINE;
    let groupList: GroupQualification[] = this.buildGroupQualification(inputList);
    sql += this.buildQualSqlRecursively(groupList);

    // Raw way to get ride of last logical Operator
    sql = this.removeLastLogicalOperator(sql);
    sql += NEWLINE + CLOSING_BRACKET + NEWLINE;
    return sql;
  }

  buildQualSqlRecursively(inputList: GroupQualification[]): string {
    let sql = EMPTY;
    let caller = this;
    _.each(inputList, function (qual, index) {
      if (qual.isSingle()) {
        if (qual.qualification) {
          sql += caller.buildQualSql(qual.qualification);
          sql += SPACE;
          sql += caller.isNewLine(sql);
          if (index !== inputList.length - 1) {
            sql += qual.qualification?.logicalOperator + SPACE;
          }
        }
      } else {
        if (qual.groupQualification) {
          sql += OPENING_BRACKET;
          sql += caller.buildQualSqlRecursively(qual.groupQualification);
          sql += CLOSING_BRACKET;
          // Raw way of correcting generated sql ) AND )
          let endsWithLiteral = CLOSING_BRACKET + SPACE + OPERATOR_AND + SPACE;
          if (sql.endsWith(endsWithLiteral + CLOSING_BRACKET)) {
            sql = sql.substring(0, sql.lastIndexOf(endsWithLiteral + CLOSING_BRACKET) + 1) + endsWithLiteral;
          }
          let logicalOperator =
            qual.groupQualification[qual.groupQualification.length - 1].qualification?.logicalOperator;
          if (logicalOperator) {
            sql += SPACE + logicalOperator + SPACE;
          }
        }
      }
    });

    return sql;
  }

  buildQualSql(qual: Qualification) {
    let sql = EMPTY;
    switch (qual.qualificationType) {
      case RELATIONAL: {
        let fieldType = qual.leftOperand?.fieldType || COLUMN_TYPE_FIELD;
        let isAgg = fieldType === COLUMN_TYPE_FIELD ? false : true;
        let selectionType = queryDef.getDBFunctions(fieldType).sql;
        sql += isAgg ? selectionType + OPENING_BRACKET : EMPTY;
        let input = qual.leftOperand?.fieldName;
        if (input && input.length > 0) {
          // Replace twice if two arrow exists
          let firstIndex = input.indexOf(ARROW);
          let lastIndex = input.lastIndexOf(ARROW);
          if (firstIndex !== lastIndex) {
            input = input.substring(input.indexOf(ARROW) + ARROW.length, input.length);
          }
          sql += BACK_QUOTE + input.replace(ARROW, BACK_QUOTE + DOT + BACK_QUOTE) + BACK_QUOTE;
        }
        sql += isAgg ? CLOSING_BRACKET + SPACE : SPACE;

        let relationalOperator = queryDef.getDBOperator(qual.relationalOperator).sql;
        sql += relationalOperator + SPACE;
        if (
          qual.rightOperand &&
          (qual.relationalOperator === queryDef.DBOperator.Is.value ||
            qual.relationalOperator === queryDef.DBOperator.IsNot.value)
        ) {
          // Force change value to NULL
          qual.rightOperand.fieldValue = NULL;
        }
        if (
          qual.rightOperand?.fieldValue.startsWith(SINGLE_QUOTE) ||
          qual.rightOperand?.fieldValue.startsWith(DOUBLE_QUOTE) ||
          qual.relationalOperator === queryDef.DBOperator.Is.value ||
          qual.relationalOperator === queryDef.DBOperator.IsNot.value
        ) {
          sql += qual.rightOperand?.fieldValue;
        } else {
          let fieldValue = qual.rightOperand?.fieldValue || EMPTY;
          if (
            relationalOperator === queryDef.DBOperator.In.text ||
            relationalOperator === queryDef.DBOperator.NotIn.text
          ) {
            if (fieldValue.indexOf(COMMA) > 0) {
              let fieldValueList = fieldValue.split(COMMA);
              let finalFieldValue: string[] = [];
              fieldValueList.forEach((fieldValue: any) => {
                // Variables gets replaced with Quote
                if (fieldValue.trim().startsWith(DOLLAR_SYMBOL)) {
                  finalFieldValue.push(fieldValue);
                } else {
                  finalFieldValue.push(SINGLE_QUOTE + fieldValue + SINGLE_QUOTE);
                }
              });
              fieldValue = finalFieldValue.join(COMMA);
              sql += OPENING_BRACKET + fieldValue + CLOSING_BRACKET;
            } else {
              // Variables gets replaced with Quote
              if (fieldValue.trim().startsWith(DOLLAR_SYMBOL)) {
                sql += OPENING_BRACKET + fieldValue + CLOSING_BRACKET;
              } else {
                sql += OPENING_BRACKET + SINGLE_QUOTE + fieldValue + SINGLE_QUOTE + CLOSING_BRACKET;
              }
            }
          } else {
            // Integer doesn't need quotes
            if (queryDef.getDBFunctions(fieldType).argType === INTEGER) {
              sql += fieldValue;
            } else {
              // Variables gets replaced with Quote
              if (fieldValue.trim().startsWith(DOLLAR_SYMBOL)) {
                sql += fieldValue;
              } else {
                sql += SINGLE_QUOTE + fieldValue + SINGLE_QUOTE;
              }
            }
          }
        }
      }
    }
    return sql;
  }

  buildGroupBySql(inputList: SelectionList[]): string {
    let sql = EMPTY;
    sql += SQL_GROUPBY + NEWLINE;
    let caller = this;
    _.each(inputList, function (column, index) {
      let input = column.selectionColumnName;
      if (input && input.length > 0) {
        let isAgg = column.selectionType === COLUMN_TYPE_FIELD ? false : true;
        let selectionType = queryDef.getDBFunctions(column.selectionType).sql;
        sql += isAgg ? selectionType + OPENING_BRACKET : EMPTY;
        input = input.substring(input.indexOf(ARROW) + ARROW.length, input.length);
        sql += BACK_QUOTE + input.replace(ARROW, BACK_QUOTE + DOT + BACK_QUOTE) + BACK_QUOTE;
        sql += isAgg ? CLOSING_BRACKET : EMPTY;
      }
      if (index !== inputList.length - 1) {
        sql += COMMA;
      }
      sql += caller.isNewLine(sql);
    });
    return sql;
  }

  buildHavingSql(inputList: Qualification[]) {
    let sql = EMPTY;
    sql += SQL_HAVING + SPACE;
    sql += NEWLINE + OPENING_BRACKET + NEWLINE;
    let having: GroupQualification[] = this.buildGroupQualification(inputList);
    sql += this.buildQualSqlRecursively(having);

    // Raw way to get ride of last logical Operator
    sql = this.removeLastLogicalOperator(sql);
    sql += NEWLINE + CLOSING_BRACKET + NEWLINE;
    return sql;
  }

  buildOrderBySql(inputList: SortField[]): string {
    let sql = EMPTY;
    sql += SQL_ORDERBY + NEWLINE;
    let caller = this;
    _.each(inputList, function (column, index) {
      let input = column.sortOperand.selectionColumnName;
      if (input && input.length > 0 && input.indexOf(ARROW)) {
        let isAgg = column.sortOperand.selectionType === COLUMN_TYPE_FIELD ? false : true;
        let selectionType = queryDef.getDBFunctions(column.sortOperand.selectionType).sql;
        sql += isAgg ? selectionType + OPENING_BRACKET : EMPTY;
        // if orderby is derived from groupby list
        if (input.indexOf(ARROW) !== input.lastIndexOf(ARROW)) {
          input = input.substring(input.indexOf(ARROW) + ARROW.length, input.length);
        }
        sql += BACK_QUOTE + input.replace(ARROW, BACK_QUOTE + DOT + BACK_QUOTE) + BACK_QUOTE;
        sql += isAgg ? CLOSING_BRACKET : EMPTY;
      }
      sql += SPACE + column.sortOrder;
      if (index !== inputList.length - 1) {
        sql += COMMA;
      }
      sql += caller.isNewLine(sql);
    });
    return sql + SPACE;
  }

  buildGroupQualification(input: Qualification[]): GroupQualification[] {
    let output: GroupQualification[] = [];
    let caller = this;
    // Input
    //1) G1
    //2) G1.G2
    //3) G1.G2.G3
    //4) G1.G2.G3
    //5) G1.G2.G4

    // Output
    //1) G1
    //2) G2 -> (3rd & 4th)
    //3) G1.G2.G4
    _.each(input, function (qual, index) {
      let condition = caller.compareGHCondition(qual, input[index - 1], input[index + 1]);
      switch (condition) {
        case SAME: {
          let prevGroup = output[output.length - 1];
          if (!prevGroup.isSingle()) {
            if (
              prevGroup.groupQualification &&
              !prevGroup.groupQualification[prevGroup.groupQualification?.length - 1].isSingle()
            ) {
              let lastGroupElement =
                prevGroup.groupQualification[prevGroup.groupQualification?.length - 1].groupQualification;
              if (lastGroupElement) {
                lastGroupElement.push(new GroupQualification(SINGLE_IDENTIFIER, qual, null));
              }
            } else {
              prevGroup.groupQualification?.push(new GroupQualification(SINGLE_IDENTIFIER, qual, null));
            }
          } else {
            output.push(new GroupQualification(SINGLE_IDENTIFIER, qual, null));
          }
          break;
        }
        case IN: {
          output.push(new GroupQualification(SINGLE_IDENTIFIER, qual, null));
          break;
        }
        case OUT: {
          let prevGroup = output[output.length - 1];
          if (!prevGroup.isSingle()) {
            if (
              prevGroup.groupQualification &&
              !prevGroup.groupQualification[prevGroup.groupQualification?.length - 1].isSingle()
            ) {
              let newGroup = new GroupQualification(GROUP_IDENTIFIER, null, [
                new GroupQualification(SINGLE_IDENTIFIER, qual, null),
              ]);
              prevGroup.groupQualification?.push(newGroup);
            } else {
              let newGroup = new GroupQualification(GROUP_IDENTIFIER, null, [
                new GroupQualification(SINGLE_IDENTIFIER, qual, null),
              ]);
              output.push(newGroup);
            }
          } else {
            let newGroup = new GroupQualification(GROUP_IDENTIFIER, null, [
              new GroupQualification(SINGLE_IDENTIFIER, qual, null),
            ]);
            output.push(newGroup);
          }
          break;
        }
        case SPLIT: {
          let newGroup = new GroupQualification(GROUP_IDENTIFIER, null, [
            new GroupQualification(SINGLE_IDENTIFIER, qual, null),
          ]);
          output.push(newGroup);
          break;
        }
        case 0: {
          output.push(new GroupQualification(SINGLE_IDENTIFIER, qual, null));
          break;
        }
        case 1:
        case 2:
        case 3:
        case 4:
        case 5: {
          let newGroup = new GroupQualification(GROUP_IDENTIFIER, null, [
            new GroupQualification(SINGLE_IDENTIFIER, qual, null),
          ]);
          output.push(newGroup);
          break;
        }
      }
    });

    return output;
  }

  compareGHCondition(current: Qualification, prev: Qualification | null, next: Qualification | null): number {
    let condition = SAME;

    if (prev) {
      if (current.groupHierarchy.length === prev?.groupHierarchy.length) {
        // prev    = G1.G2
        // current = G1.G2
        condition = SAME;
        if (current.groupHierarchy !== prev?.groupHierarchy) {
          // prev    = G1.G2
          // current = G1.G3
          condition = SPLIT;
        }
      }
      if (current.groupHierarchy.length > prev?.groupHierarchy.length) {
        // prev    = G1.G2
        // current = G1.G2.G3
        condition = OUT;
      }
      if (current.groupHierarchy.length < prev?.groupHierarchy.length) {
        // prev    = G1.G2.G3
        // current = G1
        condition = IN;
      }
    } else {
      //  FirstElement = G1.G2.G3.G4
      condition = current.groupHierarchy.split(DOT).length - 1;
    }
    return condition;
  }

  isNewLine(sql: string): string {
    return NEWLINE;
    // return sql.substring(sql.lastIndexOf(NEWLINE), sql.length).length > 60 ? NEWLINE : EMPTY;
  }

  removeLastLogicalOperator(sql: string) {
    // Raw way to get ride of last logical Operator
    let endsWithLiteral = OPERATOR_AND + SPACE;
    if (sql.endsWith(endsWithLiteral)) {
      sql = sql.substring(0, sql.lastIndexOf(endsWithLiteral) - 1);
    }
    endsWithLiteral = OPERATOR_OR + SPACE;
    if (sql.endsWith(endsWithLiteral)) {
      sql = sql.substring(0, sql.lastIndexOf(endsWithLiteral) - 1);
    }
    return sql;
  }
}
