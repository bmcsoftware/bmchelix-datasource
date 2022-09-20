import React from 'react';
import DatamartQueryField from './DatamartsQueryField';
import { clone as _clone } from 'lodash';
import { DatamartsDataSourceQuery, DatamartsQuery } from '../utilities/datamartTypes';
import { testIds } from 'modules/metric/components/MetricQueryEditor';
import { DatamartsDatasource } from 'query-modules/datamarts/DataMartsDatasource';

interface Props {
  target: any;
  datasource: DatamartsDatasource;
  onQueryUpdate: Function;
}

export class DatamartsQueryEditor extends React.Component<Props> {
  query: DatamartsDataSourceQuery;

  constructor(props: Props) {
    super(props);

    const defaultQuery: Partial<DatamartsQuery> = {
      erid: undefined,
      datamartName: undefined,
    };
    const query = Object.assign({}, defaultQuery, props.target.sourceQuery);
    this.query = { sourceQuery: query, sourceType: props.target.sourceType, refId: props.target.refId };
  }

  componentDidMount() {}

  onFieldChange = (query: DatamartsDataSourceQuery, override?: any) => {
    this.query.sourceQuery.erid = query.sourceQuery.erid;
  };

  onRunQuery = () => {
    this.props.onQueryUpdate(
      {
        ...this.props.target,
        sourceQuery: this.query.sourceQuery,
      },
      true
    );
    this.setState({});
  };

  render() {
    const datasource = this.props.datasource;
    const query = this.query;

    return (
      <div>
        <DatamartQueryField
          datasource={datasource}
          query={query}
          onRunQuery={this.onRunQuery}
          onChange={this.onFieldChange}
          history={[]}
          data-testid={testIds.editor}
          extraFieldElement={
            <div className="gf-form-inline">
              <div className="gf-form">{/* place holder for extra fields */}</div>
            </div>
          }
        />
      </div>
    );
  }
}
