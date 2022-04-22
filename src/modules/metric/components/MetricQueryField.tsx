import _ from 'lodash';
import React, { ReactNode } from 'react';

import { Plugin } from 'slate';
import {
  CascaderOption,
  SlatePrism,
  Icon,
  BracesPlugin,
  DOMUtil,
  SuggestionsState,
  TypeaheadOutput,
  TypeaheadInput,
  QueryField,
} from '@grafana/ui';

import { LanguageMap, languages as prismLanguages } from 'prismjs';

// dom also includes Element polyfills
import { MetricsMetadata, MetricDataSourceQuery, MetricQuery } from '../utilities/metricTypes';
import { CancelablePromise, makePromiseCancelable } from '../utilities/CancelablePromise';
import { QueryEditorProps, QueryHint, HistoryItem } from '@grafana/data';
import { MetricDatasource } from '../../../query-modules/metric/MetricDatasource';
import { BMCDataSourceOptions } from 'types';
import { PrometheusMetricsBrowser } from './PrometheusMetricsBrowser';
import { LocalStorageValueProvider } from '../utilities/LocalStorageValueProvider';

const HISTOGRAM_GROUP = '__histograms__';
export const RECORDING_RULES_GROUP = '__recording_rules__';
const LAST_USED_LABELS_KEY = 'grafana.datasources.prometheus.browser.labels';

function getChooserText(metricsLookupDisabled: boolean, hasSyntax: boolean, hasMetrics: boolean) {
  if (metricsLookupDisabled) {
    return '(Disabled)';
  }

  if (!hasSyntax) {
    return 'Loading metrics...';
  }

  if (!hasMetrics) {
    return '(No metrics found)';
  }

  return 'Metrics browser';
}

function addMetricsMetadata(metric: string, metadata?: MetricsMetadata): CascaderOption {
  const option: CascaderOption = { label: metric, value: metric };
  if (metadata && metadata[metric]) {
    const { type = '', help } = metadata[metric];
    option.title = [metric, type.toUpperCase(), help].join('\n');
  }
  return option;
}

export function groupMetricsByPrefix(metrics: string[], metadata?: MetricsMetadata): CascaderOption[] {
  // Filter out recording rules and insert as first option
  const ruleRegex = /:\w+:/;
  const ruleNames = metrics.filter((metric) => ruleRegex.test(metric));
  const rulesOption = {
    label: 'Recording rules',
    value: RECORDING_RULES_GROUP,
    children: ruleNames
      .slice()
      .sort()
      .map((name) => ({ label: name, value: name })),
  };

  const options = ruleNames.length > 0 ? [rulesOption] : [];

  const delimiter = '_';
  const metricsOptions = _.chain(metrics)
    .filter((metric: string) => !ruleRegex.test(metric))
    .groupBy((metric: string) => metric.split(delimiter)[0])
    .map((metricsForPrefix: string[], prefix: string): CascaderOption => {
      const prefixIsMetric = metricsForPrefix.length === 1 && metricsForPrefix[0] === prefix;
      const children = prefixIsMetric ? [] : metricsForPrefix.sort().map((m) => addMetricsMetadata(m, metadata));
      return {
        children,
        label: prefix,
        value: prefix,
      };
    })
    .sortBy('label')
    .value();

  return [...options, ...metricsOptions];
}

export function willApplySuggestion(suggestion: string, { typeaheadContext, typeaheadText }: SuggestionsState): string {
  // Modify suggestion based on context
  switch (typeaheadContext) {
    case 'context-labels': {
      const nextChar = DOMUtil.getNextCharacter();
      if (!nextChar || nextChar === '}' || nextChar === ',') {
        suggestion += '=';
      }
      break;
    }

    case 'context-label-values': {
      // Always add quotes and remove existing ones instead
      if (!typeaheadText.match(/^(!?=~?"|")/)) {
        suggestion = `"${suggestion}`;
      }
      if (DOMUtil.getNextCharacter() !== '"') {
        suggestion = `${suggestion}"`;
      }
      break;
    }

    default:
  }
  return suggestion;
}

