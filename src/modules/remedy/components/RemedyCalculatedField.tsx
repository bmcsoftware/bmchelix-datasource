import React, { PureComponent, useMemo, useState, useEffect } from 'react';
import { IconButton, InlineFieldRow, InlineLabel } from '@grafana/ui';
import { getBackendSrv } from '@grafana/runtime';
import { BMCDataSourceQuery } from 'types';
import { each as _each, isEqual as _isEqual } from 'lodash';
import {
  AutoCompleteContext,
  useAutoCompleteContext,
  UPDATE_InputAutoComplete,
} from '../../common/AutoCompleteContext';
import { Seg } from '../../common/Seg';
import { getDistinctFormNames } from '../utilities/utility';
import {
  ARROW,
  CALCULATED_FIELD,
  COLUMN_TYPE_SELECT_COLUMN_NAME,
  EMPTY,
  CALCULATED_IDENTIFIER,
  OPENING_BRACKET,
} from '../utilities/remedy_literal_string';
import { CalculatedFieldList } from '../utilities/RemedyTypes';
import { InlineFieldWrapper } from 'modules/common/InlineFieldWrapper';
import { InlineIconButton } from 'modules/common/InlineIconButton';
interface Props {
  target: BMCDataSourceQuery['sourceQuery'];
  onChange: Function;
  datasource: any;
}
export class RemedyCalculatedField extends PureComponent<Props, any> {
  static contextType = AutoCompleteContext;
  constructor(props: Props) {
    super(props);
    this.state = {
      selectionCalculatedField: [],
      derivedState: {},
    };
  }

  static getDerivedStateFromProps(props: Props, state: any) {
    const derivedState = {
      distinctFormNames: getDistinctFormNames(props.target.form.sourceList),
    };
    return { derivedState };
  }

  componentDidMount() {
    getBackendSrv()
      .get('api/org/calculatedfield')
      .then((data: any) => {
        this.setState({ selectionCalculatedField: data });
        this.setMetaCalculatedFields(data);
      });
  }

  componentDidUpdate(prevProps: Props, prevState: any) {
    const derivedState = {
      distinctFormNames: getDistinctFormNames(this.props.target.form.sourceList),
    };
    if (!_isEqual(derivedState.distinctFormNames, prevState.derivedState.distinctFormNames)) {
      this.setMetaCalculatedFields(this.state.selectionCalculatedField);
    }
  }

  setMetaCalculatedFields = (result: any[]) => {
    const calculatedFields: any[] = [];
    const formNames: any[] = [];
    this.props.target.form.sourceList.forEach((item: any) => {
      formNames.push(item.sourceFormName);
    });
    _each(result, (item: any) => {
      if (formNames.includes(item.formName)) {
        calculatedFields.push({
          text: item.module + ARROW + item.name,
          label: item.module + ARROW + item.name,
          value: {
            name: item.name,
            text: item.module + ARROW + item.name,
            query: item.sqlQuery,
            aggregation: item.Aggregation,
          },
        });
      }
    });
    this.context.dispatch({
      type: UPDATE_InputAutoComplete,
      guid: this.props.target.guid,
      value: { metaCalculatedFields: calculatedFields },
    });
  };

  updateCalculatedField = (calculatedField: any, index: number, runQuery: boolean) => {
    const calculatedFieldListClone = [...this.props.target.form.calculatedFieldList];
    calculatedFieldListClone[index] = calculatedField;
    this.props.onChange(
      {
        calculatedFieldList: calculatedFieldListClone,
      },
      true
    );
  };

  addCalculatedField = () => {
    const calculatedFieldListLength = this.props.target.form.calculatedFieldList.length;
    const defaultSelectionList: CalculatedFieldList = new CalculatedFieldList(
      CALCULATED_FIELD,
      COLUMN_TYPE_SELECT_COLUMN_NAME,
      CALCULATED_IDENTIFIER + (calculatedFieldListLength + 1),
      EMPTY,
      true,
      false
    );
    this.props.onChange(
      {
        calculatedFieldList: [...this.props.target.form.calculatedFieldList, defaultSelectionList],
      },
      true
    );
  };

  removeCalculatedField = (index: number) => {
    const calculatedFieldListClone = [...this.props.target.form.calculatedFieldList];
    calculatedFieldListClone.splice(index, 1);
    this.props.onChange(
      {
        calculatedFieldList: calculatedFieldListClone,
      },
      true
    );
  };

  render() {
    return (
      <>
        {this.props.target.form.calculatedFieldList?.length
          ? this.props.target.form.calculatedFieldList.map((calculatedField: any, index: number) => {
              return (
                <CalculatedFieldQuery
                  key={index}
                  keyIndex={index}
                  guid={this.props.target.guid}
                  calculatedField={calculatedField}
                  updateCalculatedField={this.updateCalculatedField}
                  calculatedFieldListLength={this.props.target.form.calculatedFieldList.length}
                  addCalculatedField={this.addCalculatedField}
                  removeCalculatedField={this.removeCalculatedField}
                />
              );
            })
          : ''}
      </>
    );
  }
}

