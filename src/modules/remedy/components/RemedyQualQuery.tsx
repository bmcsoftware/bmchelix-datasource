import React, { Component, MouseEvent, useEffect, useMemo, useState } from 'react';
import { Icon, IconButton, InlineField, InlineFieldRow, InlineLabel, Input } from '@grafana/ui';
import { Seg } from 'modules/common/Seg';
import { BMCDataSourceQuery } from 'types';
import {
  useAutoCompleteContext,
  UPDATE_InputAutoComplete,
  AutoCompleteContext,
} from '../../common/AutoCompleteContext';
import { getWhereTypes, getHavingTypes, getRelationalOperator, DBOperator } from '../utilities/remedy_query_def';
import {
  OPERATOR_AND,
  OPERATOR_OR,
  DOT,
  GROUP_IDENTIFIER,
  NULL,
  COLUMN_TYPE_FIELD,
  COLUMN_TYPE_SELECT_COLUMN_NAME,
  VALUE,
  CHAR,
  EMPTY,
  RELATIONAL,
  OPERATOR_EQUAL,
} from '../utilities/remedy_literal_string';
import { LeftOperand, RightOperand, Qualification } from '../utilities/RemedyTypes';
import { getMetaHavingNames } from '../utilities/utility';
import { cloneDeep, isEqual } from 'lodash';
import { InlineFieldWrapper } from 'modules/common/InlineFieldWrapper';
import { InlineIconButton } from 'modules/common/InlineIconButton';

const relationalOperatorOptions = getRelationalOperator();
const logicalOpertorOptions = [
  { text: OPERATOR_AND, label: OPERATOR_AND, value: OPERATOR_AND },
  { text: OPERATOR_OR, label: OPERATOR_OR, value: OPERATOR_OR },
];

interface Props {
  target: BMCDataSourceQuery['sourceQuery'];
  onChange: Function;
  datasource: any;
}

interface WrappedProps extends Props {
  autoCompleteContext: any;
}

class RemedyHavingQueryWrap extends Component<WrappedProps, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      collapseGroup: true,
      qualType: 'Having',
    };
  }

  static getDerivedStateFromProps(props: WrappedProps, state: any) {
    console.log(props, 'props\n', state, 'state\n');
    const derivedState = {
      inputSelectionList: props.target.form.selectionList,
      inputCalculatedFieldList: props.target.form.calculatedFieldList,
    };
    if (!isEqual(derivedState, state.derivedState)) {
      const metaHavingNames = getMetaHavingNames({ ...derivedState, inputSourceList: props.target.form.sourceList });
      props.autoCompleteContext.dispatch({
        type: UPDATE_InputAutoComplete,
        guid: props.target.guid,
        value: { metaHavingNames },
      });
    }
    return { derivedState };
  }

  toggleHideQual = () => {
    this.props.onChange(
      {
        hideHaving: !this.props.target.form.hideHaving,
      },
      true
    );
  };

  updateQualification = (qual: any, index: number, runQuery: Boolean) => {
    const qualificationClone = [...this.props.target.form.havingQualification];
    qualificationClone[index] = qual;
    this.props.onChange(
      {
        havingQualification: qualificationClone,
      },
      runQuery
    );
  };

  updateQualificationList = (qualification: any) => {
    this.props.onChange(
      {
        havingQualification: qualification,
      },
      true
    );
  };
  removeQualification = (index: number) => {
    const qualificationListClone = [...this.props.target.form.havingQualification];
    qualificationListClone.splice(index, 1);
    this.props.onChange(
      {
        havingQualification: qualificationListClone,
      },
      true
    );
  };

  render() {
    return (
      <>
        {this.props.target.form.havingQualification.map((qualification: any, index: number) => {
          return (
            <RemedyQualQuery
              key={index}
              keyIndex={index}
              collapseGroup={this.state.collapseGroup}
              qualType={this.state.qualType}
              hideQual={this.props.target.form.hideHaving}
              toggleHideQual={this.toggleHideQual}
              qualification={qualification}
              guid={this.props.target.guid}
              qualificationLength={this.props.target.form.havingQualification.length}
              toggleCollapseGroup={() => {
                this.setState({ collapseGroup: !this.state.collapseGroup });
              }}
              updateQualification={this.updateQualification}
              qualificationList={this.props.target.form.qualification}
              updateQualificationList={this.updateQualificationList}
              removeQualification={this.removeQualification}
            />
          );
        })}
      </>
    );
  }
}

