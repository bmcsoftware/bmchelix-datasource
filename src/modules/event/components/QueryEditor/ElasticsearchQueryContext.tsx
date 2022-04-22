import React, { Context, createContext, PropsWithChildren, useCallback, useContext } from 'react';
import { EventDatasource } from '../../../../query-modules/event/EventDatasource';
import { ElasticsearchQuery } from '../../../../query-modules/event/eventTypes';
import { combineReducers, useStatelessReducer, DispatchContext } from '../../hooks/useStatelessReducer';

import { reducer as metricsReducer } from './MetricAggregationsEditor/state/reducer';
import { createReducer as createBucketAggsReducer } from './BucketAggregationsEditor/state/reducer';
import { aliasPatternReducer, queryReducer, initQuery } from './state';
import { TimeRange } from '@grafana/data';

const DatasourceContext = createContext<EventDatasource | undefined>(undefined);
const QueryContext = createContext<ElasticsearchQuery | undefined>(undefined);
const RangeContext = createContext<TimeRange | undefined>(undefined);

interface Props {
  query: ElasticsearchQuery;
  onChange: (query: ElasticsearchQuery) => void;
  datasource: EventDatasource;
  range: TimeRange;
}

export const ElasticsearchProvider = ({ children, onChange, query, datasource, range }: PropsWithChildren<Props>) => {
  const onStateChange = useCallback(
    (query: ElasticsearchQuery) => {
      onChange(query);
    },
    [onChange]
  );

  const reducer = combineReducers<Pick<ElasticsearchQuery, 'query' | 'alias' | 'metrics' | 'bucketAggs'>>({
    query: queryReducer,
    alias: aliasPatternReducer,
    metrics: metricsReducer,
    bucketAggs: createBucketAggsReducer(datasource.timeField),
  });

  const dispatch = useStatelessReducer(
    // timeField is part of the query model, but its value is always set to be the one from datasource settings.
    (newState) => onStateChange({ ...query, ...newState, timeField: datasource.timeField }),
    query,
    reducer
  );

  // This initializes the query by dispatching an init action to each reducer.
  // useStatelessReducer will then call `onChange` with the newly generated query
  React.useEffect(() => {
    if (!query.metrics || !query.bucketAggs || query.query === undefined) {
      dispatch(initQuery());
    }
  }, []);

  return !(!query.metrics || !query.bucketAggs || query.query === undefined) ? (
    <DatasourceContext.Provider value={datasource}>
      <QueryContext.Provider value={query}>
        <RangeContext.Provider value={range}>
          <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
        </RangeContext.Provider>
      </QueryContext.Provider>
    </DatasourceContext.Provider>
  ) : null;
};

interface GetHook {
  <T>(context: Context<T>): () => NonNullable<T>;
}

const getHook: GetHook = (c) => () => {
  const contextValue = useContext(c);

  if (!contextValue) {
    throw new Error('use ElasticsearchProvider first.');
  }

  return contextValue as NonNullable<typeof contextValue>;
};

export const useQuery = getHook(QueryContext);
export const useDatasource = getHook(DatasourceContext);
export const useRange = getHook(RangeContext);
