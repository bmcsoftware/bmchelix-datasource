import React, { PureComponent, useEffect, useMemo, useState } from 'react';
import { each as _each } from 'lodash';
import { Seg } from '../../common/Seg';
import {
  AutoCompleteContext,
  UPDATE_InputAutoComplete,
  useAutoCompleteContext,
} from '../../common/AutoCompleteContext';
import { getColumnTypes, getColumnAliases } from '../utilities/remedy_query_def';
import {
  EMPTY,
  COLUMN_TYPE_FIELD,
  COLUMN_TYPE_SELECT_COLUMN_NAME,
  COLUMN_TYPE_SELECT_FORM_NAME,
  COLUMN_IDENTIFIER_PREFIX,
  KEYWORD_COLUMN,
  ARROW,
} from '../utilities/remedy_literal_string';
import { SourceList, SelectionList } from '../utilities/RemedyTypes';
import { getMetaColumnNames, getMetaGroupNames } from '../utilities/utility';
import { SOURCE_TYPE_REMEDY } from '../../../Constants';
import { InlineFieldRow, InlineLabel } from '@grafana/ui';
import { InlineFieldWrapper } from 'modules/common/InlineFieldWrapper';
import { InlineIconButton } from 'modules/common/InlineIconButton';

const columnTypeOptions: any[] = getColumnTypes();

export class RemedyColumnQuery extends PureComponent<any, any> {
  static queryHandlerInstance: any;
  static contextType = AutoCompleteContext;
  constructor(props: any) {
    super(props);
    RemedyColumnQuery.queryHandlerInstance = this.props.datasource.getQueryHandlerInstance(SOURCE_TYPE_REMEDY);
  }

  componentDidMount() {
    this.updateContextColumnList();
  }

  metricQuery = (query: any) => {
    query = JSON.parse(query);
    return RemedyColumnQuery.queryHandlerInstance.metricFindData(query);
  };

  updateSelectionList = (selectionList: any, index: number, runQuery: boolean) => {
    const selectionListClone: any[] = [...this.props.target.form.selectionList];
    selectionListClone[index] = selectionList;
    this.props.onChange(
      {
        ...this.props.target.form,
        selectionList: selectionListClone,
      },
      runQuery
    );
  };

  addSelectionList = () => {
    const newLength = this.props.target.form.selectionList.length + 1;
    const defaultSelectionList: SelectionList = new SelectionList(
      COLUMN_TYPE_FIELD,
      COLUMN_TYPE_SELECT_COLUMN_NAME,
      EMPTY,
      COLUMN_IDENTIFIER_PREFIX + newLength
    );
    this.props.onChange(
      {
        ...this.props.target.form,
        selectionList: [...this.props.target.form.selectionList, defaultSelectionList],
      },
      true
    );
  };

  removeSelectionList = (index: number) => {
    const selectionListClone = [...this.props.target.form.selectionList];
    selectionListClone.splice(index, 1);
    this.props.onChange(
      {
        ...this.props.target.form,
        selectionList: selectionListClone,
      },
      true
    );
  };

  updateContextColumnList = () => {
    const results: any[] = [];
    this.props.target.form.sourceList?.forEach((sourceList: SourceList) => {
      if (sourceList.sourceFormName && sourceList.sourceFormName !== COLUMN_TYPE_SELECT_FORM_NAME) {
        const jsonStr = JSON.stringify({ find: KEYWORD_COLUMN, name: sourceList.sourceFormName });
        results.push(this.metricQuery(jsonStr));
      }
    });
    Promise.all(results).then((columnList) => {
      const modifiedColumList: any[] = getMetaColumnNames({
        columnList: columnList,
        inputSourceList: this.props.target.form.sourceList,
      });
      this.context.dispatch({
        type: UPDATE_InputAutoComplete,
        guid: this.props.target.guid,
        value: { metaColumnNames: modifiedColumList },
      });
    });
  };

  updateGroupNamesContext = () => {
    const inputSelectionList = this.props.target.form.selectionList;
    const inputSourceList = this.props.target.form.sourceList;
    const metaGroupNames = getMetaGroupNames({ inputSelectionList, inputSourceList });
    this.context.dispatch({
      type: UPDATE_InputAutoComplete,
      guid: this.props.target.guid,
      value: { metaGroupNames },
    });
  };