interface MetricQueryFieldProps
  extends QueryEditorProps<MetricDatasource, MetricDataSourceQuery, BMCDataSourceOptions> {
  history: Array<HistoryItem<MetricDataSourceQuery>>;
  ExtraFieldElement?: ReactNode;
  'data-testid'?: string;
}

interface MetricQueryFieldState {
  labelBrowserVisible: boolean;
  syntaxLoaded: boolean;
  hint: QueryHint | null;
}

class MetricQueryField extends React.PureComponent<MetricQueryFieldProps, MetricQueryFieldState> {
  plugins: Plugin[];
  languageProviderInitializationPromise!: CancelablePromise<any>;

  constructor(props: MetricQueryFieldProps, context: React.Context<any>) {
    super(props, context);

    this.plugins = [
      BracesPlugin(),
      SlatePrism(
        {
          onlyIn: (node: any) => node.type === 'code_block',
          getSyntax: (node: any) => 'promql',
        },
        { ...(prismLanguages as LanguageMap), promql: this.props.datasource.languageProvider.syntax }
      ),
    ];

    this.state = {
      labelBrowserVisible: false,
      syntaxLoaded: false,
      hint: null,
    };
  }

  componentDidMount() {
    if (this.props.datasource.languageProvider) {
      this.refreshMetrics();
    }
    // this.refreshHint();
  }

  componentWillUnmount() {
    if (this.languageProviderInitializationPromise) {
      this.languageProviderInitializationPromise.cancel();
    }
  }

  componentDidUpdate(prevProps: MetricQueryFieldProps) {
    const {
      datasource: { languageProvider },
    } = this.props;

    if (languageProvider !== prevProps.datasource.languageProvider) {
      // We reset this only on DS change so we do not flesh loading state on every rangeChange which happens on every
      // query run if using relative range.
      this.setState({
        syntaxLoaded: false,
      });
      this.refreshMetrics();
    }

    // if (data && prevProps.data && prevProps.data.series !== data.series) {
    //   this.refreshHint();
    // }
  }

  // refreshHint = () => {
  //   const { datasource, query, data } = this.props;

  //   if (!data || data.series.length === 0) {
  //     this.setState({ hint: null });
  //     return;
  //   }

  //   const result = isDataFrame(data.series[0]) ? data.series.map(toLegacyResponseData) : data.series;
  //   const hints = datasource.getQueryHints(query, result);
  //   const hint = hints && hints.length > 0 ? hints[0] : null;
  //   this.setState({ hint });
  // };

  refreshMetrics = async () => {
    const {
      datasource: { languageProvider },
    } = this.props;

    // Prism.languages[PRISM_SYNTAX] = languageProvider.syntax;
    this.languageProviderInitializationPromise = makePromiseCancelable(languageProvider.start());

    try {
      const remainingTasks = await this.languageProviderInitializationPromise.promise;
      await Promise.all(remainingTasks);
      this.onUpdateLanguage();
    } catch (err: any) {
      if (!err?.isCanceled) {
        throw err;
      }
    }
  };

  onChangeMetrics = (values: string[], selectedOptions: CascaderOption[]) => {
    let query;
    if (selectedOptions.length === 1) {
      const selectedOption = selectedOptions[0];
      if (!selectedOption.children || selectedOption.children.length === 0) {
        query = selectedOption.value;
      } else {
        // Ignore click on group
        return;
      }
    } else {
      const prefix = selectedOptions[0].value;
      const metric = selectedOptions[1].value;
      if (prefix === HISTOGRAM_GROUP) {
        query = `histogram_quantile(0.95, sum(rate(${metric}[5m])) by (le))`;
      } else {
        query = metric;
      }
    }
    this.onChangeQuery(query, true);
  };

  /**
   * TODO #33976: Remove this, add histogram group (query = `histogram_quantile(0.95, sum(rate(${metric}[5m])) by (le))`;)
   */
  onChangeLabelBrowser = (selector: string) => {
    this.onChangeQuery(selector, true);
    this.setState({ labelBrowserVisible: false });
  };

  onChangeQuery = (value: string, override?: boolean) => {
    // Send text change to parent
    const { query, onChange, onRunQuery } = this.props;
    let sourceQuery = query.sourceQuery as MetricQuery;
    sourceQuery.expr = value;
    if (onChange) {
      const nextQuery: MetricDataSourceQuery = { ...query, sourceQuery };
      onChange(nextQuery);

      if (override && onRunQuery) {
        onRunQuery();
      }
    }
  };

