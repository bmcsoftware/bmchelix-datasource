import React, { PureComponent, useCallback, useEffect, useMemo, useState } from 'react';
import { each as _each, cloneDeep } from 'lodash';
import { Seg } from '../../common/Seg';
import {
  AutoCompleteContext,
  UPDATE_InputAutoComplete,
  useAutoCompleteContext,
} from '../../common/AutoCompleteContext';
import { getFormTypes, getFormJoinRelationalOperator } from '../utilities/remedy_query_def';
import {
  EMPTY,
  OPERATOR_EQUAL,
  KEYWORD_FORM,
  COLUMN_TYPE_FIELD,
  COLUMN_TYPE_SELECT_COLUMN_NAME,
  RELATIONAL,
  CHAR,
  DEFAULT_GROUP,
  COLUMN_TYPE_SELECT_FORM_NAME,
  FORM_IDENTIFIER_PREFIX,
  KEYWORD_COLUMN,
} from '../utilities/remedy_literal_string';
import { SourceList, LeftOperand, RightOperand, Qualification } from '../utilities/RemedyTypes';
import { SOURCE_TYPE_REMEDY } from '../../../Constants';
import { getMetaColumnNames } from '../utilities/utility';
import { InlineField, InlineFieldRow, InlineLabel } from '@grafana/ui';
import { InlineFieldWrapper } from 'modules/common/InlineFieldWrapper';
import { InlineIconButton } from 'modules/common/InlineIconButton';

const formTypeOptions: any[] = getFormTypes();
const relationalOperatorOptions: any[] = getFormJoinRelationalOperator();

export class RemedyFormQuery extends PureComponent<any, any> {
  static queryHandlerInstance: any;
  static contextType = AutoCompleteContext;
  constructor(props: any) {
    super(props);
    RemedyFormQuery.queryHandlerInstance = this.props.datasource.getQueryHandlerInstance(SOURCE_TYPE_REMEDY);
  }

  componentDidMount() {
    const JsonStr = JSON.stringify({ find: KEYWORD_FORM });
    const { dispatch } = this.context;
    this.metricQuery(JsonStr).then((data: any) => {
      dispatch({ type: UPDATE_InputAutoComplete, guid: this.props.target.guid, value: { metaFullFormNames: data } });
    });
  }

  metricQuery = (query: any) => {
    query = JSON.parse(query);
    return RemedyFormQuery.queryHandlerInstance.metricFindData(query);
  };

  updateSourceList = (sourceList: any, index: number, runQuery: boolean) => {
    const sourceListClone: any[] = [...this.props.target.form.sourceList];
    sourceListClone[index] = sourceList;
    this.props.onChange(
      {
        ...this.props.target.form,
        sourceList: sourceListClone,
      },
      runQuery
    );
  };

  addSourceList = () => {
    const defaultSourceList: SourceList = new SourceList(
      KEYWORD_FORM,
      COLUMN_TYPE_SELECT_FORM_NAME,
      FORM_IDENTIFIER_PREFIX + (this.props.target.form.sourceList.length + 1),
      false,
      getDefaultJoinClause()
    );
    this.props.onChange(
      {
        ...this.props.target.form,
        sourceList: [...this.props.target.form.sourceList, defaultSourceList],
      },
      true
    );
  };

