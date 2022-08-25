import React, { ChangeEvent } from 'react';
import { HorizontalGroup, Input, Label, stylesFactory, withTheme } from '@grafana/ui';
import { css } from '@emotion/css';
import { FixedSizeList } from 'react-window';
import { GrafanaTheme } from '@grafana/data';
import { Datamart, Datamarts } from '../utilities/datamartTypes';
import { DatamartItem } from './DatamartItem';
import { DatamartExtraInfo } from './DatamartExtraInfo';

// Hard limit on labels to render
const LIST_ITEM_SIZE = 50;

export interface BrowserProps {
  onChange: (item: Datamart) => void;
  datamarts: Datamarts;
  theme: GrafanaTheme;
}

interface BrowserState {
  datamartSearchTerm: string;
  showInfo: boolean;
  item: Datamart | null;
}

const getStyles = stylesFactory((theme: GrafanaTheme) => ({
  wrapper: css`
    background-color: ${theme.colors.bg2};
    padding: ${theme.spacing.sm};
    width: 100%;
  `,
  section: css`
    & + & {
      margin: ${theme.spacing.md} 0;
    }
    position: relative;
  `,
  valueListWrapper: css`
    border-left: 1px solid ${theme.colors.border2};
    margin: ${theme.spacing.sm} 0;
    padding: ${theme.spacing.sm} 0 ${theme.spacing.sm} ${theme.spacing.sm};
  `,
}));

export class UnthemedDatamartsBrowser extends React.Component<BrowserProps, BrowserState> {
  valueListsRef = React.createRef<HTMLDivElement>();
  state: BrowserState = {
    datamartSearchTerm: '',
    showInfo: false,
    item: null,
  };

  onChangeDatamartSearch = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({ datamartSearchTerm: event.target.value });
  };

  onClickDatamart = (item: Datamart) => {
    // Resetting search to prevent empty results
    this.setState({ datamartSearchTerm: '' });

    this.props.onChange(item);
  };

  onShowDatamartInfo = (item: Datamart) => {
    const { datamarts } = this.props;
    const datamart = datamarts.values.find((l) => l.name === item?.name);
    if (!datamart) {
      return;
    }
    this.setState({ showInfo: true, item: item });
  };

  componentDidMount() {}

  render() {
    const { theme, datamarts } = this.props;
    const { datamartSearchTerm } = this.state;
    const styles = getStyles(theme);

    // Filter datamarts
    let filteredDatamarts: Datamarts = datamarts;
    if (filteredDatamarts && datamartSearchTerm) {
      filteredDatamarts = {
        ...filteredDatamarts,
        values: filteredDatamarts.values?.filter(
          (value: any) => value.selected || value.name.toLowerCase().includes(datamartSearchTerm.toLowerCase())
        ),
      };
    }

    const datamartsCount = filteredDatamarts?.values?.length || 0;

    return (
      <div className={styles.wrapper}>
        <HorizontalGroup align="flex-start" spacing="lg">
          <div>
            <div className={styles.section}>
              <div style={{ paddingLeft: 20, width: 400 }}>
                <Label description="">Select a datamart</Label>
                <div>
                  <Input
                    onChange={this.onChangeDatamartSearch}
                    aria-label="Filter expression for datamart"
                    value={datamartSearchTerm}
                  />
                </div>
              </div>
              <div role="list" className={styles.valueListWrapper}>
                <FixedSizeList
                  height={Math.min(450, datamartsCount * LIST_ITEM_SIZE)}
                  itemCount={datamartsCount}
                  innerElementType="ul"
                  itemSize={44}
                  itemKey={(i) => (datamarts!.values as any)[i].name}
                  width={600}
                  className={styles.wrapper}
                >
                  {({ index, style }) => {
                    const datamart = filteredDatamarts?.values?.[index];
                    if (!datamart) {
                      return null;
                    }
                    return (
                      <div style={style}>
                        <DatamartItem
                          item={datamart}
                          onSelect={(item: Datamart) => this.onClickDatamart(item)}
                          onShowInfo={(item: Datamart) => this.onShowDatamartInfo(item)}
                        />
                      </div>
                    );
                  }}
                </FixedSizeList>
              </div>
            </div>
          </div>
          <div>{this.state.showInfo ? <DatamartExtraInfo item={this.state.item} /> : <></>}</div>
        </HorizontalGroup>
      </div>
    );
  }
}

export const DatamartsBrowser = withTheme(UnthemedDatamartsBrowser);