const WithContext = (Component: any) => {
  return function withContextHOC(props: Props) {
    return (
      <AutoCompleteContext.Consumer>
        {(value) => <Component {...props} autoCompleteContext={value} />}
      </AutoCompleteContext.Consumer>
    );
  };
};
WithContext.displayName = 'WithContext';

export const RemedyHavingQuery = WithContext(RemedyHavingQueryWrap);

export class RemedyWhereQuery extends Component<Props, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      collapseGroup: true,
      qualType: 'Where',
    };
  }

  toggleHideQual = () => {
    this.props.onChange(
      {
        hideQual: !this.props.target.form.hideQual,
      },
      true
    );
  };

  updateQualification = (qual: any, index: number, runQuery: Boolean) => {
    const qualificationClone = [...this.props.target.form.qualification];
    qualificationClone[index] = qual;
    this.props.onChange(
      {
        qualification: qualificationClone,
      },
      runQuery
    );
  };

  updateQualificationList = (qualification: any) => {
    this.props.onChange(
      {
        qualification: qualification,
      },
      true
    );
  };
  removeQualification = (index: number) => {
    const qualificationListClone = [...this.props.target.form.qualification];
    qualificationListClone.splice(index, 1);
    this.props.onChange(
      {
        qualification: qualificationListClone,
      },
      true
    );
  };

  render() {
    return (
      <>
        {this.props.target.form.qualification.map((qualification: any, index: number) => {
          return (
            <RemedyQualQuery
              key={index}
              keyIndex={index}
              collapseGroup={this.state.collapseGroup}
              qualType={this.state.qualType}
              hideQual={this.props.target.form.hideQual}
              toggleHideQual={this.toggleHideQual}
              qualification={qualification}
              guid={this.props.target.guid}
              qualificationLength={this.props.target.form.qualification.length}
              toggleCollapseGroup={() => {
                this.setState({ collapseGroup: !this.state.collapseGroup });
              }}
              updateQualification={this.updateQualification}
              qualificationList={this.props.target.form.qualification}
              updateQualificationList={this.updateQualificationList}
              removeQualification={this.removeQualification}
            />
          );
        })}
      </>
    );
  }
}

