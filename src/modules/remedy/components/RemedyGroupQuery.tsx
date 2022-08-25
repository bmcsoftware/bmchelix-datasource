import React, { PureComponent } from 'react';
import { IconButton, InlineFieldRow, InlineLabel } from '@grafana/ui';
import { Seg } from 'modules/common/Seg';
import { BMCDataSourceQuery } from 'types';
import {
  AutoCompleteContext,
  UPDATE_InputAutoComplete,
  useAutoCompleteContext,
} from '../../common/AutoCompleteContext';
import { getMetaGroupNames, replaceSpaceWithUnderscore } from '../utilities/utility';
import {
  COLUMN_TYPE_SELECT_FORM_NAME,
  COLUMN_TYPE_FIELD,
  COLUMN_TYPE_SELECT_COLUMN_NAME,
  EMPTY,
  ARROW,
  GROUP_IDENTIFIER,
  CALCULATED_FIELD,
} from '../utilities/remedy_literal_string';
import { SelectionList, SourceList } from '../utilities/RemedyTypes';
import { isDBFunctionsAggregate } from '../utilities/remedy_query_def';
import {
  isEqual as _isEqual,
  cloneDeep as _cloneDeep,
  fill as _fill,
  each as _each,
  find as _find,
  findIndex as _findIndex,
} from 'lodash';
import { InlineFieldWrapper } from 'modules/common/InlineFieldWrapper';
import { InlineIconButton } from 'modules/common/InlineIconButton';

interface Props {
  target: BMCDataSourceQuery['sourceQuery'];
  onChange: Function;
  datasource: any;
}
interface WrappedProps extends Props {
  autoCompleteContext: any;
}

class RemedyGroupQueryWrap extends PureComponent<WrappedProps, any> {
  constructor(props: WrappedProps) {
    super(props);
    this.state = {
      type: 'groupBy',
      derivedState: {},
    };
  }

  static getDerivedStateFromProps(props: WrappedProps, state: any) {
    const derivedState = {
      inputSelectionList: props.target.form.selectionList,
      inputCalculatedFieldList: props.target.form.calculatedFieldList,
    };

    if (!_isEqual(derivedState.inputSelectionList, state.derivedState.inputSelectionList)) {
      const metaGroupNames = getMetaGroupNames({
        inputSelectionList: derivedState.inputSelectionList,
        inputSourceList: props.target.form.sourceList,
      });
      props.autoCompleteContext.dispatch({
        type: UPDATE_InputAutoComplete,
        guid: props.target.guid,
        value: { metaGroupNames },
      });
    }
    return { derivedState };
  }

  componentDidUpdate(prevProps: WrappedProps, prevState: any) {
    const derivedState = {
      inputSelectionList: this.props.target.form.selectionList,
      inputCalculatedFieldList: this.props.target.form.calculatedFieldList,
    };
    if (
      !_isEqual(derivedState, prevState.derivedState) &&
      this.props.target.form.calculatedFieldList?.find((calculatedField: any) => {
        return !calculatedField.hideCalculatedField && calculatedField.selectionCalculatedFields !== CALCULATED_FIELD;
      })
    ) {
      this.forceUpdateGroupList();
    }
  }

  forceUpdateGroupList = () => {
    const inputSourceList = _cloneDeep(this.props.target.form.sourceList);
    const inputGroupList = _cloneDeep(this.props.target.form.groupByField);
    const inputSelectionList = this.props.target.form.selectionList;
    const inputCalculatedFieldList = this.props.target.form.calculatedFieldList;
    const showGroupBy = !this.props.target.form.calculatedFieldList?.find((calculatedField: any) => {
      return (
        calculatedField.selectionAggregation ||
        (!calculatedField.selectionAggregation && !this.props.target.form.hideGroupBy)
      );
    });
    const metaGroupNames: any[] = [];
    if (!showGroupBy) {
      inputSelectionList.forEach((column: any) => {
        if (column.selectionColumnName !== COLUMN_TYPE_SELECT_COLUMN_NAME) {
          if (!isDBFunctionsAggregate(column.selectionType)) {
            metaGroupNames.push(column);
          }
        }
      });

      if (inputCalculatedFieldList !== undefined) {
        _each(inputCalculatedFieldList, (field) => {
          if (field.selectionCalculatedFields !== CALCULATED_FIELD && !field.hideCalculatedField) {
            let form: SourceList = inputSourceList[0];
            _find(inputSourceList, function (f) {
              if (field.selectionAlias.includes(f.sourceFormName)) {
                form = f;
              }
            });
            const tempColumnName = replaceSpaceWithUnderscore(field.selectionAlias);
            if (!field.selectionAggregation) {
              metaGroupNames.push(new SelectionList('Field', tempColumnName, 'Calculated Field', form.sourceAlias));
            } else {
              const spliceIndex = _findIndex(inputGroupList, (val: SelectionList) => {
                return (
                  val.selectionSrcAlias === 'Calculated Field' && val.selectionColumnName.indexOf(tempColumnName) > -1
                );
              });
              if (spliceIndex > -1) {
                inputGroupList.splice(spliceIndex, 1);
              }
            }
          }
        });
      }
    }

    if (metaGroupNames.length > 0) {
      inputGroupList.forEach((column: any, index: any) => {
        if (
          column.selectionColumnName === '' ||
          column.selectionColumnName === column.selectionType + ARROW + COLUMN_TYPE_SELECT_COLUMN_NAME
        ) {
          inputGroupList.splice(index, 1);
        }
      });
      if (metaGroupNames.length > inputGroupList.length) {
        const requiredLength = metaGroupNames.length - inputGroupList.length;
        for (let i = 0; i < requiredLength; i++) {
          const defaultGroupByField: SelectionList = new SelectionList(
            COLUMN_TYPE_FIELD,
            COLUMN_TYPE_SELECT_COLUMN_NAME,
            EMPTY,
            EMPTY
          );
          inputGroupList.push(defaultGroupByField);
        }
      }
      metaGroupNames.forEach((column: any, index: any) => {
        inputGroupList[index].selectionColumnName = column.selectionType + ARROW + column.selectionColumnName;
        inputGroupList[index].selectionSrcAlias = column.selectionSrcAlias;
        inputGroupList[index].selectionAlias = GROUP_IDENTIFIER + (index + 1);
      });
      this.props.onChange(
        {
          hideGroupBy: false,
          groupByField: inputGroupList,
        },
        true
      );
    }
  };

