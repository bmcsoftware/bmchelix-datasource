import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { HorizontalGroup, Icon, stylesFactory, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';
import React from 'react';

export interface TagListProps {
  tags: SelectableValue[];
  onRemove: (selected: SelectableValue[]) => void;
  getTitle: (item: SelectableValue) => string;
  tagClass?: string;
  getTooltip: (itme: SelectableValue) => string;
}

export const TagList: React.FC<TagListProps> = (props: TagListProps) => {
  const theme = useTheme2();
  const styles = getResultsItemStyles(theme);

  const onRemoveItem = (removeItem: SelectableValue) => {
    const newItems = props.tags.filter((item) => item !== removeItem);
    props.onRemove(newItems);
  };

  return (
    <>
      <HorizontalGroup>
        {props.tags?.length > 0 &&
          props.tags.map((item) => {
            return (
              <div key={item.value} className={styles.itemContainer}>
                <span title={props.getTooltip(item)} className={styles.label}>
                  {props.getTitle(item)}
                </span>
                <Icon
                  name="times"
                  onClick={() => onRemoveItem(item)}
                  style={{ cursor: 'pointer' }}
                  title="Remove item"
                />
              </div>
            );
          })}
      </HorizontalGroup>
    </>
  );
};

const getResultsItemStyles = stylesFactory((theme: GrafanaTheme2) => ({
  label: css`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `,
  itemContainer: css`
    color: ${theme.colors.text.primary};
    font-size: ${theme.typography.size.base};
    line-height: ${theme.typography.bodySmall.lineHeight};
    max-width: fit-content;
    position: relative;
    height: 24px;
    line-height: 22px;
    background-color: ${theme.colors.background.primary};
    border: 1px solid ${theme.colors.border.medium};
    border-radius: 3px;
    padding: 0 4px;
    margin-right: 3px;
    white-space: nowrap;
    text-shadow: none;
    font-weight: 500;
    display: flex;
    justify-content: space-between;
    max-width: 120px;
  `,
}));
