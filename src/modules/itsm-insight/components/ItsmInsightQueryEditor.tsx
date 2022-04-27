import React, { PureComponent } from 'react';
import { SelectableValue } from '@grafana/data';
import { BMCDataSourceQuery } from '../../../types';
import { BMCDataSource } from '../../../datasource';
import { InlineFieldWrapper } from '../../common/InlineFieldWrapper';
import { clone as _clone } from 'lodash';
import { Select, InlineFieldRow, Input } from '@grafana/ui';

import { ItsmInsightsConstants } from '../../../query-modules/itsm-insights/ItsmInsightsConstants';

interface Props {
  target: Partial<BMCDataSourceQuery>;
  onQueryUpdate: Function;
  datasource: BMCDataSource;
}

export class ItsmInsightsQueryEditor extends PureComponent<Props> {
  IN_QUERY_OPTIONS: Array<SelectableValue<string>> = [
    { label: 'Problem Management jobs', value: ItsmInsightsConstants.NUMBER_OF_JOBS_CREATED },
    { label: 'Problem Management job execution', value: ItsmInsightsConstants.NUMBER_OF_JOB_EXECUTIONS },
    { label: 'Top Emerging clusters', value: ItsmInsightsConstants.TOP_EMERGING_CLUSTERS },
  ];

  constructor(props: Props) {
    super(props);
    const targetClone = _clone(props.target);
    targetClone.sourceQuery = targetClone.sourceQuery || {};
    props.onQueryUpdate(targetClone, false);
  }

  render() {
    const selectedItsmType = this.IN_QUERY_OPTIONS.find(
      (i) => i.value === this.props.target.sourceQuery.itsmInsigntsQueryType
    );

    return (
      <div>
        <InlineFieldRow>
          <InlineFieldWrapper label="Query" labelWidth={14}>
            <Select
              width={25}
              placeholder="Please Select"
              options={this.IN_QUERY_OPTIONS}
              value={selectedItsmType}
              onChange={(selectedVal) => {
                const targetClone = _clone(this.props.target);
                targetClone.sourceQuery.itsmInsigntsQueryType = selectedVal.value;
                targetClone.sourceQuery.limitTopRecords =
                  selectedVal.value === ItsmInsightsConstants.TOP_EMERGING_CLUSTERS ? 5 : undefined;
                this.props.onQueryUpdate(targetClone, true);
              }}
              menuPlacement="bottom"
            />
          </InlineFieldWrapper>
        </InlineFieldRow>
        {this.props.target.sourceQuery.itsmInsigntsQueryType === ItsmInsightsConstants.TOP_EMERGING_CLUSTERS ? (
          <InlineFieldRow>
            <InlineFieldWrapper label="Max top clusters" labelWidth={14}>
              <Input
                type="number"
                width={14}
                value={this.props.target.sourceQuery.limitTopRecords}
                onBlur={() => {
                  this.props.onQueryUpdate(this.props.target, true);
                }}
                onChange={(e: any) => {
                  const targetClone = _clone(this.props.target);
                  targetClone.sourceQuery.limitTopRecords = e.target.value;
                  this.props.onQueryUpdate(targetClone, false);
                }}
                placeholder=""
                min={5}
                max={20}
              />
            </InlineFieldWrapper>
          </InlineFieldRow>
        ) : null}
      </div>
    );
  }
}