const CalculatedFieldQuery: React.FC<any> = ({
  keyIndex,
  calculatedField,
  guid,
  updateCalculatedField,
  calculatedFieldListLength,
  removeCalculatedField,
  addCalculatedField,
}) => {
  const isFirst = keyIndex === 0;
  const autoCompleteContext: any = useAutoCompleteContext();
  const [selectionAlias, setSelectionAlias] = useState<any>([]);

  const refreshSelectionAlias = () => {
    const selectionAliasClone = [];
    selectionAliasClone.unshift({
      text: CALCULATED_IDENTIFIER + (keyIndex + 1),
      label: CALCULATED_IDENTIFIER + (keyIndex + 1),
      value: CALCULATED_IDENTIFIER + (keyIndex + 1),
    });
    // Add if existing Alias is not already present
    if (!selectionAliasClone.find((v: any) => v.text === calculatedField.selectionAlias)) {
      selectionAliasClone.unshift({
        text: calculatedField.selectionAlias,
        label: calculatedField.selectionAlias,
        value: calculatedField.selectionAlias,
      });
    }
    // Add column Name as alias if does not exist
    let selectedColumnName = calculatedField.selectionCalculatedFieldName;
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
      });
    }
    setSelectionAlias(selectionAliasClone);
  };

  useEffect(() => {
    refreshSelectionAlias();
  }, []);

  useEffect(() => {
    refreshSelectionAlias();
  }, [calculatedField.selectionCalculatedFields, calculatedField.selectionCalculatedFieldName]);

  const calculatedFieldOptions = useMemo(() => {
    return autoCompleteContext.inputAutoComplete[guid]?.metaCalculatedFields;
  }, [autoCompleteContext.inputAutoComplete[guid]?.metaCalculatedFields]);
  return (
    <InlineFieldRow>
      <InlineFieldWrapper
        label="Calculated Field"
        labelWidth={16}
        labelChildren={
          <IconButton
            name={calculatedField.hideCalculatedField ? 'eye-slash' : 'eye'}
            size="sm"
            tooltip="Click to toggle show / hide header"
            tooltipPlacement="top"
            onClick={(e) => {
              e.preventDefault();
              updateCalculatedField(
                {
                  ...calculatedField,
                  hideCalculatedField: !calculatedField.hideCalculatedField,
                },
                keyIndex,
                true
              );
            }}
          />
        }
      />
      <Seg
        disabled={calculatedField.hideCalculatedField}
        value={calculatedField.selectionCalculatedFields}
        loadOptions={async () => {
          return calculatedFieldOptions;
        }}
        onChange={(selectedVal: any) => {
          const calculatedFieldClone = { ...calculatedField };
          calculatedFieldClone.selectionCalculatedFields = selectedVal.value.text;
          calculatedFieldClone.selectionQuery = selectedVal.value.query;
          calculatedFieldClone.selectionAlias = CALCULATED_IDENTIFIER + (keyIndex + 1);
          calculatedFieldClone.selectionCalculatedFieldName = selectedVal.value.name;
          calculatedFieldClone.selectionAggregation = selectedVal.value.aggregation;
          if (selectedVal.value.name.indexOf(OPENING_BRACKET) !== -1) {
            calculatedFieldClone.selectionCalculatedFieldName = selectedVal.value.name.split(/[(' ',?,.]/)[0];
          }
          updateCalculatedField(
            {
              ...calculatedField,
              ...calculatedFieldClone,
            },
            keyIndex,
            true
          );
        }}
      />
      <div className="gf-form">
        <label className="gf-form-label query-keyword">Alias</label>
      </div>
      <Seg
        disabled={calculatedField.hideCalculatedField}
        value={calculatedField.selectionAlias}
        loadOptions={async () => {
          return selectionAlias;
        }}
        onChange={(selectedVal: any) => {
          updateCalculatedField(
            {
              ...calculatedField,
              selectionAlias: selectedVal.value,
            },
            keyIndex,
            true
          );
        }}
      />
      <InlineLabel style={{ flexGrow: 1, width: 'auto' }}>{''}</InlineLabel>
      {calculatedFieldListLength > 1 ? (
        <InlineIconButton
          disabled={calculatedField.hideCalculatedField}
          iconName="minus"
          onClick={() => {
            removeCalculatedField(keyIndex);
          }}
        />
      ) : (
        ''
      )}
      {isFirst ? (
        <InlineIconButton
          disabled={calculatedField.hideCalculatedField}
          iconName="plus"
          onClick={() => {
            addCalculatedField();
          }}
        />
      ) : (
        ''
      )}
    </InlineFieldRow>
  );
};
