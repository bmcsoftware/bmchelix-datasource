import { DataSourcePlugin } from '@grafana/data';
import { ConfigEditor } from './configurations/ConfigEditor';
import { BMCDataSource } from './DataSource';
import { BMCDataSourceOptions, BMCDataSourceQuery } from './types';
import { QueryEditor } from './QueryEditor';

export const plugin = new DataSourcePlugin<BMCDataSource, BMCDataSourceQuery, BMCDataSourceOptions>(BMCDataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor);
