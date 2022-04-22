import { DataSourcePlugin } from '@grafana/data';
import { BMCAnnotationsQueryCtrl } from './AnnotationsCtrl';
import { ConfigEditor } from './configurations/ConfigEditor';
import { BMCDataSource } from './datasource';
import { BMCDataSourceOptions, BMCDataSourceQuery } from './types';
import { QueryEditor } from './QueryEditor';

export const plugin = new DataSourcePlugin<BMCDataSource, BMCDataSourceQuery, BMCDataSourceOptions>(BMCDataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor)
  .setAnnotationQueryCtrl(BMCAnnotationsQueryCtrl);
