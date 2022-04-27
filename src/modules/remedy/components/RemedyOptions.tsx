import React, { useMemo, useState } from 'react';
import { InlineFieldRow, InlineLabel, Switch, Input, Select } from '@grafana/ui';
import { dstType } from '../utilities/remedy_query_def';
import { InlineFieldWrapper } from 'modules/common/InlineFieldWrapper';

export const RemedyOptions: React.FC<any> = ({ target, onChange, showHelp, toggleShowHelp }) => {
  const [maxEntries, setMaxEntries] = useState<any>(target.form.maxEntries);
  const selectedDstType = useMemo(() => {
    return dstType.find((i: any) => i.value === target.form.dstType);
  }, [target.form.dstType]);
  return (
    <InlineFieldRow>
      <InlineFieldWrapper label="Option" labelWidth={16}></InlineFieldWrapper>
      <InlineFieldWrapper label="Use Distinct" labelWidth={'auto'}>
        <Switch
          onClick={() => {
            onChange(
              {
                useDistinct: !target.form.useDistinct,
              },
              true
            );
          }}
          value={target.form.useDistinct}
        />
      </InlineFieldWrapper>
      <InlineFieldWrapper label="Fetch Entries" labelWidth={'auto'}>
        <Input
          type="text"
          className={'max-width-4'}
          value={maxEntries}
          onBlur={() => {
            onChange(
              {
                maxEntries:
                  !+maxEntries ||
                  !Number.isInteger(+maxEntries) ||
                  maxEntries < 0 ||
                  maxEntries > Number.MAX_SAFE_INTEGER
                    ? 100
                    : maxEntries,
              },
              true
            );
          }}
          onChange={(e: any) => {
            setMaxEntries(e.target.value);
          }}
          placeholder="0-2000"
        />
      </InlineFieldWrapper>
      <InlineFieldWrapper labelWidth={'auto'} label="Manage DST">
        <Select
          className={'select-container'}
          options={dstType}
          defaultValue={dstType[0]}
          value={selectedDstType}
          onChange={(selectedVal) => {
            onChange(
              {
                dstType: selectedVal.value,
              },
              true
            );
          }}
        />
      </InlineFieldWrapper>
      <InlineFieldWrapper
        label="Sync SQL"
        labelWidth={'auto'}
        labelTooltip={'Enable Sync and move to edit generated SQL'}
      >
        <Switch
          onClick={() => {
            onChange(
              {
                meta: {
                  ...target.form.meta,
                  syncToSql: !target.form.meta.syncToSql,
                },
              },
              true
            );
          }}
          value={target.form.meta.syncToSql}
        />
      </InlineFieldWrapper>
      <InlineFieldWrapper label="Show Query" labelWidth={'auto'} labelTooltip={'Enable to view SQL'}>
        <Switch
          onClick={() => {
            onChange(
              {
                meta: {
                  ...target.form.meta,
                  hideSql: !target.form.meta.hideSql,
                },
              },
              true
            );
          }}
          value={target.form.meta.hideSql}
        />
      </InlineFieldWrapper>
      <InlineFieldWrapper label="Show Help" labelWidth={'auto'} labelTooltip={'Show Help'}>
        <Switch onClick={toggleShowHelp} value={showHelp} />
      </InlineFieldWrapper>
      <InlineLabel style={{ flexGrow: 1, width: 'auto' }}>{''}</InlineLabel>
    </InlineFieldRow>
  );
};