const RemedyQualQuery: React.FC<any> = ({
  keyIndex,
  collapseGroup,
  qualType,
  hideQual,
  toggleHideQual,
  qualification,
  guid,
  qualificationLength,
  toggleCollapseGroup,
  updateQualification,
  qualificationList,
  updateQualificationList,
  removeQualification,
}) => {
  const isFirst = keyIndex === 0;
  const autoCompleteContext: any = useAutoCompleteContext();
  const [rightOperandValue, setRightOperandValue] = useState(qualification.rightOperand?.fieldValue);

  useEffect(() => {
    setRightOperandValue(qualification.rightOperand?.fieldValue);
  }, [qualification.rightOperand?.fieldValue]);

  const fieldTypeOptions = useMemo(() => {
    return qualType === 'Where' ? getWhereTypes() : getHavingTypes();
  }, [qualType]);

  const columnFullNameOptions = useMemo(() => {
    return qualType === 'Where'
      ? autoCompleteContext.inputAutoComplete[guid].metaColumnNames
      : autoCompleteContext.inputAutoComplete[guid].metaHavingNames;
  }, [
    autoCompleteContext.inputAutoComplete[guid]?.metaColumnNames,
    autoCompleteContext.inputAutoComplete[guid]?.metaHavingNames,
  ]);

  const shiftLeftQualification = () => {
    if (hideQual || qualification.groupCounter === 1) return;
    const qualificationClone = { ...qualification };
    qualificationClone.groupCounter -= 1;
    // Calculate Group Hierarchy from G1.G2 => G1
    qualificationClone.groupHierarchy = qualificationClone.groupHierarchy.substring(
      0,
      qualificationClone.groupHierarchy.lastIndexOf(DOT)
    );
    updateQualification(qualificationClone, keyIndex, true);
  };

  const shiftRightQualification = () => {
    if (hideQual) return;
    const qualificationClone = { ...qualification };
    qualificationClone.groupCounter += 1;
    // Calculate Group Hierarchy
    qualificationClone.groupHierarchy += DOT + GROUP_IDENTIFIER + qualificationClone.groupCounter;
    updateQualification(qualificationClone, keyIndex, true);
  };

  const shiftRightAndStartGroupQualification = () => {
    if (hideQual || keyIndex === 0) return;
    const qualificationClone = { ...qualification };
    qualificationClone.splitGroup = true;
    qualificationClone.groupCounter += 1;
    // Calculate Group Hierarchy
    let prevGroup = qualificationList[keyIndex - 1];
    // E.g. Previous Element = G1.G2.G3
    // E.g. Previous Element = G1.G2.G3
    // E.g. Current Element = G1.G2.G4
    qualificationClone.groupHierarchy += DOT + GROUP_IDENTIFIER + (prevGroup.groupCounter + 1);
    updateQualification(qualificationClone, keyIndex, true);
  };

  const addQualification = () => {
    const qualificationClone = cloneDeep(qualification);
    const qualificationListClone = [...qualificationList];
    qualificationClone.logicalOperator = OPERATOR_AND;
    const addIndex = keyIndex + 1;

    let leftOperand = new LeftOperand(COLUMN_TYPE_FIELD, null, COLUMN_TYPE_SELECT_COLUMN_NAME, EMPTY);
    let rightOperand = new RightOperand(VALUE, null, CHAR, EMPTY, COLUMN_TYPE_SELECT_COLUMN_NAME, EMPTY);
    let relationalQualification = new Qualification(
      true,
      qualificationClone.groupCounter,
      qualificationClone.groupHierarchy,
      RELATIONAL,
      OPERATOR_AND,
      OPERATOR_EQUAL,
      null,
      null,
      leftOperand,
      rightOperand
    );

    if (keyIndex !== 0) {
      relationalQualification.splitGroup = qualificationClone.splitGroup;
    }
    qualificationListClone[keyIndex] = qualificationClone;
    qualificationListClone.splice(addIndex, 0, relationalQualification);
    updateQualificationList(qualificationListClone, true);
  };

  return isFirst || !collapseGroup ? (
    <InlineFieldRow>
      <InlineFieldWrapper
        label={qualType}
        labelWidth={16}
        labelChildren={
          <IconButton
            name={hideQual ? 'eye-slash' : 'eye'}
            tooltipPlacement="top"
            tooltip="Click to toggle show / hide header"
            onClick={(e: MouseEvent) => {
              e.preventDefault();
              toggleHideQual();
            }}
            size="sm"
          />
        }
      />
      {(qualification.groupCounter * 2 - 2) * 2 ? (
        <InlineField>
          <InlineLabel transparent={true} width={(qualification.groupCounter * 2 - 2) * 2}>
            {''}
          </InlineLabel>
        </InlineField>
      ) : (
        ''
      )}
      <InlineField>
        <InlineLabel>
          <Icon
            name={'arrow-left'}
            size="md"
            onClick={() => {
              shiftLeftQualification();
            }}
          />
          <Icon
            name={'arrow-right'}
            size="md"
            onClick={() => {
              shiftRightQualification();
            }}
          />
          <Icon
            name={'arrow-from-right'}
            size="md"
            onClick={() => {
              shiftRightAndStartGroupQualification();
            }}
            style={{ color: qualification.splitGroup ? '#ff851b' : 'inherit' }}
          />
        </InlineLabel>
      </InlineField>
      <Seg
        disabled={hideQual}
        value="+"
        loadOptions={async () => {
          return fieldTypeOptions;
        }}
        onChange={(selectedVal: any) => {
          if (qualification.leftOperand) {
            updateQualification(
              {
                ...qualification,
                leftOperand: {
                  ...qualification.leftOperand,
                  fieldType: selectedVal.value,
                },
              },
              keyIndex,
              true
            );
          }
        }}
      />
      <div className="gf-form">
        <label className="gf-form-label query-keyword">{qualification.leftOperand.fieldType}</label>
      </div>
      <Seg
        disabled={hideQual}
        value={qualification.leftOperand.fieldName}
        loadOptions={async () => {
          return columnFullNameOptions;
        }}
        onChange={(selectedVal: any) => {
          const qualificationClone = cloneDeep(qualification);
          if (qualificationClone.leftOperand) {
            if (qualificationClone.leftOperand.fieldName.isCalculatedField === true) {
              qualificationClone.leftOperand.fieldName = selectedVal.value.columnName;
            } else {
              qualificationClone.leftOperand.fieldName = selectedVal.text;
            }
            updateQualification(qualificationClone, keyIndex, true);
          }
        }}
      />
      <Seg
        disabled={hideQual}
        value={qualification.relationalOperator}
        loadOptions={async () => {
          return relationalOperatorOptions;
        }}
        onChange={(selectedVal: any) => {
          const qualificationClone = cloneDeep(qualification);
          qualificationClone.relationalOperator = selectedVal.value;
          if (
            qualificationClone.rightOperand &&
            (qualificationClone.relationalOperator === DBOperator.Is.value ||
              qualificationClone.relationalOperator === DBOperator.IsNot.value)
          ) {
            qualificationClone.rightOperand.fieldValue = NULL;
          }
          updateQualification(qualificationClone, keyIndex, true);
        }}
      />
      <InlineField>
        <Input
          type="text"
          className={`max-width-${rightOperandValue?.length > 20 ? '20' : '7'} min-width-7`}
          value={rightOperandValue}
          disabled={hideQual}
          onBlur={() => {
            if (
              qualification.rightOperand &&
              qualification.relationalOperator !== DBOperator.Is.value &&
              qualification.relationalOperator !== DBOperator.IsNot.value
            ) {
              updateQualification(
                {
                  ...qualification,
                  rightOperand: {
                    ...qualification.rightOperand,
                    fieldValue: rightOperandValue,
                  },
                },
                keyIndex,
                true
              );
            }
          }}
          onChange={(e: any) => {
            if (
              qualification.relationalOperator !== DBOperator.Is.value &&
              qualification.relationalOperator !== DBOperator.IsNot.value
            ) {
              setRightOperandValue(e.target.value);
            }
          }}
          placeholder="Add Values"
        />
      </InlineField>
      {keyIndex !== qualificationLength - 1 ? (
        <Seg
          disabled={hideQual}
          value={qualification.logicalOperator}
          loadOptions={async () => {
            return logicalOpertorOptions;
          }}
          onChange={(selectedVal: any) => {
            updateQualification(
              {
                ...qualification,
                logicalOperator: selectedVal.value,
              },
              keyIndex,
              true
            );
          }}
        />
      ) : (
        ''
      )}
      <InlineLabel style={{ flexGrow: 1, width: 'auto' }}>{''}</InlineLabel>
      {isFirst && qualType === 'Where' ? (
        <InlineField>
          <InlineLabel
            onClick={() => {
              // find out the use case of this
              'toggleUseOneEqualOne()';
            }}
          >
            <span
              className="gf-form-label"
              style={{
                color: qualification.useOneEqualOne ? '#ff851b' : 'inherit',
              }}
            >
              1=1
            </span>
          </InlineLabel>
        </InlineField>
      ) : (
        ''
      )}
      {isFirst ? (
        <InlineIconButton
          disabled={hideQual}
          iconName={collapseGroup ? 'angle-right' : 'angle-down'}
          onClick={() => {
            toggleCollapseGroup();
          }}
          label={`(${qualificationLength})`}
        />
      ) : (
        ''
      )}
      {!isFirst ? (
        <InlineIconButton
          disabled={hideQual}
          onClick={() => {
            removeQualification(keyIndex);
          }}
          iconName="minus"
        />
      ) : (
        ''
      )}
      <InlineIconButton
        disabled={hideQual}
        onClick={() => {
          addQualification();
        }}
        iconName="plus"
      />
    </InlineFieldRow>
  ) : null;
};
RemedyQualQuery.displayName = 'RemedyQualQuery';
