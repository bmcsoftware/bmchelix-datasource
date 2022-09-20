import { SourceList, SelectionList, CalculatedFieldList } from './RemedyTypes';
import * as queryDef from './remedy_query_def';
import { each as _each, find as _find } from 'lodash';
import { ARROW, CALCULATED_FIELD, UNDERSCORE } from './remedy_literal_string';

export const replaceSpaceWithUnderscore = (input: string) => {
  return input.replace(/\s/g, UNDERSCORE);
};

export const getMetaOrderNames = ({
  inputSourceList,
  inputGroupList,
  inputCalculatedFieldList,
}: {
  inputSourceList: SourceList[];
  inputGroupList: SelectionList[];
  inputCalculatedFieldList: CalculatedFieldList[];
}) => {
  const metaOrderNames: any[] = [];
  _each(inputGroupList, (column) => {
    if (!queryDef.isDBFunctionsAggregate(column.selectionType)) {
      let form: SourceList = inputSourceList[0];
      _find(inputSourceList, function (f) {
        if (column.selectionColumnName.includes(f.sourceFormName)) {
          form = f;
        }
      });
      metaOrderNames.push({
        text: column.selectionColumnName,
        label: column.selectionColumnName,
        value: {
          formName: form.sourceFormName,
          formAlias: form.sourceAlias,
          columnName: column.selectionColumnName,
          selectionType: column.selectionType,
        },
      });
    }
  });
  if (inputCalculatedFieldList !== undefined) {
    _each(inputCalculatedFieldList, (field) => {
      if (field.selectionCalculatedFields !== CALCULATED_FIELD) {
        let form: SourceList = inputSourceList[0];
        _find(inputSourceList, function (f) {
          if (field.selectionAlias.includes(f.sourceFormName)) {
            form = f;
          }
        });
        let tempColumnName = replaceSpaceWithUnderscore(field.selectionAlias);
        metaOrderNames.push({
          text: field.selectionAlias,
          label: field.selectionAlias,
          value: {
            formName: form.sourceFormName,
            formAlias: form.sourceAlias,
            columnName: tempColumnName,
            isCalculatedField: true,
          },
        });
      }
    });
  }
  return metaOrderNames;
};

export const getMetaHavingNames = ({
  inputSelectionList,
  inputSourceList,
  inputCalculatedFieldList,
}: {
  inputSelectionList: SelectionList[];
  inputSourceList: SourceList[];
  inputCalculatedFieldList: CalculatedFieldList[];
}) => {
  const metaHavingNames: any[] = [];
  _each(inputSelectionList, (column) => {
    if (queryDef.isDBFunctionsAggregate(column.selectionType)) {
      let form: SourceList = inputSourceList[0];
      _find(inputSourceList, function (f) {
        if (column.selectionColumnName.includes(f.sourceFormName)) {
          form = f;
        }
      });
      let tempColumnName = column.selectionColumnName.substring(
        column.selectionColumnName.indexOf(ARROW) + ARROW.length,
        column.selectionColumnName.length
      );

      metaHavingNames.push({
        text: column.selectionColumnName,
        label: column.selectionColumnName,
        value: {
          formName: form.sourceFormName,
          formAlias: form.sourceAlias,
          columnName: tempColumnName,
        },
      });
    }
  });
  if (inputCalculatedFieldList !== undefined) {
    _each(inputCalculatedFieldList, (field) => {
      if (field.selectionCalculatedFields !== CALCULATED_FIELD && field.selectionAggregation) {
        let form: SourceList = inputSourceList[0];
        _find(inputSourceList, function (f) {
          if (field.selectionAlias.includes(f.sourceFormName)) {
            form = f;
          }
        });
        let tempColumnName = replaceSpaceWithUnderscore(field.selectionAlias);
        metaHavingNames.push({
          text: field.selectionAlias,
          label: field.selectionAlias,
          value: {
            formName: form.sourceFormName,
            formAlias: form.sourceAlias,
            columnName: tempColumnName,
            isCalculatedField: true,
          },
        });
      }
    });
  }
  return metaHavingNames;
};

export const getMetaGroupNames = ({
  inputSelectionList,
  inputSourceList,
}: {
  inputSelectionList: SelectionList[];
  inputSourceList: SourceList[];
}) => {
  const metaGroupNames: any[] = [];
  _each(inputSelectionList, (column) => {
    if (!queryDef.isDBFunctionsAggregate(column.selectionType)) {
      let form: SourceList = inputSourceList[0];
      _find(inputSourceList, function (f) {
        if (column.selectionColumnName.includes(f.sourceFormName)) {
          form = f;
        }
      });
      metaGroupNames.push({
        text: column.selectionType + ARROW + column.selectionColumnName,
        label: column.selectionType + ARROW + column.selectionColumnName,
        value: {
          formName: form.sourceFormName,
          formAlias: form.sourceAlias,
          columnName: column.selectionType + ARROW + column.selectionColumnName,
          selectionType: column.selectionType,
        },
      });
    }
  });
  return metaGroupNames;
};

export const getMetaColumnNames = ({
  columnList,
  inputSourceList,
}: {
  columnList: any[];
  inputSourceList: SourceList[];
}) => {
  const modifiedColumList: any[] = [];
  _each(columnList, (column, index) => {
    const columnList = queryDef.getColumnNames(column);
    _each(columnList, (column) => {
      modifiedColumList.push({
        label: inputSourceList[index].sourceFormName + ARROW + column.text,
        text: inputSourceList[index].sourceFormName + ARROW + column.text,
        value: {
          formName: inputSourceList[index].sourceFormName,
          formAlias: inputSourceList[index].sourceAlias,
          columnName: column.text,
        },
      });
    });
  });
  return modifiedColumList;
};

export const getDistinctFormNames = (sourceList: SourceList[]) => {
  const distinctSourceList = new Set();
  _each(sourceList, (form: SourceList) => {
    distinctSourceList.add(form.sourceFormName);
  });
  return [...distinctSourceList];
};

export const getMetaWhereNames = ({
  columnNames,
  inputSourceList,
  inputCalculatedFieldList,
}: {
  columnNames: any[];
  inputSourceList: SourceList[];
  inputCalculatedFieldList: CalculatedFieldList[];
}) => {
  let metaWhereNames = [...columnNames];
  if (inputCalculatedFieldList !== undefined) {
    _each(inputCalculatedFieldList, (field) => {
      if (field.selectionCalculatedFields !== CALCULATED_FIELD && !field.selectionAggregation) {
        let form: SourceList = inputSourceList[0];
        _find(inputSourceList, function (f) {
          if (field.selectionAlias.includes(f.sourceFormName)) {
            form = f;
          }
        });
        let tempColumnName = replaceSpaceWithUnderscore(field.selectionAlias);
        metaWhereNames.push({
          text: field.selectionAlias,
          label: field.selectionAlias,
          value: {
            formName: form.sourceFormName,
            formAlias: form.sourceAlias,
            columnName: tempColumnName,
            isCalculatedField: true,
          },
        });
      }
    });
  }
  return metaWhereNames;
};
