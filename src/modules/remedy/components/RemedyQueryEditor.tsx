import React, { PureComponent } from 'react';
import { InlineFieldRow, InlineLabel, Select } from '@grafana/ui';
import _ from 'lodash';
import { BMCDataSourceQuery } from '../../../types';
import { BMCDataSource } from '../../../datasource';
import { AutoCompleteContextProvider, AutoCompleteContext } from '../../common/AutoCompleteContext';
import { RemedyDataSourceQuery, RemedyForm } from '../utilities/RemedyTypes';
import { RemedyQueryBuilder } from '../utilities/remedy_query_builder';
import * as queryDef from '../utilities/remedy_query_def';
import { KEYWORD_SQL } from '../utilities/remedy_literal_string';
import { RemedyQueryHeader } from './RemedyQueryHeader';
import { RemedyOptions } from './RemedyOptions';
import { RemedyFormQuery } from './RemedyFormQuery';
import { RemedyColumnQuery } from './RemedyColumnQuery';
import { RemedyWhereQuery, RemedyHavingQuery } from './RemedyQualQuery';
import { RemedyGroupQuery } from './RemedyGroupQuery';
import { RemedyOrderQuery } from './RemedyOrderQuery';
import { RemedyCalculatedField } from './RemedyCalculatedField';
import { RawQueryComponent } from './RemedyRawQuery';
import { InlineFieldWrapper } from '../../common/InlineFieldWrapper';

interface Props {
  target: Partial<BMCDataSourceQuery>;
  onQueryUpdate: Function;
  datasource: BMCDataSource;
}

export class RemedyQueryEditor extends PureComponent<Props, any> {
  static contextType = AutoCompleteContext;
  queryType: any[] = queryDef.queryType;
  formatAs: any[] = queryDef.formatAs;
  default: Partial<RemedyDataSourceQuery> = {
    sourceQuery: queryDef.getRemedyQuery(),
  };
  queryBuilder: RemedyQueryBuilder = new RemedyQueryBuilder();

  dstType: any[] = queryDef.dstType;
  constructor(props: any) {
    super(props);
    this.state = { showHelp: false };
    const { target, onQueryUpdate } = this.props;
    const targetClone = _.clone(target);
    targetClone.sourceQuery.queryType = targetClone.sourceQuery.queryType || this.default.sourceQuery?.queryType;
    targetClone.sourceQuery.dstType = targetClone.sourceQuery.dstType || this.default.sourceQuery?.dstType;
    targetClone.sourceQuery.formatAs = targetClone.sourceQuery.formatAs || this.default.sourceQuery?.formatAs;
    targetClone.sourceQuery.rawQuery = targetClone.sourceQuery.rawQuery || this.default.sourceQuery?.rawQuery;
    targetClone.sourceQuery.form = targetClone.sourceQuery.form || this.default.sourceQuery?.form;
    targetClone.sourceQuery.header = targetClone.sourceQuery.header || this.default.sourceQuery?.header;
    targetClone.sourceQuery.guid = targetClone.sourceQuery.guid || this.default.sourceQuery?.guid;

    onQueryUpdate(targetClone, true);
  }

  onRemedyQueryTypeChange = (selectedVal: any) => {
    const targetClone = _.clone(this.props.target);
    targetClone.sourceQuery.queryType = selectedVal.value;
    const form: RemedyForm = targetClone.sourceQuery.form;
    if (targetClone.sourceQuery.queryType === KEYWORD_SQL && form.meta.syncToSql) {
      form.meta.syncToSql = false;
      targetClone.sourceQuery.rawQuery = form.meta.rawSql;
    }
    this.props.onQueryUpdate(targetClone, false);
  };

  onFormatAsChange = (selectedVal: any) => {
    const targetClone = _.clone(this.props.target);
    targetClone.sourceQuery.formatAs = selectedVal.value;
    this.generate(targetClone);
    this.props.onQueryUpdate(targetClone, true);
  };

  onRemedyHeaderChange = (header: any, runQuery: boolean) => {
    const targetClone = _.clone(this.props.target);
    targetClone.sourceQuery.header = header;
    this.generate(targetClone);
    this.props.onQueryUpdate(targetClone, runQuery);
  };

  onRemedyFormChange = (form: any, runQuery: boolean) => {
    const targetClone = _.clone(this.props.target);
    targetClone.sourceQuery.form = {
      ...targetClone.sourceQuery.form,
      ...form,
    };
    this.generate(targetClone);
    this.props.onQueryUpdate(targetClone, runQuery);
  };

  onRawQueryChange = (rawQuery: string) => {
    const targetClone = _.clone(this.props.target);
    targetClone.sourceQuery.rawQuery = rawQuery;
    this.generate(targetClone);
    this.props.onQueryUpdate(targetClone, true);
  };