  toggleHideGroupBy = () => {
    this.props.onChange(
      {
        hideGroupBy: !this.props.target.form.hideGroupBy,
      },
      true
    );
  };

  updateGroupList = (groupByField: any, index: number, runQuery: boolean) => {
    const groupByFieldClone = [...this.props.target.form.groupByField];
    groupByFieldClone[index] = groupByField;
    this.props.onChange(
      {
        groupByField: groupByFieldClone,
      },
      runQuery
    );
  };

  addRemedyColumn = () => {
    if (this.props.target.form.hideGroupBy) {
      return;
    }
    const defaultGroupByField: SelectionList = new SelectionList(
      COLUMN_TYPE_FIELD,
      COLUMN_TYPE_SELECT_COLUMN_NAME,
      EMPTY,
      EMPTY
    );
    this.props.onChange(
      {
        groupByField: [...this.props.target.form.groupByField, defaultGroupByField],
      },
      true
    );
  };

  removeRemedyColumn = (index: number) => {
    const groupByFieldClone = [...this.props.target.form.groupByField];
    groupByFieldClone.splice(index, 1);
    this.props.onChange(
      {
        groupByField: groupByFieldClone,
      },
      true
    );
  };

  render() {
    return (
      <>
        {this.props.target.form?.groupByField
          ? this.props.target.form.groupByField.map((group: any, index: number) => {
              return (
                <GroupQuery
                  key={index}
                  keyIndex={index}
                  guid={this.props.target.guid}
                  hideGroupBy={this.props.target.form.hideGroupBy}
                  toggleHideGroupBy={this.toggleHideGroupBy}
                  group={group}
                  groupLength={this.props.target.form.groupByField.length}
                  updateGroupList={this.updateGroupList}
                  addRemedyColumn={this.addRemedyColumn}
                  removeRemedyColumn={this.removeRemedyColumn}
                />
              );
            })
          : ''}
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

export const RemedyGroupQuery = WithContext(RemedyGroupQueryWrap);

const GroupQuery: React.FC<any> = ({
  keyIndex,
  guid,
  hideGroupBy,
  toggleHideGroupBy,
  group,
  groupLength,
  updateGroupList,
  addRemedyColumn,
  removeRemedyColumn,
}) => {
  const isFirst = keyIndex === 0;
  const isSingle = groupLength === 1;
  const autoCompleteContext: any = useAutoCompleteContext();

  const groupColumnNameOptions = React.useMemo(() => {
    return autoCompleteContext.inputAutoComplete[guid]?.metaGroupNames;
  }, [autoCompleteContext.inputAutoComplete[guid]?.metaGroupNames]);

  return (
    <InlineFieldRow>
      <InlineFieldWrapper
        label="Group By"
        labelWidth={16}
        labelChildren={
          <IconButton
            name={hideGroupBy ? 'eye-slash' : 'eye'}
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              toggleHideGroupBy();
            }}
            tooltip="Click to toggle show / hide header"
            tooltipPlacement="top"
          />
        }
      ></InlineFieldWrapper>
      <Seg
        disabled={hideGroupBy}
        value={group.selectionColumnName || COLUMN_TYPE_SELECT_FORM_NAME}
        loadOptions={async () => {
          return groupColumnNameOptions;
        }}
        onChange={(selectedVal: any) => {
          updateGroupList(
            {
              ...group,
              selectionColumnName: selectedVal.value.columnName,
              selectionType: selectedVal.value.selectionType,
            },
            keyIndex,
            true
          );
        }}
      />
      <InlineLabel style={{ flexGrow: 1, width: 'auto' }}>{''}</InlineLabel>
      {!isSingle ? (
        <InlineIconButton
          disabled={hideGroupBy}
          iconName="minus"
          onClick={() => {
            removeRemedyColumn(keyIndex);
          }}
        />
      ) : (
        ''
      )}
      {isFirst ? (
        <InlineIconButton
          disabled={hideGroupBy}
          iconName="plus"
          onClick={() => {
            addRemedyColumn();
          }}
        />
      ) : (
        ''
      )}
    </InlineFieldRow>
  );
};

GroupQuery.displayName = 'GroupQuery';
