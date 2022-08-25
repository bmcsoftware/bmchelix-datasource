import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { Icon, InlineFormLabel, Input, RadioButtonGroup } from '@grafana/ui';
import React, { ReactNode } from 'react';
import { from, throwError } from 'rxjs';
import { catchError, map, switchMap, take, tap } from 'rxjs/operators';
import { BMCDataSourceOptions } from 'types';
import { DatamartsDatasource } from '../../../query-modules/datamarts/DataMartsDatasource';
import {
  Datamart,
  DatamartDomain,
  DatamartMetadataFilter,
  DatamartMetadataResponse,
  DatamartQueryFieldState,
  DatamartsDataSourceQuery,
  DatamartsQuery,
  DatamartTagViewModel,
  DatamartTimeFilterType,
} from '../utilities/datamartTypes';
import { DomainFilter } from './domain-filter/DomainFilter';
import { DatamartsBrowser } from './DatamartsBrowser';
import { TagFilter } from './tag-filter/TagFilter';

function getChooserText(DatamartsLookupDisabled: boolean, hasSyntax: boolean, hasDatamarts: boolean) {
  if (DatamartsLookupDisabled) {
    return '(Disabled)';
  }

  if (!hasSyntax) {
    return 'Loading Datamarts...';
  }

  if (!hasDatamarts) {
    return '(No Datamarts found)';
  }

  return 'Datamarts browser';
}

const TIME_FILTER_OPTIONS: any[] = [
  { label: 'Last 1 Day', value: 'D1' },
  { label: 'Last 7 Days', value: 'D7' },
  { label: 'Last 30 Days', value: 'D30' },
];

interface DatamartQueryFieldProps
  extends QueryEditorProps<DatamartsDatasource, DatamartsDataSourceQuery, BMCDataSourceOptions> {
  extraFieldElement?: ReactNode;
  'data-testid'?: string;
}

class DatamartQueryField extends React.PureComponent<DatamartQueryFieldProps, DatamartQueryFieldState> {
  constructor(props: DatamartQueryFieldProps, context: React.Context<any>) {
    super(props, context);

    this.state = {
      datamarts: {
        loading: false,
        values: [],
      },
      datamartsBrowserVisible: false,
      datamartTimeFilter: {
        showTimeFilter: false,
      },
      syntaxLoaded: false,
      hint: null,
      tagsFilter: {
        show: false,
        options: [],
        selected: [],
        loading: false,
      },
      domainsFilter: {
        show: false,
        options: [],
        selected: [],
        loading: false,
      },
    };
  }

  componentDidMount() {
    this.loadDatamarts(true);
    this.setState((state) => ({
      tagsFilter: { ...state.tagsFilter, selected: this.props.query.sourceQuery.tagFilter?.originalValues || [] },
    }));
    this.setState((state) => ({
      domainsFilter: {
        ...state.domainsFilter,
        selected: this.props.query.sourceQuery.domainFilter?.originalValues || [],
      },
    }));
  }

  componentWillUnmount() {}

  componentDidUpdate(prevProps: DatamartQueryFieldProps) {}

  loadDatamarts = async (restoreState: boolean) => {
    try {
      const datamartList = await this.props.datasource.getDatamarts();
      this.setState({ syntaxLoaded: true, datamarts: datamartList });
      if (restoreState && this.props.query.sourceQuery.erid) {
        const selectedDatamart = datamartList.values.find((d) => d.erid === this.props.query.sourceQuery.erid);
        if (selectedDatamart) {
          this.fetchData(selectedDatamart);
          this.resolveFiltersAsync(selectedDatamart);
        }
      }
    } catch (err: any) {
      if (!err.isCanceled) {
        throw err;
      }
    }
  };

  loadTags = (query: string) => {
    from('start')
      .pipe(
        tap(() => this.setState((state) => ({ tagsFilter: { ...state.tagsFilter, loading: true, options: [] } }))),
        switchMap(() => this.props.datasource.searchTags(query)),
        map((tagTypes: DatamartTagViewModel[]) =>
          tagTypes.map((tagViewModel) => ({
            group: tagViewModel.tagTypeName,
            label: tagViewModel.tagName,
            value: tagViewModel.tagId,
            description: tagViewModel.tagId,
          }))
        ),
        catchError((e) => {
          this.setState((state) => ({ tagsFilter: { ...state.tagsFilter, loading: false, options: [] } }));
          return throwError(e);
        }),
        tap((tags: SelectableValue[]) =>
          this.setState((state) => ({ tagsFilter: { ...state.tagsFilter, loading: false, options: tags } }))
        ),
        take(1)
      )
      .subscribe();
  };

