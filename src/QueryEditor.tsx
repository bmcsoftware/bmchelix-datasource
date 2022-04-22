import defaults from 'lodash/defaults';
import React, { PureComponent } from 'react';
import { InlineFieldRow, Select } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { BMCDataSource } from './datasource';
import { defaultQuery, BMCDataSourceOptions, BMCDataSourceQuery, queryTypeOptions } from './types';
import * as Constants from './Constants';
import { InlineFieldWrapper } from './modules/common/InlineFieldWrapper';
import { RemedyQueryEditor } from './modules/remedy/components/RemedyQueryEditor';
import { MetricQueryEditor } from './modules/metric/components/MetricQueryEditor';
import { CloudSecurityQueryEditor } from './modules/cloudSecurity/components/CloudSecurityQueryEditor';
import { QueryEditor as ElasticQueryEditor } from 'modules/event/components/QueryEditor';
import { ItsmInsightsQueryEditor } from 'modules/itsm-insight/components/ItsmInsightQueryEditor';
import { AuditQueryEditor } from 'modules/audit/components/AuditQueryEditor';

type Props = QueryEditorProps<BMCDataSource, BMCDataSourceQuery, BMCDataSourceOptions>;

export class QueryEditor extends PureComponent<Props> {
  onQueryTypeChange = (selectedVal: any) => {
    const { onChange, query } = this.props;
    onChange({ ...query, sourceType: selectedVal.sourceType, sourceQuery: {} });
  };

  onQueryUpdate = (target: any, runQuery: boolean) => {
    const { onChange, onRunQuery, query } = this.props;
    onChange({ ...query, ...target });
    if (runQuery) {
      onRunQuery();
    }
  };

  render() {
    const query = defaults(this.props.query, defaultQuery);
    const { sourceType } = query;
    const selectedSourceType = queryTypeOptions.find((i: any) => i.sourceType === sourceType);
    return (
      <div className="query-editor-row">
        <InlineFieldRow>
          <InlineFieldWrapper label="Query type" labelWidth={14}>
            <Select
              className="width-12"
              defaultValue={'Please Select'}
              value={selectedSourceType}
              options={queryTypeOptions}
              onChange={(selectedVal) => {
                if (sourceType !== selectedVal.sourceType) {
                  this.onQueryTypeChange(selectedVal);
                }
              }}
              maxMenuHeight={200}
              menuPlacement={'bottom'}
            />
          </InlineFieldWrapper>
        </InlineFieldRow>
        {sourceType === Constants.SOURCE_TYPE_REMEDY ? (
          <RemedyQueryEditor target={query} onQueryUpdate={this.onQueryUpdate} datasource={this.props.datasource} />
        ) : null}
        {sourceType === Constants.SOURCE_TYPE_METRIC ? (
          <MetricQueryEditor
            target={query}
            onQueryUpdate={this.onQueryUpdate}
            datasource={this.props.datasource.getQueryHandlerInstance(query.sourceType)}
          />
        ) : null}
        {sourceType === Constants.SOURCE_TYPE_CLOUD_SECURITY ? (
          <CloudSecurityQueryEditor
            target={query}
            onQueryUpdate={this.onQueryUpdate}
            datasource={this.props.datasource}
          />
        ) : null}
        {sourceType === Constants.SOURCE_TYPE_EVENT || sourceType === Constants.SOURCE_TYPE_LOG ? (
          <ElasticQueryEditor
            query={query.sourceQuery}
            key={sourceType}
            onQueryUpdate={this.onQueryUpdate}
            range={this.props.range}
            datasource={this.props.datasource.getQueryHandlerInstance(sourceType)}
          />
        ) : null}
        {sourceType === Constants.SOURCE_TYPE_ITSM_INSIGHTS ? (
          <ItsmInsightsQueryEditor
            datasource={this.props.datasource}
            onQueryUpdate={this.onQueryUpdate}
            target={query}
          />
        ) : null}
        {sourceType === Constants.SOURCE_TYPE_AUDIT ? (
          <AuditQueryEditor target={query} onQueryUpdate={this.onQueryUpdate} datasource={this.props.datasource} />
        ) : null}
      </div>
    );
  }
}
