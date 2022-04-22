import { InlineField, InlineLabel, PopoverContent } from '@grafana/ui';
import React, { ReactNode } from 'react';

interface Props {
  label: string;
  labelWidth: number | 'auto' | undefined;
  labelColor?: string;
  labelChildren?: ReactNode | ReactNode[];
  children?: ReactNode | ReactNode[];
  labelTooltip?: PopoverContent;
}

export const InlineFieldWrapper: React.FC<Props> = (props) => {
  return (
    <InlineField>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <InlineLabel
          tooltip={props.labelTooltip}
          width={props.labelWidth}
          style={{ color: props.labelColor || '#1f62e0', marginRight: !props.children ? '0px' : undefined }}
        >
          {props.label}
          {props.labelChildren ?? ''}
        </InlineLabel>
        {props.children ?? ''}
      </div>
    </InlineField>
  );
};
