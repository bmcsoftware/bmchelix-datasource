import React from 'react';
import * as Constants from 'Constants';
import { AnnotationComponentProps } from 'annotations/types';
import { InlineField, InlineFieldRow, InlineLabel, Input, Label, QueryField, useTheme2 } from '@grafana/ui';
import { InlineFieldWrapper } from 'modules/common/InlineFieldWrapper';
import { css } from '@emotion/css';

type Props = AnnotationComponentProps & {
  type: string;
};
export function EventsLogsAnnotationEditor(props: Props) {
  const theme = useTheme2();
  return (
    <>
      {props.annotation.index && (
        <InlineFieldRow>
          <InlineFieldWrapper label="Index name" labelWidth={14}>
            <Input
              placeholder="events-*"
              width={32}
              value={props.annotation.index}
              onChange={(event) => {
                props.onAnnotationQueryChange({ index: event.currentTarget.value });
              }}
            />
          </InlineFieldWrapper>
        </InlineFieldRow>
      )}
      <div
        className={css`
          display: flex;
        `}
      >
        <InlineLabel width={14}>{'Query'}</InlineLabel>
        <div
          className={css`
            flex-grow: 1;
            margin: 0 ${theme.spacing(0.5)} ${theme.spacing(0.5)} 0;
          `}
        >
          <QueryField
            query={props.annotation.query || props.annotation.target?.query}
            onBlur={() => {}}
            onChange={(query) => {
              props.onAnnotationQueryChange({ query });
            }}
            placeholder="Lucene Query"
            portalOrigin="elasticsearch"
          />
        </div>
      </div>
      <div style={{ marginTop: '20px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Label
            style={{ marginRight: '10px', fontSize: '14px' }}
            className={css`
              margin-bottom: 0;
            `}
          >
            Field Mappings
          </Label>
        </div>
      </div>
      <InlineFieldRow>
        <InlineField label="Time End">
          <Input
            width={32}
            value={props.annotation.timeEndField || ''}
            onChange={(event) => {
              props.onAnnotationQueryChange({ timeEndField: event.currentTarget.value });
            }}
          />
        </InlineField>
        <InlineField label="Text">
          <Input
            width={32}
            value={props.annotation.textField || ''}
            onChange={(event) => {
              props.onAnnotationQueryChange({ textField: event.currentTarget.value });
            }}
          />
        </InlineField>
        <InlineField label="Tags">
          <Input
            placeholder="tags"
            width={32}
            value={props.annotation.tagsField || ''}
            onChange={(event) => {
              props.onAnnotationQueryChange({ tagsField: event.currentTarget.value });
            }}
          />
        </InlineField>
        {props.annotation.titleField && (
          <InlineField label="Title (deprecated)">
            <Input
              placeholder="desc"
              width={32}
              value={props.annotation.titleField || ''}
              onChange={(event) => {
                props.onAnnotationQueryChange({ titleField: event.currentTarget.value });
              }}
            />
          </InlineField>
        )}
        {props.type === Constants.SOURCE_TYPE_EVENT && (
          <InlineField label="Size">
            <Input
              type="number"
              width={32}
              value={props.annotation.sizeField || ''}
              onChange={(event) => {
                props.onAnnotationQueryChange({ sizeField: event.currentTarget.value });
              }}
            />
          </InlineField>
        )}
      </InlineFieldRow>
    </>
  );
}
