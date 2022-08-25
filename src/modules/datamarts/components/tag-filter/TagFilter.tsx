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

export interface TagFilterProps {
  resultItems: SelectableValue[];
  onSearch: (query: string) => void;
  onTagSelected: (selected: SelectableValue[]) => void;
  selected: SelectableValue[];
  loading?: boolean;
}
export const TagFilter: React.FC<TagFilterProps> = (props) => {
  const [showSearch, toggleSearch] = useReducer((showSearch) => !showSearch, false);

  const theme = useTheme2();

  const onTagSelected = (selected: SelectableValue) => {
    if (props.selected.find((item) => item.value === selected.value)) {
      return;
    }
    const tags = props.selected.concat([selected]);
    props.onTagSelected(tags);
  };

  const onItemRemoved = (items: SelectableValue[]) => {
    props.onTagSelected(items);
  };

  const getTagTitle = (item: SelectableValue) => `${item.label}`;
  const getTagTooltip = (item: SelectableValue) => `${item.group}:${item.label}`;

  return (
    <>
      <div className="gf-form-inline gf-form-inline--xs-view-flex-column flex-grow-1">
        <button className="gf-form-label query-keyword pointer" onClick={toggleSearch}>
          Tag Filter
          <Icon name={!showSearch ? 'angle-right' : 'angle-down'} />
        </button>
        <div
          className="gf-form gf-form--grow flex-shrink-1 min-width-15 gf-form-label"
          style={{ alignItems: 'center' }}
        >
          {props.selected.length > 0 ? (
            <TagList tags={props.selected} onRemove={onItemRemoved} getTooltip={getTagTooltip} getTitle={getTagTitle} />
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
            onSearch={props.onSearch}
            config={searchConfig}
            searchInputWidth={40}
            width="100%"
            loading={props.loading}
            onItemSelected={onTagSelected}
          />
        </div>
      )}
    </>
  );
};
