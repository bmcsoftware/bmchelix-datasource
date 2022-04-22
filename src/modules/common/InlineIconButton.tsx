import { Icon, IconButton, InlineField, InlineLabel } from '@grafana/ui';
import React, { ComponentProps } from 'react';

interface Props {
  disabled?: boolean;
  iconName: ComponentProps<typeof Icon>['name'];
  onClick: () => void;
  className?: string;
  label?: string;
  size?: ComponentProps<typeof Icon>['size'];
}

export const InlineIconButton: React.FC<Props> = (props) => {
  return (
    <InlineField disabled={props.disabled}>
      <InlineLabel style={{ justifyContent: 'center' }}>
        {props.label ?? ''}
        <IconButton
          disabled={props.disabled}
          style={{ marginRight: '0px' }}
          onClick={(e) => {
            e.preventDefault();
            props.onClick();
          }}
          name={props.iconName}
          size={props.size ?? 'sm'}
        />
      </InlineLabel>
    </InlineField>
  );
};
