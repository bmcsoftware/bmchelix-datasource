import React, { PureComponent } from 'react';
import { BMCDataSourceQuery } from '../../../types';
import { BMCDataSource } from '../../../datasource';
import { InlineFieldWrapper } from '../../common/InlineFieldWrapper';
import { clone as _clone } from 'lodash';
import { InlineFieldRow, Input } from '@grafana/ui';

interface Props {
  target: Partial<BMCDataSourceQuery>;
  onQueryUpdate: Function;
  datasource: BMCDataSource;
}

export class AuditQueryEditor extends PureComponent<Props> {
  constructor(props: Props) {
    super(props);
    const targetClone = _clone(props.target);
    targetClone.sourceQuery = targetClone.sourceQuery || {};
    props.onQueryUpdate(targetClone, false);
  }

  render() {
    return (
      <div>
        <InlineFieldRow>
          <InlineFieldWrapper label="Filter Criteria" labelWidth={14}>
            <Input
              type="text"
              width={75}
              placeholder="Query"
              value={this.props.target.sourceQuery.searchQuery}
              onBlur={() => {
                this.props.onQueryUpdate(this.props.target, true);
              }}
              onChange={(e: any) => {
                const targetClone = _clone(this.props.target);
                targetClone.sourceQuery.searchQuery = e.target.value;
                this.props.onQueryUpdate(targetClone, false);
              }}
            />
          </InlineFieldWrapper>
        </InlineFieldRow>

        <InlineFieldRow>
          <InlineFieldWrapper label="Data Column" labelWidth={14}>
            <Input
              type="text"
              width={75}
              placeholder="Column Name"
              value={this.props.target.sourceQuery.selectQuery}
              onBlur={() => {
                this.props.onQueryUpdate(this.props.target, true);
              }}
              onChange={(e: any) => {
                const targetClone = _clone(this.props.target);
                targetClone.sourceQuery.selectQuery = e.target.value;
                this.props.onQueryUpdate(targetClone, false);
              }}
            />
          </InlineFieldWrapper>
        </InlineFieldRow>
      </div>
    );
  }
}
