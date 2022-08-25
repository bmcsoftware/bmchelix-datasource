import { SelectableValue } from '@grafana/data';
import { HorizontalGroup, Icon, IconName, Label } from '@grafana/ui';
import React from 'react';

export interface ListItemProps {
  item: SelectableValue;
  onClick: (item: SelectableValue) => void;
  iconName: IconName;
  iconTooltip?: string;
}
export const ListItem: React.FC<ListItemProps> = (props: ListItemProps) => {
  return (
    <>
      <HorizontalGroup justify="space-between">
        <Label description={props.item.description}>{props.item.label}</Label>
        <Icon
          name={props.iconName}
          title={props.iconTooltip}
          onClick={() => props.onClick(props.item)}
          style={{ cursor: 'pointer' }}
        />
      </HorizontalGroup>
    </>
  );
};