  loadDomains = (query: string) => {
    from('start')
      .pipe(
        tap(() =>
          this.setState((state) => ({ domainsFilter: { ...state.domainsFilter, loading: true, options: [] } }))
        ),
        switchMap(() => this.props.datasource.searchDomains(query)),
        map((domains: DatamartDomain[]) =>
          domains.map((domain) => ({
            label: domain.name,
            value: domain.id,
            description: domain.breadcrumb ? domain.breadcrumb.map((item) => item.name).join('>') : '',
          }))
        ),
        catchError((e) => {
          this.setState((state) => ({ domainsFilter: { ...state.domainsFilter, loading: false, options: [] } }));
          return throwError(e);
        }),
        tap((options: SelectableValue[]) => {
          this.setState((state) => ({ domainsFilter: { ...state.domainsFilter, loading: false, options: options } }));
        }),
        take(1)
      )
      .subscribe();
  };

  onTimeFilterSelected = (selected: string) => {
    const { query } = this.props;
    let sourceQuery = query.sourceQuery as DatamartsQuery;
    sourceQuery.timeFilter = {
      name: 'timefilterlastxdays',
      condition: 'EQUAL',
      value: selected,
    };
    this.onChangeQuery(true);
  };

  onChangeDatamartsBrowser = (datamart: Datamart) => {
    const { query } = this.props;
    query.sourceQuery.domainFilter = undefined;
    query.sourceQuery.tagFilter = undefined;
    this.setState((state) => ({ domainsFilter: { ...state.domainsFilter, show: false, selected: [] } }));
    this.setState((state) => ({ tagsFilter: { ...state.tagsFilter, show: false, selected: [] } }));

    this.fetchData(datamart);
    this.resolveFiltersAsync(datamart);
  };

  private fetchData(datamart: Datamart) {
    const { query } = this.props;
    let sourceQuery = query.sourceQuery as DatamartsQuery;
    sourceQuery.datamartName = datamart.name;
    sourceQuery.erid = datamart.erid;
    this.onChangeQuery(true);
    this.setState({ datamartsBrowserVisible: false });
  }

  private async resolveFiltersAsync(datamart: Datamart) {
    let res: DatamartMetadataResponse = await this.props.datasource.getDatamartMetadata(datamart.erid).toPromise();
    if (res?.standardfiltermetadata) {
      const showDomainFilter = !!res.standardfiltermetadata.domainfilter;
      const showTagFilter = !!res.standardfiltermetadata.tagfilter;
      this.setState((state) => ({ domainsFilter: { ...state.domainsFilter, show: showDomainFilter } }));
      this.setState((state) => ({ tagsFilter: { ...state.tagsFilter, show: showTagFilter } }));

      const timeFilter = res.standardfiltermetadata.timefilter;
      this.setState({
        datamartTimeFilter: {
          showTimeFilter: true,
          type: timeFilter.filtertype,
          label: this.getTimeFilterLabel(timeFilter),
        },
      });
    }
  }

  getTimeFilterLabel = (timeFilter: DatamartMetadataFilter) => {
    switch (timeFilter.filtertype) {
      case DatamartTimeFilterType.LAST_X_DAYS: {
        return 'This datamart uses Last 1,7,30 days as time filters. The time filter selection available in the dashboard will not apply.';
      }
      case DatamartTimeFilterType.FIXED: {
        return (
          'This datamart uses a pre-configured time filter of ' +
          timeFilter.label.toLowerCase() +
          '. The time filter selection available in the dashboard will not apply.'
        );
      }
      default: {
        return '';
      }
    }
  };

  getLastXTimeFilterValue = () => {
    const { query } = this.props;
    let sourceQuery = query.sourceQuery as DatamartsQuery;
    const val = sourceQuery.timeFilter?.value || 'D30';
    return TIME_FILTER_OPTIONS.find((v) => val === v.value).value;
  };

  onChangeQuery = (override?: boolean) => {
    const { query, onChange, onRunQuery } = this.props;
    let sourceQuery = query.sourceQuery as DatamartsQuery;
    if (onChange) {
      const nextQuery: DatamartsDataSourceQuery = { ...query, sourceQuery };
      onChange(nextQuery);

      if (override && onRunQuery) {
        onRunQuery();
      }
    }
  };

  onClickChooserButton = () => {
    this.setState((state) => ({ datamartsBrowserVisible: !state.datamartsBrowserVisible }));
  };

