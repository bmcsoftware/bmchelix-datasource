import React from 'react';
import _ from 'lodash';
import { SelectableValue } from '@grafana/data';
import { InlineFormLabel, LegacyForms } from '@grafana/ui';
import { MetricQuery, MetricDataSourceQuery } from './metricTypes';
import MetricQueryField from './MetricQueryField';
import { MetricDatasource } from './MetricDatasource';
import { getFeatureStatus } from 'QueryCtrl';
import * as Constants from 'Constants';

const { Switch } = LegacyForms;

interface Props {
  target: any;
  datasource: MetricDatasource;
  queryctrl: any;
}

const SOURCE_OPTIONS: Array<SelectableValue<string>> = [
  { label: 'Monitor', value: 'Monitor' },
  { label: 'Optimize', value: 'Optimize' },
];

const FORMAT_OPTIONS: Array<SelectableValue<string>> = [
  { label: 'Time series', value: 'time_series' },
  { label: 'Table', value: 'table' },
  { label: 'Heatmap', value: 'heatmap' },
];

const INTERVAL_FACTOR_OPTIONS: Array<SelectableValue<number>> = _.map([1, 2, 3, 4, 5, 10], (value: number) => ({
  value,
  label: '1/' + value,
}));

interface State {
  legendFormat: any;
  formatOption: SelectableValue<string>;
  sourceOption: any;
  interval: any;
  intervalFactorOption: SelectableValue<number>;
  instant: boolean;
}

export class MetricQueryEditor extends React.Component<Props, State> {
  query: MetricDataSourceQuery;

  constructor(props: Props) {
    super(props);
    const defaultQuery: Partial<MetricQuery> = {
      expr: '',
      legendFormat: '',
      interval: '',
      source: SOURCE_OPTIONS[0].value,
    };
    const query = Object.assign({}, defaultQuery, props.target.sourceQuery);
    this.query = { sourceQuery: query, sourceType: props.target.sourceType, refId: props.target.refId };

    this.state = {
      // Fully controlled text inputs
      interval: query.interval,
      legendFormat: query.legendFormat,
      // Select options
      formatOption: FORMAT_OPTIONS.find(option => option.value === query.format) || FORMAT_OPTIONS[0],
      sourceOption: query.source,
      intervalFactorOption:
        INTERVAL_FACTOR_OPTIONS.find(option => option.value === query.intervalFactor) || INTERVAL_FACTOR_OPTIONS[0],
      // Switch options
      instant: Boolean(query.instant),
    };
  }

  onFieldChange = (query: MetricDataSourceQuery, override?: any) => {
    this.query.sourceQuery.expr = query.sourceQuery.expr;
  };

  onFormatChange = (option: SelectableValue<string>) => {
    this.query.sourceQuery.format = option.currentTarget.value;
    this.setState({ formatOption: option.currentTarget.value }, this.onRunQuery);
  };

  onSourceChange = (e: SelectableValue<string>) => {
    const sourceOption = e.currentTarget.value;
    this.query.sourceQuery.source = e.currentTarget.value;
    this.setState({ sourceOption }, this.onRunQuery);
  };

  onInstantChange = (e: React.SyntheticEvent<HTMLInputElement, Event>) => {
    const instant = e.currentTarget.checked;
    this.query.sourceQuery.instant = instant;
    this.setState({ instant }, this.onRunQuery);
  };

  onIntervalChange = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const interval = e.currentTarget.value;
    this.query.sourceQuery.interval = interval;
    this.setState({ interval });
  };

  onIntervalFactorChange = (option: SelectableValue<number>) => {
    this.query.sourceQuery.intervalFactor = option.currentTarget.value;
    this.setState({ intervalFactorOption: option.currentTarget.value }, this.onRunQuery);
  };

  onLegendChange = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const legendFormat = e.currentTarget.value;
    this.query.sourceQuery.legendFormat = legendFormat;
    this.setState({ legendFormat });
  };

  onRunQuery = () => {
    this.props.target.sourceQuery = this.query.sourceQuery;
    this.props.queryctrl.refresh();
    this.setState({});
  };

  render() {
    const datasource = this.props.datasource;
    const query = this.query;
    const { sourceOption, formatOption, interval, intervalFactorOption, legendFormat, instant } = this.state;

    return (
      <div>
        {getFeatureStatus(Constants.OPTIMIZE_SELECTION) ? (
          <div className="gf-form">
            <div className="gf-form-label width-7 query-keyword">Source</div>
            <select className="gf-form-input width-10" required onChange={this.onSourceChange} value={sourceOption}>
              {SOURCE_OPTIONS.map(({ value, label }, i) => (
                <option key={i} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <MetricQueryField
          datasource={datasource}
          query={query}
          onRunQuery={this.onRunQuery}
          onChange={this.onFieldChange}
          history={[]}
        />

        <div className="gf-form-inline">
          <div className="gf-form">
            <InlineFormLabel
              className="query-keyword"
              width={7}
              tooltip="Controls the name of the time series, using name or pattern. For example
        {{hostname}} will be replaced with label value for the label hostname."
            >
              Legend
            </InlineFormLabel>
            <input
              type="text"
              className="gf-form-input"
              placeholder="legend format"
              value={legendFormat}
              onChange={this.onLegendChange}
              onBlur={this.onRunQuery}
            />
          </div>

          <div className="gf-form">
            <InlineFormLabel
              className="query-keyword"
              width={7}
              tooltip={
                <>
                  An additional lower limit for the step parameter of the Prometheus query and for the{' '}
                  <code>$__interval</code> variable. The limit is absolute and not modified by the "Resolution" setting.
                </>
              }
            >
              Min step
            </InlineFormLabel>
            <input
              type="text"
              className="gf-form-input width-8"
              placeholder={interval}
              onChange={this.onIntervalChange}
              onBlur={this.onRunQuery}
              value={interval}
            />
          </div>

          <div className="gf-form">
            <div className="gf-form-label query-keyword">Resolution</div>
            <select
              className="gf-form-input gf-size-auto"
              value={intervalFactorOption as any}
              onChange={this.onIntervalFactorChange}
            >
              {INTERVAL_FACTOR_OPTIONS.map((option, idx) => {
                return (
                  <option key={idx} value={option.value}>
                    {option.label}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="gf-form">
            <div className="gf-form-label width-7 query-keyword">Format</div>
            <select className="gf-form-input gf-size-auto" value={formatOption as any} onChange={this.onFormatChange}>
              {FORMAT_OPTIONS.map((option, idx) => {
                return (
                  <option key={idx} value={option.value}>
                    {option.label}
                  </option>
                );
              })}
            </select>
            <Switch className="query-keyword" label="Instant" checked={instant} onChange={this.onInstantChange} />
          </div>
        </div>
      </div>
    );
  }
}
