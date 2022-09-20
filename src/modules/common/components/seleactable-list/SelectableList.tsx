import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { IconName, stylesFactory, useTheme2, VerticalGroup } from '@grafana/ui';
import React from 'react';
import { ListItem } from '../list-item/ListItem';

export interface SelectableListProps {
  items: SelectableValue[];
  onClick: (item: SelectableValue) => void;
  group?: string;
  groupClass?: string;
  listItem: {
    iconName: IconName;
    iconTooltip?: string;
  };
}

export const SelectableList: React.FC<SelectableListProps> = (props: SelectableListProps) => {
  const theme = useTheme2();
  const styles = getResultsItemStyles(theme);

  return (
    <>
      <div className={styles.container}>
        <VerticalGroup>
          {props.items?.map((item, idx) => {
            return (
              <ListItem
                iconTooltip={props.listItem.iconTooltip}
                iconName={props.listItem.iconName}
                item={item}
                onClick={props.onClick}
                key={props.group}
              />
            );
          })}
        </VerticalGroup>
      </div>
    </>
  );
};

const getResultsItemStyles = stylesFactory((theme: GrafanaTheme2) => ({
  container: css`
    margin-bottom: 0px;
    background-color: ${theme.colors.background.primary};
    width: 100%;
    padding: 12px;
  `,
}));