  render() {
    return (
      <>
        {this.props.target.form.selectionList.map((selectionList: any, index: number) => {
          return (
            <RenderSelectionList
              selectionList={selectionList}
              guid={this.props.target.guid}
              onSelectionListChange={this.updateSelectionList}
              key={`selectionList${index}`}
              keyIndex={index}
              selectionListLength={this.props.target.form.selectionList.length}
              addSelectionList={this.addSelectionList}
              removeSelectionList={this.removeSelectionList}
              updateGroupNamesContext={this.updateGroupNamesContext}
            />
          );
        })}
      </>
    );
  }
}

const RenderSelectionList: React.FC<any> = ({
  selectionList,
  guid,
  onSelectionListChange,
  keyIndex,
  selectionListLength,
  addSelectionList,
  removeSelectionList,
  updateGroupNamesContext,
}) => {
  const isFirst = keyIndex === 0;
  const autoCompleteContext: any = useAutoCompleteContext();
  const [selectionAlias, setSelectionAlias] = useState(getColumnAliases());

  const refreshSelectionAlias = () => {
    const selectionAliasClone = getColumnAliases();
    selectionAliasClone.unshift({
      text: COLUMN_IDENTIFIER_PREFIX + (keyIndex + 1),
      label: COLUMN_IDENTIFIER_PREFIX + (keyIndex + 1),
      value: COLUMN_IDENTIFIER_PREFIX + (keyIndex + 1),
    });
    // Add if existing Alias is not already present
    if (!selectionAliasClone.find((v: any) => v.text === selectionList.selectionAlias)) {
      selectionAliasClone.unshift({
        text: selectionList.selectionAlias,
        label: selectionList.selectionAlias,
        value: selectionList.selectionAlias,
      })
    }

    // Add column Name as alias if does not exist
    let selectedColumnName = selectionList.selectionColumnName;
    if (selectedColumnName.indexOf(ARROW) > -1) {
      selectedColumnName = selectedColumnName.substring(
        selectedColumnName.indexOf(ARROW) + ARROW.length,
        selectedColumnName.length
      );
    }
    if (!selectionAliasClone.find((v: any) => v.text === selectedColumnName)) {
      selectionAliasClone.unshift({
        text: selectedColumnName,
        label: selectedColumnName,
        value: selectedColumnName,
      })
    }
    setSelectionAlias(selectionAliasClone);
  };

  useEffect(() => {
    refreshSelectionAlias();
  }, []);

  useEffect(() => {
    refreshSelectionAlias();
  }, [selectionList.selectionColumnName]);

  const columnFullNameOptions = useMemo(() => {
    return autoCompleteContext.inputAutoComplete[guid].metaColumnNames;
  }, [autoCompleteContext.inputAutoComplete[guid]?.metaColumnNames]);

  return (
    <div>
      <InlineFieldRow>
        <InlineFieldWrapper label="Column" labelWidth={16} />
        <Seg
          onChange={(selectedVal: any) => {
            onSelectionListChange(
              {
                ...selectionList,
                selectionType: selectedVal.value,
              },
              keyIndex,
              true
            );
            updateGroupNamesContext();
          }}
          value={'+'}
          loadOptions={async () => {
            return columnTypeOptions;
          }}
        />
        <div className="gf-form">
          <label className="gf-form-label query-keyword">{selectionList.selectionType}</label>
        </div>
        <Seg
          onChange={(selectedVal: any) => {
            onSelectionListChange({ ...selectionList, selectionColumnName: selectedVal.text }, keyIndex, true);
            refreshSelectionAlias();
          }}
          value={selectionList.selectionColumnName}
          loadOptions={async () => {
            return columnFullNameOptions;
          }}
        />
        <div className="gf-form">
          <label className="gf-form-label query-keyword">Alias</label>
        </div>
        <Seg
          value={selectionList.selectionAlias}
          loadOptions={async () => {
            return selectionAlias;
          }}
          onChange={(selectedVal: any) => {
            onSelectionListChange(
              {
                ...selectionList,
                selectionAlias: selectedVal.value,
              },
              keyIndex,
              true
            );
          }}
        />
        <InlineLabel style={{ flexGrow: 1, width: 'auto' }}>{''}</InlineLabel>
        {selectionListLength > 1 ? (
          <InlineIconButton
            iconName="minus"
            onClick={() => {
              removeSelectionList(keyIndex);
            }}
          />
        ) : (
          ''
        )}
        {isFirst ? (
          <InlineIconButton
            iconName="plus"
            onClick={() => {
              addSelectionList();
            }}
          />
        ) : (
          ''
        )}
      </InlineFieldRow>
    </div>
  );
};
