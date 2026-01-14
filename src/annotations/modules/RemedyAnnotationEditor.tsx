import React from 'react';
import { AnnotationComponentProps } from 'annotations/types';
import {
  CodeEditor,
  Icon,
  InlineField,
  InlineFieldRow,
  InlineLabel,
  Input,
  Label,
  Tooltip,
  useTheme2,
} from '@grafana/ui';
import { InlineFieldWrapper } from 'modules/common/InlineFieldWrapper';
import { css } from '@emotion/css';

export function RemedyAnnotationEditor(props: AnnotationComponentProps) {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const theme = useTheme2();
  return (
    <>
      <div className="gf-form gf-form--grow">
        <InlineField>
          <InlineLabel width={14}>{'SQL Editor'}</InlineLabel>
        </InlineField>
        <div
          ref={editorRef}
          className={css`
            width: 100%;
            resize: vertical;
            overflow: auto;
            min-height: 100px;
            border-radius: ${theme.shape.borderRadius()};
            border: 1px solid ${theme.components.input.borderColor};
          `}
        >
          <CodeEditor
            value={props.annotation.query}
            language={'sql'}
            height={'100px'}
            showLineNumbers={true}
            showMiniMap={false}
            onBlur={(query) => {
              props.onAnnotationQueryChange({ query });
            }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', marginTop: '20px', marginBottom: '14px' }}>
        <Tooltip content={'Map columns from the above query'}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Label
              style={{ marginRight: '10px', fontSize: '14px' }}
              className={css`
                margin-bottom: 0;
              `}
            >
              Field Mappings
            </Label>
            <Icon name="info-circle" size="sm"></Icon>
          </div>
        </Tooltip>
      </div>
      <InlineFieldRow>
        <InlineFieldWrapper label="Time" labelTooltip={'Time in seconds(required)'} labelWidth={14}>
          <Input
            placeholder="required field"
            width={32}
            value={props.annotation.timeField || ''}
            onChange={(event) => {
              props.onAnnotationQueryChange({ timeField: event.currentTarget.value });
            }}
          />
        </InlineFieldWrapper>
        <InlineFieldWrapper
          label="Time End"
          labelTooltip={'Time in seconds for range annotation (optional)'}
          labelWidth={14}
        >
          <Input
            placeholder="required field"
            width={32}
            value={props.annotation.timeEndField || ''}
            onChange={(event) => {
              props.onAnnotationQueryChange({ timeEndField: event.currentTarget.value });
            }}
          />
        </InlineFieldWrapper>
      </InlineFieldRow>
      <InlineFieldRow>
        <InlineFieldWrapper label="Title" labelTooltip={'Annotation title(required)'} labelWidth={14}>
          <Input
            placeholder="required field"
            width={32}
            value={props.annotation.titleField || ''}
            onChange={(event) => {
              props.onAnnotationQueryChange({ titleField: event.currentTarget.value });
            }}
          />
        </InlineFieldWrapper>
        <InlineFieldWrapper label="Description" labelWidth={14}>
          <Input
            width={32}
            value={props.annotation.textField || ''}
            onChange={(event) => {
              props.onAnnotationQueryChange({ textField: event.currentTarget.value });
            }}
          />
        </InlineFieldWrapper>
      </InlineFieldRow>
      <InlineFieldRow>
        <InlineFieldWrapper label="Tags" labelTooltip={'comma seperated tags (optional)'} labelWidth={14}>
          <Input
            placeholder="tag-1,tag-2"
            width={32}
            value={props.annotation.tagsField || ''}
            onChange={(event) => {
              props.onAnnotationQueryChange({ tagsField: event.currentTarget.value });
            }}
          />
        </InlineFieldWrapper>
      </InlineFieldRow>
    </>
  );
}
