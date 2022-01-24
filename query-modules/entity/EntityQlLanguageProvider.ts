import _ from 'lodash';

import { dateTime, LanguageProvider, HistoryItem } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { CompletionItem, TypeaheadOutput, TypeaheadInput } from '@grafana/ui';

import MetricQlSyntax, { FUNCTIONS, RATE_RANGES } from '../metric//MetricQl';

import { MetricEntityDatasource } from './MetricEntityDatasource';
import { EntityDataSourceQuery, MetricsMetadata } from './entityTypes';

import { BMCDataSource } from '../../DataSource';

const HISTORY_ITEM_COUNT = 5;
const HISTORY_COUNT_CUTOFF = 1000 * 60 * 60 * 24; // 24h
export const DEFAULT_LOOKUP_METRICS_THRESHOLD = 10000; // number of metrics defining an installation that's too big

const wrapLabel = (label: string): CompletionItem => ({ label });

const setFunctionKind = (suggestion: CompletionItem): CompletionItem => {
  suggestion.kind = 'function';
  return suggestion;
};

export function addHistoryMetadata(item: CompletionItem, history: any[]): CompletionItem {
  const cutoffTs = Date.now() - HISTORY_COUNT_CUTOFF;
  const historyForItem = history.filter(h => h.ts > cutoffTs && h.query === item.label);
  const count = historyForItem.length;
  const recent = historyForItem[0];
  let hint = `Queried ${count} times in the last 24h.`;

  if (recent) {
    const lastQueried = dateTime(recent.ts).fromNow();
    hint = `${hint} Last queried ${lastQueried}.`;
  }

  return {
    ...item,
    documentation: hint,
  };
}

function addMetricsMetadata(metric: string, metadata?: MetricsMetadata): CompletionItem {
  const item: CompletionItem = { label: metric };
  if (metadata && metadata[metric]) {
    const { type, help } = metadata[metric][0];
    item.documentation = `${type.toUpperCase()}: ${help}`;
  }
  return item;
}

