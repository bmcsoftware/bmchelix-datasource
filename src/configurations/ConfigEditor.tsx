import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { config } from '@grafana/runtime';
import React, { PureComponent } from 'react';
import { BMCDataSourceOptions } from '../types';
import { ADEConfigEditor } from './ADEConfigEditor';
import { EntConfigEditor } from './EntConfigEditor';

interface Props extends DataSourcePluginOptionsEditorProps<BMCDataSourceOptions> {}

export class ConfigEditor extends PureComponent<Props> {
  render() {
    const isHelixADEPlatform = config.bootData.settings.EnvType;
    return isHelixADEPlatform ? <ADEConfigEditor {...this.props} /> : <EntConfigEditor {...this.props} />;
  }
}
