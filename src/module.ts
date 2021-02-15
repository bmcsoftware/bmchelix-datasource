import { DataSourcePlugin } from '@grafana/data';
import { BMCAnnotationsQueryCtrl } from 'AnnotationsCtrl';
import { ConfigEditor } from './configurations/ConfigEditor';
import { BMCDataSource } from './DataSource';
import { BMCDataSourceQueryCtrl } from './QueryCtrl';
import { BMCDataSourceOptions, BMCDataSourceQuery } from './types';

export const plugin = new DataSourcePlugin<BMCDataSource, BMCDataSourceQuery, BMCDataSourceOptions>(BMCDataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryCtrl(BMCDataSourceQueryCtrl)
  .setAnnotationQueryCtrl(BMCAnnotationsQueryCtrl);
