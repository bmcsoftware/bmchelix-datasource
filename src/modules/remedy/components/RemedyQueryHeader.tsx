import React, { MouseEvent, PureComponent, useCallback, useEffect, useMemo, useState } from 'react';
import { IconButton, InlineField, InlineFieldRow, InlineLabel, Input, Select } from '@grafana/ui';
import { BMCDataSourceQuery } from 'types';
import { useAutoCompleteContext } from '../../common/AutoCompleteContext';
import { HeaderList } from '../utilities/RemedyTypes';
import { getHeaderFunctions, getHeaderDataType, HeaderFunctions } from '../utilities/remedy_query_def';
import { InlineFieldWrapper } from 'modules/common/InlineFieldWrapper';
import { InlineIconButton } from 'modules/common/InlineIconButton';

// const { Input } = LegacyForms;

interface Props {
  target: BMCDataSourceQuery['sourceQuery'];
  onChange: Function;
}
export class RemedyQueryHeader extends PureComponent<Props, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      collapseHeader: true,
    };
  }

  removeRemedyHeader = (index: number) => {
    if (!this.props.target.header.hideHeader) {
      const headerListClone = [...this.props.target.header.headerList];
      headerListClone.splice(index, 1);
      this.props.onChange({ ...this.props.target.header, headerList: headerListClone }, true);
    }
  };

  addRemedyHeader = () => {
    if (!this.props.target.header.hideHeader) {
      const newHeader = new HeaderList(
        HeaderFunctions.DateFormat.text,
        HeaderFunctions.DateFormat.value,
        HeaderFunctions.DateFormat.collapseHeader,
        HeaderFunctions.DateFormat.dataType,
        HeaderFunctions.DateFormat.arType,
        HeaderFunctions.DateFormat.arKey
      );
      this.props.onChange(
        {
          ...this.props.target.header,
          headerList: [...this.props.target.header.headerList, newHeader],
        },
        true
      );
    }
  };

  updateHeader = (headerKey: string, val: any, runQuery: boolean, index: number) => {
    switch (headerKey) {
      case 'hideHeader':
        this.props.onChange(
          {
            ...this.props.target.header,
            [headerKey]: val,
          },
          runQuery
        );
        break;
      case 'headerList':
        const headerListClone = [...this.props.target.header.headerList];
        headerListClone[index] = val;
        this.props.onChange(
          {
            ...this.props.target.header,
            headerList: headerListClone,
          },
          runQuery
        );
        break;
    }
  };

  render() {
    return (
      <div>
        {this.props.target.header?.headerList?.length &&
          this.props.target.header.headerList.map((header: any, index: number) => {
            return (
              <QueryHeader
                header={header}
                keyIndex={index}
                key={index}
                headerListLength={this.props.target.header.headerList.length}
                collapseHeader={this.state.collapseHeader}
                hideHeader={this.props.target.header.hideHeader}
                updateHeader={this.updateHeader}
                toggleCollapseHeader={() => {
                  this.setState({ collapseHeader: !this.state.collapseHeader });
                }}
                removeRemedyHeader={this.removeRemedyHeader}
                addRemedyHeader={this.addRemedyHeader}
                guid={this.props.target.guid}
              />
            );
          })}
      </div>
    );
  }
}

