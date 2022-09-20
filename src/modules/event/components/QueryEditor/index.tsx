import { css } from '@emotion/css';
import React from 'react';

import { getDefaultTimeRange, GrafanaTheme2, TimeRange } from '@grafana/data';
import { InlineField, InlineLabel, Input, QueryField, useStyles2 } from '@grafana/ui';

import { EventDatasource } from '../../../../query-modules/event/EventDatasource';
import { useNextId } from '../../hooks/useNextId';
import { useDispatch } from '../../hooks/useStatelessReducer';
import { ElasticsearchQuery } from '../../../../query-modules/event/eventTypes';

import { BucketAggregationsEditor } from './BucketAggregationsEditor';
import { ElasticsearchProvider } from './ElasticsearchQueryContext';
import { MetricAggregationsEditor } from './MetricAggregationsEditor';
import { metricAggregationConfig } from './MetricAggregationsEditor/utils';
import { changeAliasPattern, changeQuery } from './state';
import { useTypeahead, cleanText } from '../../hooks/useTypeahead';

export type ElasticQueryEditorProps = {
  query: ElasticsearchQuery;
  onQueryUpdate: Function;
  datasource: EventDatasource;
  range: TimeRange | undefined;
};

export const QueryEditor = ({ query, onQueryUpdate, datasource, range }: ElasticQueryEditorProps) => {
  const onChange = (query: ElasticsearchQuery) => {
    onQueryUpdate({ sourceQuery: query }, true);
  };
  return (
    <ElasticsearchProvider
      datasource={datasource}
      onChange={onChange}
      query={query}
      range={range || getDefaultTimeRange()}
    >
      <QueryEditorForm value={query} />
    </ElasticsearchProvider>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  root: css`
    display: flex;
  `,
  queryFieldWrapper: css`
    flex-grow: 1;
    margin: 0 ${theme.spacing(0.5)} ${theme.spacing(0.5)} 0;
  `,
});

interface Props {
  value: ElasticsearchQuery;
}

const QueryEditorForm = ({ value }: Props) => {
  const dispatch = useDispatch();
  const nextId = useNextId();
  const styles = useStyles2(getStyles);
  const { onTypeAhead } = useTypeahead();
  // To be considered a time series query, the last bucked aggregation must be a Date Histogram
  const isTimeSeriesQuery = value.bucketAggs?.slice(-1)[0]?.type === 'date_histogram';

  const showBucketAggregationsEditor = value.metrics?.every(
    (metric) => !metricAggregationConfig[metric.type].isSingleMetric
  );

  return (
    <>
      <div className={styles.root}>
        <InlineLabel width={17}>Query</InlineLabel>
        <div className={styles.queryFieldWrapper}>
          <QueryField
            query={value.query}
            // By default QueryField calls onChange if onBlur is not defined, this will trigger a rerender
            // And slate will claim the focus, making it impossible to leave the field.
            onBlur={() => {}}
            onChange={(query) => dispatch(changeQuery(query))}
            placeholder="Lucene Query"
            portalOrigin="elasticsearch"
            onTypeahead={onTypeAhead}
            cleanText={cleanText}
          />
        </div>
        <InlineField
          label="Alias"
          labelWidth={15}
          disabled={!isTimeSeriesQuery}
          tooltip="Aliasing only works for timeseries queries (when the last group is 'Date Histogram'). For all other query types this field is ignored."
        >
          <Input
            id={`ES-query-${value.refId}_alias`}
            placeholder="Alias Pattern"
            onBlur={(e) => dispatch(changeAliasPattern(e.currentTarget.value))}
            defaultValue={value.alias}
          />
        </InlineField>
      </div>

      <MetricAggregationsEditor nextId={nextId} />
      {showBucketAggregationsEditor && <BucketAggregationsEditor nextId={nextId} />}
    </>
  );
};
