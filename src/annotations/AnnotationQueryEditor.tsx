import React, { useCallback, useMemo } from 'react';
import * as Constants from 'Constants';
import { QueryEditorProps, AnnotationQuery, DataQuery } from '@grafana/data';
import { InlineFieldRow, Select } from '@grafana/ui';
import { InlineFieldWrapper } from 'modules/common/InlineFieldWrapper';
import { allowedTypesForAnnotation, queryTypeOptions } from 'types';
import { RemedyAnnotationEditor } from './modules/RemedyAnnotationEditor';
import { EventsLogsAnnotationEditor } from './modules/EventsLogsAnnotationEditor';
import { MetricsAnnotationEditor } from './modules/MetricsAnnotationEditor';


type AnnotationQueryEditorProps<TQuery extends DataQuery> = QueryEditorProps<any, TQuery> & {
  annotation?: AnnotationQuery<TQuery>;
  onAnnotationChange?: (annotation: AnnotationQuery<TQuery>) => void;
};

export function AnnotationQueryEditor(props: AnnotationQueryEditorProps<any>) {
  const QueryTypeOptions = useMemo(() => {
    return queryTypeOptions.filter((i: any) => {
      return allowedTypesForAnnotation.includes(i.sourceType);
    });
  }, [queryTypeOptions]);
  const onAnnotationQueryChange = useCallback(
    (update: any) => {
      props.onAnnotationChange?.({ ...props.annotation, ...update });
    },
    [props.annotation, props.onAnnotationChange]
  );

  return (
    <div className="query-editor-row">
      <InlineFieldRow>
        <InlineFieldWrapper label="Query type" labelWidth={14}>
          <Select
            className="width-12"
            defaultValue={'Please Select'}
            value={props.annotation?.selectedType}
            options={QueryTypeOptions}
            onChange={(selectedVal) => {
              if (props.annotation?.selectedType !== selectedVal.sourceType) {
                onAnnotationQueryChange({ selectedType: selectedVal.sourceType });
              }
            }}
            maxMenuHeight={200}
            menuPlacement={'bottom'}
          />
        </InlineFieldWrapper>
      </InlineFieldRow>
      {props.annotation?.selectedType === Constants.SOURCE_TYPE_REMEDY && (
        <RemedyAnnotationEditor annotation={props.annotation!} onAnnotationQueryChange={onAnnotationQueryChange} />
      )}
      {props.annotation?.selectedType === Constants.SOURCE_TYPE_EVENT && (
        <EventsLogsAnnotationEditor
          annotation={props.annotation!}
          onAnnotationQueryChange={onAnnotationQueryChange}
          type={Constants.SOURCE_TYPE_EVENT}
        />
      )}
      {props.annotation?.selectedType === Constants.SOURCE_TYPE_LOG && (
        <EventsLogsAnnotationEditor
          annotation={props.annotation!}
          onAnnotationQueryChange={onAnnotationQueryChange}
          type={Constants.SOURCE_TYPE_LOG}
        />
      )}
      {props.annotation?.selectedType === Constants.SOURCE_TYPE_METRIC && (
        <MetricsAnnotationEditor annotation={props.annotation!} onAnnotationQueryChange={onAnnotationQueryChange} />
      )}
    </div>
  );
}