  generate = (targetClone: any) => {
    const form: RemedyForm = targetClone.sourceQuery.form;
    if (form.meta.hideSql) {
      form.meta.rawSql = this.queryBuilder.buildFullSql(targetClone.sourceQuery.form);
    }

    // Generate JSON
    if (form.meta.hideJson) {
      const outputForm = this.queryBuilder.build(targetClone);
      form.meta.rawJson = JSON.stringify(outputForm, null, 2);
    }
  };

  render() {
    const selectedRemedyQueryType = this.queryType.find((i) => {
      return i.value === this.props.target.sourceQuery.queryType;
    });
    const selectedFormatAs = this.formatAs.find((i) => {
      return i.value === this.props.target.sourceQuery.formatAs;
    });
    return (
      <AutoCompleteContextProvider guid={this.props.target.sourceQuery.guid}>
        <div className="remedy-query-editor">
          <InlineFieldRow>
            <InlineFieldWrapper label="Type" labelWidth={16}>
              <Select
                className={'select-container'}
                defaultValue={this.queryType[0]}
                options={this.queryType}
                onChange={this.onRemedyQueryTypeChange}
                value={selectedRemedyQueryType}
              />
            </InlineFieldWrapper>
            <InlineFieldWrapper label="Format As" labelWidth={16}>
              <Select
                className={'select-container'}
                defaultValue={this.formatAs[0]}
                options={this.formatAs}
                onChange={this.onFormatAsChange}
                value={selectedFormatAs}
              />
            </InlineFieldWrapper>
            <InlineLabel style={{ flexGrow: 1, width: 'auto' }}>{''}</InlineLabel>
          </InlineFieldRow>
          {
            <RemedyQueryHeader
              target={this.props.target.sourceQuery}
              onChange={(header: any, runQuery: boolean) => {
                this.onRemedyHeaderChange(header, runQuery);
              }}
            />
          }
          {selectedRemedyQueryType.value === this.queryType[0].value ? (
            <>
              <RemedyOptions
                target={this.props.target.sourceQuery}
                onChange={this.onRemedyFormChange}
                showHelp={this.state.showHelp}
                toggleShowHelp={() => {
                  this.setState({ showHelp: !this.state.showHelp });
                }}
              />
              <RemedyFormQuery
                target={this.props.target.sourceQuery}
                onChange={this.onRemedyFormChange}
                datasource={this.props.datasource}
              />
              <RemedyColumnQuery
                target={this.props.target.sourceQuery}
                onChange={this.onRemedyFormChange}
                datasource={this.props.datasource}
              />
              <RemedyWhereQuery
                target={this.props.target.sourceQuery}
                onChange={this.onRemedyFormChange}
                datasource={this.props.datasource}
              />
              <RemedyGroupQuery
                target={this.props.target.sourceQuery}
                onChange={this.onRemedyFormChange}
                datasource={this.props.datasource}
              />
              <RemedyHavingQuery
                target={this.props.target.sourceQuery}
                onChange={this.onRemedyFormChange}
                datasource={this.props.datasource}
              />
              <RemedyOrderQuery
                target={this.props.target.sourceQuery}
                onChange={this.onRemedyFormChange}
                datasource={this.props.datasource}
              />
              <RemedyCalculatedField
                target={this.props.target.sourceQuery}
                onChange={this.onRemedyFormChange}
                datasource={this.props.datasource}
              />
              {this.props.target.sourceQuery.form.meta.hideSql ? (
                <RawQueryComponent
                  datasource={this.props.datasource}
                  rawQuery={this.props.target.sourceQuery.form.meta.rawSql}
                  onRawQueryChange={this.onRawQueryChange}
                  runQueryOnBlur={false}
                />
              ) : (
                ''
              )}
              {this.state.showHelp ? (
                <>
                  <div className="gf-form gf-form--grow">
                    <label className="gf-form-label query-keyword width-8">Help</label>
                    <div className="gf-form">
                      <pre className="gf-form-pre alert alert-info">
                        {`Time series:
  - One `}
                        <i>__time__</i>
                        {` is used to get time (UTC in milliseconds)
  - At least one column with numeric data type should be present
  Optional:
    - Use `}
                        <i>__metric__</i>
                        {` to represent the series name
    - If no column named metric is found the column name of the value column is used as series name
    - If multiple `}
                        <i>__value__</i>
                        {` columns are returned the metric column is used as prefix
    - All columns with prefix '__value__' are returned
    - If no columns with prefix '___value__' exists then all numeric data type columns are returned
  Table:
    - return any set of columns`}
                      </pre>
                    </div>
                  </div>
                </>
              ) : (
                ''
              )}
            </>
          ) : (
            <RawQueryComponent
              datasource={this.props.datasource}
              rawQuery={this.props.target.sourceQuery.rawQuery}
              onRawQueryChange={this.onRawQueryChange}
              runQueryOnBlur={true}
            />
          )}
        </div>
      </AutoCompleteContextProvider>
    );
  }
}