  onTagFilterSelected = (selected: SelectableValue[]) => {
    const { query } = this.props;

    this.setState((state) => ({ tagsFilter: { ...state.tagsFilter, selected: selected } }));
    if (selected.length === 0) {
      query.sourceQuery.tagFilter = undefined;
    } else {
      query.sourceQuery.tagFilter = {
        name: '@{tag}',
        condition: 'EQUALS',
        originalValues: selected,
      };

      if (selected.length > 1) {
        query.sourceQuery.tagFilter.values = selected.map((tag) => `${tag.value}`);
      } else {
        query.sourceQuery.tagFilter.value = `${selected[0].value}`;
      }
    }

    this.onChangeQuery(true);
  };

  onDomainFilterSelected = (selected: SelectableValue[]) => {
    const { query } = this.props;

    this.setState((state) => ({ domainsFilter: { ...state.domainsFilter, selected: selected } }));
    if (selected.length === 0) {
      query.sourceQuery.domainFilter = undefined;
    } else {
      query.sourceQuery.domainFilter = {
        name: '@{domain}',
        condition: 'EQUALS',
        originalValues: selected,
      };

      if (selected.length > 1) {
        query.sourceQuery.domainFilter.values = selected.map((domain) => `${domain.value}`);
      } else {
        query.sourceQuery.domainFilter.value = `${selected[0].value}`;
      }
    }
    this.onChangeQuery(true);
  };

  render() {
    const { datasource, query, extraFieldElement } = this.props;
    const {
      tagsFilter,
      domainsFilter,
      datamarts,
      datamartTimeFilter,
      datamartsBrowserVisible: labelBrowserVisible,
      syntaxLoaded,
    } = this.state;
    const hasDatamarts = datamarts?.values?.length > 0;
    const chooserText = getChooserText(datasource.lookupsDisabled, syntaxLoaded, hasDatamarts);
    const buttonDisabled = !(syntaxLoaded && hasDatamarts);

    return (
      <>
        <div
          className="gf-form-inline gf-form-inline--xs-view-flex-column flex-grow-1"
          data-testid={this.props['data-testid']}
        >
          <button
            className="gf-form-label query-keyword pointer"
            onClick={this.onClickChooserButton}
            disabled={buttonDisabled}
          >
            {chooserText}
            <Icon name={labelBrowserVisible ? 'angle-down' : 'angle-right'} />
          </button>
          <div className="gf-form gf-form--grow flex-shrink-1 min-width-15">
            <Input
              readOnly={true}
              placeholder={'No Datamart selected'}
              aria-label="selected-datamart"
              value={query.sourceQuery.datamartName}
            />
          </div>
        </div>
        {labelBrowserVisible && (
          <div className="gf-form">
            <DatamartsBrowser datamarts={this.state.datamarts} onChange={this.onChangeDatamartsBrowser} />
          </div>
        )}
        {!labelBrowserVisible && datamartTimeFilter.showTimeFilter && (
          <div>
            {datamartTimeFilter.label && (
              <div className="gf-form">
                <InlineFormLabel className="query-keyword" width={10}>
                  Time Filter
                </InlineFormLabel>
                <Input readOnly={true} aria-label="time-filter-label" value={datamartTimeFilter.label} />
              </div>
            )}
            {datamartTimeFilter.type === DatamartTimeFilterType.LAST_X_DAYS && (
              <div className="gf-form">
                <InlineFormLabel className="query-keyword" width={10}>
                  Select Time Filter
                </InlineFormLabel>
                <RadioButtonGroup
                  options={TIME_FILTER_OPTIONS}
                  value={this.getLastXTimeFilterValue()}
                  onChange={(value) => {
                    this.onTimeFilterSelected(value);
                  }}
                />
              </div>
            )}
          </div>
        )}
        {domainsFilter.show && (
          <DomainFilter
            loading={domainsFilter.loading}
            selected={domainsFilter.selected}
            resultItems={domainsFilter.options}
            onSearch={this.loadDomains}
            onDomainSelected={this.onDomainFilterSelected}
          />
        )}
        {tagsFilter.show && (
          <TagFilter
            resultItems={tagsFilter.options}
            selected={tagsFilter.selected}
            loading={tagsFilter.loading}
            onSearch={this.loadTags}
            onTagSelected={this.onTagFilterSelected}
          />
        )}
        {extraFieldElement}
      </>
    );
  }
}

export default DatamartQueryField;
