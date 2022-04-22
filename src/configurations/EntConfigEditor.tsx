import {
  DataSourcePluginOptionsEditorProps,
  onUpdateDatasourceJsonDataOption,
  onUpdateDatasourceSecureJsonDataOption,
  updateDatasourcePluginResetOption,
} from '@grafana/data';
import { InlineFormLabel, LegacyForms } from '@grafana/ui';
import React, { ChangeEvent, PureComponent } from 'react';
import { BMCDataSourceOptions, HelixSecureJsonData } from '../types';
const { Input, SecretFormField } = LegacyForms;

interface Props extends DataSourcePluginOptionsEditorProps<BMCDataSourceOptions> {}

interface State {}

export class EntConfigEditor extends PureComponent<Props, State> {
  onResetAccessKey = () => {
    updateDatasourcePluginResetOption(this.props, 'accessKey');
  };

  onResetSecretKey = () => {
    updateDatasourcePluginResetOption(this.props, 'secretKey');
  };

  onUpdateURL = (e: ChangeEvent<HTMLInputElement>) => {
    const { options, onOptionsChange } = this.props;
    onOptionsChange({
      ...options,
      url: e.currentTarget.value,
      access: 'proxy',
    });
  };

  render() {
    const { options } = this.props;
    const { secureJsonFields } = options;
    const secureJsonData = (options.secureJsonData || {}) as HelixSecureJsonData;

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
            <InlineFormLabel className="width-10">Tenant ID</InlineFormLabel>
            <div className="width-20">
              <Input
                className="width-20"
                value={options.jsonData.tenantId || ''}
                onChange={onUpdateDatasourceJsonDataOption(this.props, 'tenantId')}
              />
            </div>
          </div>
        </div>
        <div className="gf-form-inline">
          <div className="gf-form">
            <SecretFormField
              isConfigured={(secureJsonFields && secureJsonFields.accessKey) as boolean}
              value={secureJsonData.accessKey || ''}
              label="Access Key"
              labelWidth={10}
              inputWidth={20}
              placeholder={'XXXXX-XXXXXXXXX-XXXXX'}
              onReset={this.onResetAccessKey}
              onChange={onUpdateDatasourceSecureJsonDataOption(this.props, 'accessKey')}
            />
          </div>
        </div>
        <div className="gf-form-inline">
          <div className="gf-form">
            <SecretFormField
              isConfigured={(secureJsonFields && secureJsonFields.secretKey) as boolean}
              value={secureJsonData.secretKey || ''}
              label="Secret Key"
              labelWidth={10}
              inputWidth={20}
              placeholder={'XXXXX-XXXXXXXXX-XXXXX'}
              onReset={this.onResetSecretKey}
              onChange={onUpdateDatasourceSecureJsonDataOption(this.props, 'secretKey')}
            />
          </div>
        </div>
      </div>
    );
  }
}