const QueryHeader: React.FC<any> = ({
  header,
  keyIndex,
  headerListLength,
  collapseHeader,
  hideHeader,
  updateHeader,
  toggleCollapseHeader,
  removeRemedyHeader,
  addRemedyHeader,
  guid,
}) => {
  const isFirst = keyIndex === 0;
  const [inputValue, setInputValue] = useState<any>(header);
  const [selectionTypeOptions, setSelectionTypeOptions] = useState<any>();
  const [selectedSelectionType, setSelectedSelectionType] = useState<any>();
  const autoCompleteContext: any = useAutoCompleteContext();
  const initializeSelectionOptions = (text: string) => {
    switch (text) {
      case HeaderFunctions.Locale.text:
        setSelectionTypeOptions(autoCompleteContext.inputAutoComplete[guid].locale);
        setSelectedSelectionType(
          autoCompleteContext.inputAutoComplete[guid].locale.find((val: any) => val.value === inputValue.value)
        );
        break;
      case HeaderFunctions.Timezone.text:
        setSelectionTypeOptions(autoCompleteContext.inputAutoComplete[guid].timezone);
        setSelectedSelectionType(
          autoCompleteContext.inputAutoComplete[guid].timezone.find((val: any) => val.value === inputValue.value)
        );
        break;
    }
  };

  useEffect(() => {
    setInputValue(header);
  }, [header]);

  useEffect(() => {
    initializeSelectionOptions(inputValue.text);
  }, []);

  useEffect(() => {
    initializeSelectionOptions(inputValue.text);
  }, [inputValue.text, inputValue.value]);

  const headerFunctionOptions = getHeaderFunctions().map((item) => {
    return { label: item.text, value: item.arKey };
  });

  const selectedDataType = useMemo(() => {
    return headerFunctionOptions.find((val) => val.label === inputValue.text);
  }, [inputValue.text]);

  const changeHeaderType = useCallback(
    (selectedVal: any) => {
      const newHeader = getHeaderDataType(selectedVal.label);
      const newInputValue = {
        ...inputValue,
        text: selectedVal.label,
        value: newHeader.value,
        dataType: newHeader.dataType,
        arType: newHeader.arType,
        arKey: newHeader.arKey,
      };
      setInputValue(newInputValue);
      updateHeader('headerList', newInputValue, true, keyIndex);
    },
    [header]
  );

  return isFirst || !collapseHeader ? (
    <div className="query-header">
      <InlineFieldRow>
        <InlineFieldWrapper
          label="Header"
          labelWidth={16}
          labelChildren={
            <IconButton
              onClick={(e: MouseEvent) => {
                e.preventDefault();
                updateHeader('hideHeader', !hideHeader, true, 0);
              }}
              tooltip="Click to toggle show / hide header"
              tooltipPlacement="top"
              name={hideHeader ? 'eye-slash' : 'eye'}
              size="sm"
            />
          }
        ></InlineFieldWrapper>
        <InlineField disabled={hideHeader}>
          <Select
            className={'select-container'}
            isMulti={false}
            isClearable={false}
            backspaceRemovesValue={false}
            onChange={(selectedVal) => {
              changeHeaderType(selectedVal);
            }}
            options={headerFunctionOptions}
            isSearchable={true}
            value={selectedDataType}
            menuPlacement={'bottom'}
          />
        </InlineField>
        <InlineLabel className="gf-form-label query-keyword" width={'auto'}>
          {selectedDataType?.label}
        </InlineLabel>
        {inputValue.dataType === 'number' ? (
          <InlineField disabled={hideHeader}>
            <Input
              type="text"
              width={14}
              value={inputValue.value}
              onBlur={() => {
                updateHeader('headerList', inputValue, true, keyIndex);
              }}
              onChange={(e: any) => {
                setInputValue({
                  ...inputValue,
                  value: e.target.value,
                });
              }}
              placeholder="Add Number Values"
            />
          </InlineField>
        ) : (
          ''
        )}
        {inputValue.dataType === 'string' ? (
          <InlineField disabled={hideHeader}>
            <Input
              type="text"
              width={14}
              value={inputValue.value}
              onBlur={() => {
                updateHeader('headerList', inputValue, true, keyIndex);
              }}
              onChange={(e: any) => {
                setInputValue({
                  ...inputValue,
                  value: e.target.value,
                });
              }}
              placeholder="Add String Values"
            />
          </InlineField>
        ) : (
          ''
        )}
        {inputValue.dataType === 'selection' ? (
          <InlineField disabled={hideHeader}>
            <Select
              className={'select-container'}
              menuPlacement={'bottom'}
              options={selectionTypeOptions}
              onChange={(selectedVal) => {
                updateHeader('headerList', { ...inputValue, value: selectedVal.value }, true, keyIndex);
              }}
              value={selectedSelectionType}
            />
          </InlineField>
        ) : (
          ''
        )}
        <InlineLabel style={{ flexGrow: 1, width: 'auto' }}>{''}</InlineLabel>
        {isFirst ? (
          <InlineIconButton
            disabled={hideHeader}
            onClick={toggleCollapseHeader}
            iconName={collapseHeader ? 'angle-right' : 'angle-down'}
            size="sm"
            label={`(${headerListLength})`}
          />
        ) : (
          ''
        )}
        {headerListLength > 1 ? (
          <InlineIconButton
            disabled={hideHeader}
            onClick={() => {
              removeRemedyHeader(keyIndex);
            }}
            iconName="minus"
          />
        ) : (
          ''
        )}
        {isFirst ? <InlineIconButton disabled={hideHeader} onClick={addRemedyHeader} iconName="plus" /> : ''}
      </InlineFieldRow>
    </div>
  ) : null;
};
