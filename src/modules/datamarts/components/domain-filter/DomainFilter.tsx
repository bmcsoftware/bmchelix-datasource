import { SelectableValue } from '@grafana/data';
import { Icon, IconName, Input, useTheme2 } from '@grafana/ui';
import { SearchResult } from 'modules/common/components/search-result/SearchResult';
import { TagList } from 'modules/common/components/tag-list/TagList';
import React, { useReducer } from 'react';

const searchConfig = {
  searchPlaceholder: 'Search',
  listItem: {
    iconName: 'plus-circle' as IconName,
    iconTooltip: 'Add item',
  },
};

export interface DomainFilterProps {
  resultItems: SelectableValue[];
  onSearch: (query: string) => void;
  onDomainSelected: (selected: SelectableValue[]) => void;
  loading?: boolean;
  selected: SelectableValue[];
}
export const DomainFilter: React.FC<DomainFilterProps> = (props) => {
  const [showSearch, toggleSearch] = useReducer((showSearch) => !showSearch, false);
  const theme = useTheme2();

  const onDomainSelected = (selected: SelectableValue) => {
    if (props.selected.find((domain) => domain.value === selected.value)) {
      return;
    }
    const domains = props.selected.concat([selected]);
    props.onDomainSelected(domains);
  };

  const getDomainTitle = (item: SelectableValue) => item.label as string;

  const onItemRemoved = (items: SelectableValue[]) => {
    props.onDomainSelected(items);
  };
  return (
    <>
      <div className="gf-form-inline gf-form-inline--xs-view-flex-column flex-grow-1">
        <button className="gf-form-label query-keyword pointer" onClick={toggleSearch}>
          Domain Filter
          <Icon name={!showSearch ? 'angle-right' : 'angle-down'} />
        </button>
        <div
          className="gf-form gf-form--grow flex-shrink-1 min-width-15 gf-form-label"
          style={{ alignItems: 'center' }}
        >
          {props.selected.length > 0 ? (
            <TagList
              tags={props.selected}
              getTooltip={getDomainTitle}
              onRemove={onItemRemoved}
              getTitle={getDomainTitle}
            />
          ) : (
            <Input readOnly={true} placeholder="No filter selected" />
          )}
        </div>
      </div>
      {showSearch && (
        <div
          style={{
            marginTop: '12px',
            marginBottom: '12px',
            backgroundColor: theme.colors.background.secondary,
            padding: '8px',
          }}
        >
          <SearchResult
            resultItems={props.resultItems}
            loading={props.loading}
            searchInputWidth={40}
            onSearch={props.onSearch}
            config={searchConfig}
            width="100%"
            onItemSelected={onDomainSelected}
          />
        </div>
      )}
    </>
  );
};