  removeSourceList = (index: number) => {
    const sourceListClone = [...this.props.target.form.sourceList];
    sourceListClone.splice(index, 1);
    this.props.onChange(
      {
        ...this.props.target.form,
        sourceList: sourceListClone,
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

  render() {
    return (
      <>
        {this.props.target.form.sourceList.map((sourceList: any, index: number) => {
          return (
            <RenderSourceList
              sourceList={sourceList}
              guid={this.props.target.guid}
              onSourceListChange={this.updateSourceList}
              key={`sourceList-${index}`}
              keyIndex={index}
              sourceListLength={this.props.target.form.sourceList.length}
              addSourceList={this.addSourceList}
              removeSourceList={this.removeSourceList}
              updateContextColumnList={this.updateContextColumnList}
            />
          );
        })}
      </>
    );
  }
}

const RenderSourceList: React.FC<any> = ({
  sourceList,
  guid,
  onSourceListChange,
  keyIndex,
  sourceListLength,
  addSourceList,
  removeSourceList,
  updateContextColumnList,
}) => {
  const isFirst = keyIndex === 0;
  const autoCompleteContext: any = useAutoCompleteContext();
  const formFullNameOptions = useMemo(() => {
    return autoCompleteContext.inputAutoComplete[guid]?.metaFullFormNames?.map((val: any) => {
      return { label: val.text, text: val.text, value: val.value };
    });
  }, [autoCompleteContext.inputAutoComplete[guid]?.metaFullFormNames]);
  const columnFullNameOptions = useMemo(() => {
    return autoCompleteContext.inputAutoComplete[guid].metaColumnNames;
  }, [autoCompleteContext.inputAutoComplete[guid]?.metaColumnNames]);
  const [showClause, setShowClause] = useState(sourceList.sourceHideClause);
  useEffect(() => {
    setShowClause(sourceList.sourceHideClause);
  }, [sourceList.sourceHideClause]);
  const relationalOperator = useMemo(() => {
    return relationalOperatorOptions.find((i: any) => {
      return i.value === sourceList.sourceJoinClause[0].relationalOperator;
    })?.label;
  }, [sourceList.sourceJoinClause[0]?.relationalOperator]);
  const onFormTypeChange = useCallback(
    (selectedVal: any) => {
      const sourceListClone = {
        ...sourceList,
        sourceHideClause: true,
        sourceType: selectedVal.value,
        sourceJoinClause: getDefaultJoinClause(),
      };
      switch (sourceListClone.sourceType) {
        case KEYWORD_FORM:
          sourceListClone.sourceHideClause = false;
          break;
      }
      onSourceListChange(sourceListClone, keyIndex, true);
    },
    [sourceList]
  );
  return (
    <div>
      <InlineFieldRow>
        <InlineFieldWrapper label="Form" labelWidth={16}></InlineFieldWrapper>
        <Seg
          onChange={(selectedVal: any) => {
            onFormTypeChange(selectedVal);
          }}
          value={sourceList.sourceType}
          loadOptions={async () => {
            return formTypeOptions;
          }}
        />
        <Seg
          onChange={(selectedVal: any) => {
            onSourceListChange({ ...sourceList, sourceFormName: selectedVal.value }, keyIndex, true);
            updateContextColumnList();
          }}
          value={sourceList.sourceFormName}
          loadOptions={async () => {
            return formFullNameOptions;
          }}
        />
        {sourceList.sourceHideClause ? (
          <InlineIconButton
            label="Join Clause"
            onClick={() => {
              setShowClause(!showClause);
            }}
            iconName={showClause ? 'angle-right' : 'angle-down'}
          />
        ) : (
          ''
        )}
        <InlineLabel style={{ flexGrow: 1, width: 'auto' }}>{''}</InlineLabel>
        {sourceListLength > 1 ? (
          <InlineIconButton
            iconName="minus"
            onClick={() => {
              removeSourceList(keyIndex);
            }}
          />
        ) : (
          ''
        )}
        {isFirst ? (
          <InlineIconButton
            iconName="plus"
            onClick={() => {
              addSourceList();
            }}
          />
        ) : (
          ''
        )}
      </InlineFieldRow>
      {showClause
        ? sourceList.sourceJoinClause.map((joinClause: any, index: number) => {
            return (
              <InlineFieldRow key={index}>
                <InlineField>
                  <InlineLabel width={14} transparent={true}>
                    {''}
                  </InlineLabel>
                </InlineField>
                <InlineField>
                  <InlineLabel width={joinClause.relationalOperator.length * 2}>
                    {joinClause.leftOperand.fieldType}
                  </InlineLabel>
                </InlineField>
                <Seg
                  onChange={(selectedVal: any) => {
                    const sourceListClauseClone = cloneDeep(sourceList.sourceJoinClause);
                    sourceListClauseClone[index].leftOperand.fieldName = selectedVal.text;
                    sourceListClauseClone[index].leftOperand.fieldSourceAlias = selectedVal.value?.formAlias;
                    onSourceListChange(
                      {
                        ...sourceList,
                        sourceJoinClause: sourceListClauseClone,
                      },
                      keyIndex,
                      true
                    );
                  }}
                  value={joinClause.leftOperand.fieldName}
                  loadOptions={async () => {
                    return columnFullNameOptions;
                  }}
                />
                <Seg
                  onChange={(selectedVal: any) => {
                    const sourceListClauseClone = cloneDeep(sourceList.sourceJoinClause);
                    sourceListClauseClone[index].relationalOperator = selectedVal.value;
                    onSourceListChange(
                      {
                        ...sourceList,
                        sourceJoinClause: sourceListClauseClone,
                      },
                      keyIndex,
                      true
                    );
                  }}
                  value={relationalOperator}
                  loadOptions={async () => {
                    return relationalOperatorOptions;
                  }}
                />
                <Seg
                  onChange={(selectedVal: any) => {
                    const sourceListClauseClone = cloneDeep(sourceList.sourceJoinClause);
                    sourceListClauseClone[index].rightOperand.fieldName = selectedVal.text;
                    sourceListClauseClone[index].rightOperand.fieldSourceAlias = selectedVal.value?.formAlias;
                    onSourceListChange(
                      {
                        ...sourceList,
                        sourceJoinClause: sourceListClauseClone,
                      },
                      keyIndex,
                      true
                    );
                  }}
                  value={joinClause.rightOperand.fieldName}
                  loadOptions={async () => {
                    return columnFullNameOptions;
                  }}
                />
                <InlineLabel style={{ flexGrow: 1, width: 'auto' }}>{''}</InlineLabel>
              </InlineFieldRow>
            );
          })
        : ''}
    </div>
  );
};

const getDefaultJoinClause: Function = () => {
  const defaultJoinClauseLeftOperand: LeftOperand = new LeftOperand(
    COLUMN_TYPE_FIELD,
    null,
    COLUMN_TYPE_SELECT_COLUMN_NAME,
    EMPTY,
    false
  );
  const defaulJoinClauseRightOperand: RightOperand = new RightOperand(
    COLUMN_TYPE_FIELD,
    null,
    CHAR,
    EMPTY,
    COLUMN_TYPE_SELECT_COLUMN_NAME,
    EMPTY
  );
  const defaultJoinClauseQualification: Qualification[] = [
    new Qualification(
      false,
      1,
      DEFAULT_GROUP,
      RELATIONAL,
      EMPTY,
      OPERATOR_EQUAL,
      null,
      null,
      defaultJoinClauseLeftOperand,
      defaulJoinClauseRightOperand
    ),
  ];
  return defaultJoinClauseQualification;
};
