import { SelectableValue } from '@grafana/data';
import {
  Button,
  EmptySearchResult,
  Input,
  HorizontalGroup,
  IconName,
  LoadingPlaceholder,
  VerticalGroup,
  Icon,
} from '@grafana/ui';
import React, { useState, MouseEvent, KeyboardEvent } from 'react';
import { SelectableListGroup } from '../selectable-list-group/SelectableListGroup';

export interface SearchResultProp {
  onSearch: (query: string) => void;
  onItemSelected: (selected: SelectableValue) => void;
  resultItems: SelectableValue[];
  containerClassName?: string;
  width?: string;
  searchInputWidth?: number;
  loading?: boolean;
  config?: {
    searchButton?: string;
    emptyResultMsg?: string;
    searchPlaceholder?: string;
    listItem?: {
      iconName: IconName;
      iconTooltip?: string;
    };
  };
}
export const SearchResult: React.FC<SearchResultProp> = (props: SearchResultProp) => {
  const [queryValue, setQueryValue] = useState('');

  const onQueryChange = (value: string) => {
    setQueryValue(value);
  };

  const onSearchClicked = (e: MouseEvent) => {
    e.preventDefault();
    props.onSearch(queryValue);
  };

  const onSearchKeyPressed = (keyboardEvent: KeyboardEvent<HTMLInputElement>) => {
    if (keyboardEvent.key === 'Enter' && queryValue) {
      props.onSearch(queryValue);
    }
  };

  let resultContainer;
  if (props.loading) {
    resultContainer = <LoadingPlaceholder text="Searching..." />;
  } else {
    resultContainer =
      props.resultItems?.length > 0 ? (
        <SelectableListGroup
          listItem={props.config?.listItem ?? { iconName: 'plus-circle' }}
          items={props.resultItems}
          onClick={props.onItemSelected}
        />
      ) : (
        <EmptySearchResult>{props.config?.emptyResultMsg || 'No items'}</EmptySearchResult>
      );
  }

  const prefixIcon = <Icon name="search" />;
  return (
    <>
      <VerticalGroup className={props.containerClassName} width={props.width}>
        <HorizontalGroup>
          <Input
            prefix={prefixIcon}
            width={props.searchInputWidth}
            placeholder={props.config?.searchPlaceholder || 'Type to search'}
            value={queryValue}
            onChange={(elm) => onQueryChange(elm.currentTarget.value)}
            onKeyPress={onSearchKeyPressed}
          ></Input>
          <Button variant={'secondary'} size={'md'} onClick={onSearchClicked} disabled={!queryValue}>
            {props.config?.searchButton || 'Search'}
          </Button>
        </HorizontalGroup>
        {resultContainer}
      </VerticalGroup>
    </>
  );
};