const PREFIX_DELIMITER_REGEX = /(="|!="|=~"|!~"|\{|\[|\(|\+|-|\/|\*|%|\^|\band\b|\bor\b|\bunless\b|==|>=|!=|<=|>|<|=|~|,)/;

export default class EntityQlLanguageProvider extends LanguageProvider {
  histogramMetrics: string[];
  timeRange?: { start: number; end: number };
  metrics: string[];
  metricsMetadata?: MetricsMetadata;
  // startTask: Promise<any>;
  datasource: MetricEntityDatasource;
  lookupMetricsThreshold: number;
  lookupsDisabled: boolean; // Dynamically set to true for big/slow instances

  /**
   *  Cache for labels of series. This is bit simplistic in the sense that it just counts responses each as a 1 and does
   *  not account for different size of a response. If that is needed a `length` function can be added in the options.
   *  10 as a max size is totally arbitrary right now.
   */

  constructor(datasource: MetricEntityDatasource, initialValues?: Partial<EntityQlLanguageProvider>) {
    super();

    this.datasource = datasource;
    this.histogramMetrics = [];
    this.timeRange = { start: 0, end: 0 };
    this.metrics = [];
    // Disable lookups until we know the instance is small enough
    this.lookupMetricsThreshold = DEFAULT_LOOKUP_METRICS_THRESHOLD;
    this.lookupsDisabled = true;

    Object.assign(this, initialValues);
  }

  // Strip syntax chars so that typeahead suggestions can work on clean inputs
  cleanText(s: string) {
    const parts = s.split(PREFIX_DELIMITER_REGEX);
    const last: string | undefined = parts.pop();
    if (last) {
      return last
        .trimLeft()
        .replace(/"$/, '')
        .replace(/^"/, '');
    } else {
      return '';
    }
  }

  get syntax() {
    return MetricQlSyntax;
  }

  request = async (url: string, defaultValue: any): Promise<any> => {
    try {
      const res = await this.metadataRequest('GET', url);
      const body = await (res.data || res.json());

      return body.data;
    } catch (error) {
      console.error(error);
    }

    return defaultValue;
  };

  private metadataRequest(method: string, url: string, data?: undefined) {
    const options: any = {
      url: this.datasource.entityUrl + '/' + url,
      method: method,
      data: data,
      headers: { Authorization: '' },
    };

    let imsJWTToken: string = BMCDataSource.tokenObj.adeJWTToken;

    if (imsJWTToken !== undefined) {
      options.headers['Authorization'] = 'Bearer ' + imsJWTToken;
    }

    // if (this.basicAuth || this.withCredentials) {
    //   options.withCredentials = true;
    // }
    // if (this.basicAuth) {
    //   options.headers = {
    //     Authorization: this.basicAuth,
    //   };
    // }

    return getBackendSrv().datasourceRequest(options);
  }

  start = async (): Promise<any[]> => {
    if (this.datasource.lookupsDisabled) {
      return [];
    }

    return [];
  };

  provideCompletionItems = async (
    { prefix, text, value, labelKey, wrapperClasses }: TypeaheadInput,
    context: { history: Array<HistoryItem<EntityDataSourceQuery>> } = { history: [] }
  ): Promise<TypeaheadOutput> => {
    // Local text properties
    let empty: any;
    let selectedLines: any;
    let currentLine: any;

    let nextCharacter: any;
    if (value) {
      empty = value.document.text.length === 0;
      selectedLines = value.document.getTextsAtRange(value.selection);
      currentLine = selectedLines.size === 1 ? selectedLines.first().getText() : null;

      nextCharacter = currentLine ? currentLine[value.selection.anchor.offset] : null;
    }

    // Syntax spans have 3 classes by default. More indicate a recognized token
    const tokenRecognized = wrapperClasses.length > 3;
    // Non-empty prefix, but not inside known token
    const prefixUnrecognized = prefix && !tokenRecognized;

    // Prevent suggestions in `function(|suffix)`
    const noSuffix = !nextCharacter || nextCharacter === ')';

    // Prefix is safe if it does not immediately follow a complete expression and has no text after it
    const safePrefix = prefix && !text.match(/^[\]})\s]+$/) && noSuffix;

    // About to type next operand if preceded by binary operator
    const operatorsPattern = /[+\-*/^%]/;
    const isNextOperand = text.match(operatorsPattern);

    // Determine candidates by CSS context
    if (wrapperClasses.includes('context-range')) {
      // Suggestions for metric[|]
      return this.getRangeCompletionItems();
    } else if (wrapperClasses.includes('context-labels')) {
      // Suggestions for metric{|} and metric{foo=|}, as well as metric-independent label queries like {|}
      // return this.getLabelCompletionItems({ prefix, text, value, labelKey, wrapperClasses });
    } else if (wrapperClasses.includes('context-aggregation') && value) {
      // Suggestions for sum(metric) by (|)
      // return this.getAggregationCompletionItems(value);
    } else if (empty) {
      // Suggestions for empty query field
      return this.getEmptyCompletionItems(context);
    } else if (prefixUnrecognized && noSuffix && !isNextOperand) {
      // Show term suggestions in a couple of scenarios
      return this.getBeginningCompletionItems(context);
    } else if (prefixUnrecognized && safePrefix) {
      // Show term suggestions in a couple of scenarios
      return this.getTermCompletionItems();
    }

    return {
      suggestions: [],
    };
  };

  getBeginningCompletionItems = (context: { history: Array<HistoryItem<EntityDataSourceQuery>> }): TypeaheadOutput => {
    return {
      suggestions: [...this.getEmptyCompletionItems(context).suggestions, ...this.getTermCompletionItems().suggestions],
    };
  };

  getEmptyCompletionItems = (context: { history: Array<HistoryItem<EntityDataSourceQuery>> }): TypeaheadOutput => {
    const { history } = context;
    const suggestions = [];

    if (history && history.length) {
      const historyItems = _.chain(history)
        .map(h => h.query.sourceQuery.expr)
        .filter()
        .uniq()
        .take(HISTORY_ITEM_COUNT)
        .map(wrapLabel)
        .map(item => addHistoryMetadata(item, history))
        .value();

      suggestions.push({
        prefixMatch: true,
        skipSort: true,
        label: 'History',
        items: historyItems,
      });
    }

    return { suggestions };
  };

  getTermCompletionItems = (): TypeaheadOutput => {
    const { metrics, metricsMetadata } = this;
    const suggestions = [];

    suggestions.push({
      prefixMatch: true,
      label: 'Functions',
      items: FUNCTIONS.map(setFunctionKind),
    });

    if (metrics && metrics.length) {
      suggestions.push({
        label: 'Metrics',
        items: metrics.map(m => addMetricsMetadata(m, metricsMetadata)),
      });
    }

    return { suggestions };
  };

  getRangeCompletionItems(): TypeaheadOutput {
    return {
      context: 'context-range',
      suggestions: [
        {
          label: 'Range vector',
          items: [...RATE_RANGES],
        },
      ],
    };
  }

  roundToMinutes(seconds: number): number {
    return Math.floor(seconds / 60);
  }

  /**
   * Fetch labels for a series. This is cached by it's args but also by the global timeRange currently selected as
   * they can change over requested time.
   * @param name
   * @param withName
   */
 
}
