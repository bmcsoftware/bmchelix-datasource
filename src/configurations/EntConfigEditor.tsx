import { DataSourcePluginOptionsEditorProps, onUpdateDatasourceJsonDataOption } from '@grafana/data';
import { InlineFormLabel, LegacyForms } from '@grafana/ui';
import React, { PureComponent } from 'react';
import { BMCDataSourceOptions } from '../types';
const { Input, SecretFormField } = LegacyForms;

interface Props extends DataSourcePluginOptionsEditorProps<BMCDataSourceOptions> {}

interface State {
  accessKeyConfigured: boolean;
  secretKeyConfigured: boolean;
}

export class EntConfigEditor extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      accessKeyConfigured: this.props.options?.jsonData?.accessKey?.length > 0,
      secretKeyConfigured: this.props.options?.jsonData?.secretKey?.length > 0,
    };
  }

  onUpdateURL = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const { options, onOptionsChange } = this.props;
    onOptionsChange({
      ...options,
      url: e.currentTarget.value,
      access: 'proxy',
    });
  };

  onResetAccessKey = () => {
    this.setState({
      ...this.state,
      accessKeyConfigured: false,
    });
    this.props.options.jsonData.accessKey = '';
    onUpdateDatasourceJsonDataOption(this.props, 'accessKey');
  };

  onResetSecretKey = () => {
    this.setState({
      ...this.state,
      secretKeyConfigured: false,
    });
    this.props.options.jsonData.secretKey = '';
    onUpdateDatasourceJsonDataOption(this.props, 'secretKey');
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
              isConfigured={this.state.accessKeyConfigured}
              value={options.jsonData.accessKey || ''}
              label="Access key"
              labelWidth={10}
              inputWidth={20}
              placeholder={'XXXXX-XXXXXXXXX-XXXXX'}
              onReset={this.onResetAccessKey}
              onChange={onUpdateDatasourceJsonDataOption(this.props, 'accessKey')}
            />
          </div>
        </div>
        <div className="gf-form-inline">
          <div className="gf-form">
            <SecretFormField
              isConfigured={this.state.secretKeyConfigured}
              value={options.jsonData.secretKey || ''}
              label="Secret key"
              labelWidth={10}
              inputWidth={20}
              placeholder={'XXXXX-XXXXXXXXX-XXXXX'}
              onReset={this.onResetSecretKey}
              onChange={onUpdateDatasourceJsonDataOption(this.props, 'secretKey')}
            />
          </div>
        </div>
      </div>
    );
  }
}