  onClickChooserButton = () => {
    this.setState((state) => ({ labelBrowserVisible: !state.labelBrowserVisible }));
  };
  // onClickHintFix = () => {
  //   const { datasource, query, onChange, onRunQuery } = this.props;
  //   const { hint } = this.state;

  //   onChange(datasource.modifyQuery(query, hint.fix.action));
  //   onRunQuery();
  // };

  onUpdateLanguage = () => {
    const {
      datasource: { languageProvider },
    } = this.props;
    const { metrics } = languageProvider;

    if (!metrics) {
      return;
    }

    this.setState({ syntaxLoaded: true });
  };

  onTypeahead = async (typeahead: TypeaheadInput): Promise<TypeaheadOutput> => {
    const {
      datasource: { languageProvider },
    } = this.props;

    if (!languageProvider) {
      return { suggestions: [] };
    }

    const { history } = this.props;
    const { prefix, text, value, wrapperClasses, labelKey } = typeahead;

    const result = await languageProvider.provideCompletionItems(
      { text, value, prefix, wrapperClasses, labelKey },
      { history }
    );

    return result;
  };

  render() {
    const {
      datasource,
      datasource: { languageProvider },
      query,
      ExtraFieldElement,
    } = this.props;
    const { labelBrowserVisible, syntaxLoaded } = this.state;
    const hasMetrics = languageProvider.metrics.length > 0;
    const chooserText = getChooserText(datasource.lookupsDisabled, syntaxLoaded, hasMetrics);
    const buttonDisabled = !(syntaxLoaded && hasMetrics);
    const cleanText = languageProvider ? languageProvider.cleanText : undefined;

    return (
      <LocalStorageValueProvider<string[]> storageKey={LAST_USED_LABELS_KEY} defaultValue={[]}>
        {(lastUsedLabels: any, onLastUsedLabelsSave: any, onLastUsedLabelsDelete: any) => {
          return (
            <>
              <div
                className="gf-form-inline gf-form-inline--xs-view-flex-column flex-grow-1"
                data-testid={this.props['data-testid']}
              >
                <button
                  className="gf-form-label query-keyword pointer"
                  onClick={this.onClickChooserButton}
                  disabled={buttonDisabled}
                >
                  {chooserText}
                  <Icon name={labelBrowserVisible ? 'angle-down' : 'angle-right'} />
                </button>

                <div className="gf-form gf-form--grow flex-shrink-1 min-width-15">
                  <QueryField
                    additionalPlugins={this.plugins}
                    cleanText={cleanText}
                    query={query.sourceQuery.expr}
                    onTypeahead={this.onTypeahead}
                    onWillApplySuggestion={willApplySuggestion}
                    onBlur={this.props.onBlur}
                    onChange={this.onChangeQuery}
                    onRunQuery={this.props.onRunQuery}
                    placeholder="Enter a Metric query (run with Shift+Enter)"
                    portalOrigin="prometheus"
                    syntaxLoaded={syntaxLoaded}
                  />
                </div>
              </div>
              {labelBrowserVisible && (
                <div className="gf-form">
                  <PrometheusMetricsBrowser
                    languageProvider={languageProvider}
                    onChange={this.onChangeLabelBrowser}
                    lastUsedLabels={lastUsedLabels || []}
                    storeLastUsedLabels={onLastUsedLabelsSave}
                    deleteLastUsedLabels={onLastUsedLabelsDelete}
                  />
                </div>
              )}

              {ExtraFieldElement}
              {/* {hint ? (
                  <div className="query-row-break">
                    <div className="prom-query-field-info text-warning">
                      {hint.label}{' '}
                      {hint.fix ? (
                        <a className="text-link muted" onClick={this.onClickHintFix}>
                          {hint.fix.label}
                        </a>
                      ) : null}
                    </div>
                  </div>
                ) : null} */}
            </>
          );
        }}
      </LocalStorageValueProvider>
    );
  }
}

export default MetricQueryField;
