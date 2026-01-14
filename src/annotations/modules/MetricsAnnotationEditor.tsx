import React from 'react';
import { AnnotationComponentProps } from 'annotations/types';
import { InlineField, InlineFieldRow, InlineLabel, InlineSwitch, Input, Label } from '@grafana/ui';
import { css } from '@emotion/css';
import { InlineFieldWrapper } from 'modules/common/InlineFieldWrapper';

export function MetricsAnnotationEditor(props: AnnotationComponentProps) {
  return (
    <>
      <div className="gf-form gf-form--grow">
        <InlineField>
          <InlineLabel width={28}>{'Search expression'}</InlineLabel>
        </InlineField>
        <Input
          placeholder="ALERTS"
          value={props.annotation.expr || ''}
          onChange={(event) => {
            props.onAnnotationQueryChange({ expr: event.currentTarget.value });
          }}
        />
      </div>
      <InlineFieldRow>
        <InlineField label="step" labelWidth={28}>
          <Input
            width={12}
            value={props.annotation.step || ''}
            onChange={(event) => {
              props.onAnnotationQueryChange({ step: event.currentTarget.value });
            }}
          />
        </InlineField>
      </InlineFieldRow>

      <div style={{ display: 'flex', marginTop: '20px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Label
            style={{ marginRight: '10px', fontSize: '14px' }}
            className={css`
              margin-bottom: 0;
            `}
          >
            Field formats
          </Label>
        </div>
      </div>
      <InlineFieldRow>
        <InlineField label="Title">
          <Input
            placeholder="alertname"
            width={20}
            value={props.annotation.titleFormat || ''}
            onChange={(event) => {
              props.onAnnotationQueryChange({ titleFormat: event.currentTarget.value });
            }}
          />
        </InlineField>
        <InlineField label="Tags">
          <Input
            placeholder="label1,label2"
            width={20}
            value={props.annotation.tagKeys || ''}
            onChange={(event) => {
              props.onAnnotationQueryChange({ tagKeys: event.currentTarget.value });
            }}
          />
        </InlineField>
        <InlineField label="Text">
          <Input
            placeholder="instance"
            width={20}
            value={props.annotation.textFormat || ''}
            onChange={(event) => {
              props.onAnnotationQueryChange({ textFormat: event.currentTarget.value });
            }}
          />
        </InlineField>
      </InlineFieldRow>
      <div style={{ display: 'flex', marginTop: '20px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Label
            style={{ marginRight: '10px', fontSize: '14px' }}
            className={css`
              margin-bottom: 0;
            `}
          >
            Other options
          </Label>
        </div>
      </div>
      <InlineFieldRow>
        <InlineFieldWrapper
          label="Series value as timestamp"
          labelTooltip={
            'The unit of timestamp is milliseconds. If the unit of the series value is seconds, multiply its range vector by 1000.'
          }
          labelWidth={28}
        >
          <InlineSwitch
            value={props.annotation.useValueForTime ?? false}
            onChange={() => {
              props.onAnnotationQueryChange({ useValueForTime: !props.annotation.useValueForTime });
            }}
          />
        </InlineFieldWrapper>
      </InlineFieldRow>
    </>
  );
}
