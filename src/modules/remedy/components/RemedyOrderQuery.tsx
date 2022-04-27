import React, { Component, useMemo } from 'react';
import { IconButton, InlineFieldRow, InlineLabel } from '@grafana/ui';
import { BMCDataSourceQuery } from 'types';
import { isEqual, cloneDeep } from 'lodash';
import {
  AutoCompleteContext,
  UPDATE_InputAutoComplete,
  useAutoCompleteContext,
} from '../../common/AutoCompleteContext';
import { Seg } from '../../common/Seg';
import { SelectionList, SortField } from '../utilities/RemedyTypes';
import {
  COLUMN_TYPE_FIELD,
  ARROW,
  COLUMN_TYPE_SELECT_COLUMN_NAME,
  SQL_ASCENDING,
  EMPTY,
} from '../utilities/remedy_literal_string';
import { getSortOrder } from '../utilities/remedy_query_def';
import { getMetaOrderNames } from '../utilities/utility';
import { InlineFieldWrapper } from 'modules/common/InlineFieldWrapper';
import { InlineIconButton } from 'modules/common/InlineIconButton';

const selectedSortOrderOptions = getSortOrder();

interface Props {
  target: BMCDataSourceQuery['sourceQuery'];
  onChange: Function;
  datasource: any;
}

interface WrappedProps extends Props {
  autoCompleteContext: any;
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

class RemedyOrderQueryWrap extends Component<WrappedProps, any> {
  constructor(props: WrappedProps) {
    super(props);
    this.state = { type: 'orderBy', derivedState: {} };
  }

  static getDerivedStateFromProps(props: WrappedProps, state: any) {
    const derivedState = {
      inputSourceList: props.target.form.sourceList,
      inputCalculatedFieldList: props.target.form.calculatedFieldList,
      inputGroupList: props.target.form.groupByField,
    };
    if (!isEqual(derivedState, state.derivedState)) {
      const metaOrderNames = getMetaOrderNames({ ...derivedState });
      props.autoCompleteContext.dispatch({
        type: UPDATE_InputAutoComplete,
        guid: props.target.guid,
        value: { metaOrderNames },
      });
    }
    return { derivedState };
  }

  toggleHideSort = () => {
    this.props.onChange(
      {
        hideSort: !this.props.target.form.hideSort,
      },
      true
    );
  };

  updateOrderField = (orderField: any, index: number, runQuery: Boolean) => {
    const orderFieldClone = [...this.props.target.form.sortField];
    orderFieldClone[index] = orderField;
    this.props.onChange(
      {
        sortField: orderFieldClone,
      },
      runQuery
    );
  };

  addOrderField = () => {
    const defaultSortFieldSortOperand: SelectionList = new SelectionList(
      COLUMN_TYPE_FIELD,
      COLUMN_TYPE_SELECT_COLUMN_NAME,
      EMPTY,
      EMPTY
    );
    const defaultSortField: SortField = new SortField(defaultSortFieldSortOperand, SQL_ASCENDING);
    this.props.onChange(
      {
        sortField: [...this.props.target.form.sortField, defaultSortField],
      },
      true
    );
  };
  removeOrderField = (index: number) => {
    const orderFieldClone = [...this.props.target.form.sortField];
    orderFieldClone.splice(index, 1);
    this.props.onChange(
      {
        sortField: orderFieldClone,
      },
      true
    );
  };

  render() {
    return (
      <>
        {this.props.target.form.sortField?.length &&
          this.props.target.form.sortField.map((orderField: any, index: number) => {
            return (
              <OrderField
                key={index}
                keyIndex={index}
                orderField={orderField}
                guid={this.props.target.guid}
                hideSort={this.props.target.form.hideSort}
                toggleHideSort={this.toggleHideSort}
                orderFieldLength={this.props.target.form.sortField.length}
                groubyDisabled={this.props.target.form.hideGroupBy}
                updateOrderField={this.updateOrderField}
                addOrderField={this.addOrderField}
                removeOrderField={this.removeOrderField}
              />
            );
          })}
      </>
    );
  }
}

const OrderField: React.FC<any> = ({
  keyIndex,
  orderField,
  guid,
  hideSort,
  toggleHideSort,
  orderFieldLength,
  groubyDisabled,
  updateOrderField,
  addOrderField,
  removeOrderField,
}) => {
  const isFirst = keyIndex === 0;
  const autoCompleteContext: any = useAutoCompleteContext();
  const columnFullNameOptions = useMemo(() => {
    return autoCompleteContext.inputAutoComplete[guid]?.metaColumnNames;
  }, [autoCompleteContext.inputAutoComplete[guid]?.metaColumnNames]);
  const orderNameOptions = useMemo(() => {
    return autoCompleteContext.inputAutoComplete[guid]?.metaOrderNames;
  }, [autoCompleteContext.inputAutoComplete[guid]?.metaOrderNames]);

  return (
    <InlineFieldRow>
      <InlineFieldWrapper
        label="Order By"
        labelWidth={16}
        labelChildren={
          <IconButton
            name={hideSort ? 'eye-slash' : 'eye'}
            onClick={(e) => {
              e.preventDefault();
              toggleHideSort();
            }}
            tooltipPlacement="top"
            tooltip="Click to toggle show / hide header"
            size="sm"
          />
        }
      />
      <Seg
        disabled={hideSort}
        value={orderField.sortOperand.selectionColumnName}
        loadOptions={async () => {
          return groubyDisabled ? columnFullNameOptions : orderNameOptions;
        }}
        onChange={(selectedVal: any) => {
          const orderFieldClone = cloneDeep(orderField);
          if (selectedVal.value.selectionType) {
            orderFieldClone.sortOperand.selectionType = selectedVal.value.selectionType;
            orderFieldClone.sortOperand.selectionColumnName = selectedVal.value.columnName;
          } else if (selectedVal.value.isCalculatedField === true) {
            orderFieldClone.sortOperand.selectionType = COLUMN_TYPE_FIELD;
            orderFieldClone.sortOperand.selectionColumnName = selectedVal.value.columnName;
          } else {
            orderFieldClone.sortOperand.selectionType = COLUMN_TYPE_FIELD;
            orderFieldClone.sortOperand.selectionColumnName =
              selectedVal.value.formName + ARROW + selectedVal.value.columnName;
          }
          updateOrderField(orderFieldClone, keyIndex, true);
        }}
      />
      <Seg
        disabled={hideSort}
        value={orderField.sortOrder}
        loadOptions={async () => {
          return selectedSortOrderOptions;
        }}
        onChange={(selectedVal: any) => {
          updateOrderField(
            {
              ...orderField,
              sortOrder: selectedVal.value,
            },
            keyIndex,
            true
          );
        }}
      />
      <InlineLabel style={{ flexGrow: 1, width: 'auto' }}>{''}</InlineLabel>
      {orderFieldLength > 1 ? (
        <InlineIconButton
          disabled={hideSort}
          iconName="minus"
          onClick={() => {
            removeOrderField(keyIndex);
          }}
        />
      ) : (
        ''
      )}
      {isFirst ? (
        <InlineIconButton
          disabled={hideSort}
          iconName="plus"
          onClick={() => {
            addOrderField();
          }}
        />
      ) : (
        ''
      )}
    </InlineFieldRow>
  );
};

OrderField.displayName = 'OrderField';

export const RemedyOrderQuery = WithContext(RemedyOrderQueryWrap);
