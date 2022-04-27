import { DataSourcePluginOptionsEditorProps, onUpdateDatasourceJsonDataOption } from '@grafana/data';
import { InlineFormLabel, LegacyForms } from '@grafana/ui';
import React, { PureComponent } from 'react';
import { BMCDataSourceOptions } from '../types';
const { Input } = LegacyForms;

interface Props extends DataSourcePluginOptionsEditorProps<BMCDataSourceOptions> {}

interface State {}

export class ADEConfigEditor extends PureComponent<Props, State> {
  onUpdateURL = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const { options, onOptionsChange } = this.props;
    onOptionsChange({
      ...options,
      url: e.currentTarget.value,
      access: 'proxy',
    });
  };

  render() {
    const { options } = this.props;
    return (
      <div className="gf-form-group">
        <div className="gf-form-inline">
          <div className="gf-form">
            <InlineFormLabel className="width-10">Tenant URL</InlineFormLabel>
            <div className="width-20">
              <Input className="width-20" value={options.url || ''} onChange={this.onUpdateURL} />
            </div>
          </div>
        </div>
        <div className="gf-form-inline">
          <div className="gf-form">
            <InlineFormLabel className="width-10">Platform URL</InlineFormLabel>
            <div className="width-20">
              <Input
                className="width-20"
                value={options.jsonData.platformURL || ''}
                onChange={onUpdateDatasourceJsonDataOption(this.props, 'platformURL')}
              />
            </div>
          </div>
        </div>
        <div className="gf-form-inline">
          <div className="gf-form">
            <InlineFormLabel className="width-10">Platform Queue</InlineFormLabel>
            <div className="width-20">
              <Input
                className="width-20"
                value={options.jsonData.platformQueue || ''}
                onChange={onUpdateDatasourceJsonDataOption(this.props, 'platformQueue')}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
