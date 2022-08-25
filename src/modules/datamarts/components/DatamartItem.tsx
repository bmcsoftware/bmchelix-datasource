import { GrafanaTheme2 } from '@grafana/data';
import { Icon, styleMixins, stylesFactory, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import React, { FC } from 'react';
import { Datamart, OnDatamartSelect } from '../utilities/datamartTypes';

export interface Props {
  item: Datamart;
  onSelect: OnDatamartSelect;
  onShowInfo: OnDatamartSelect;
}

export const DatamartItem: FC<Props> = ({ item, onSelect, onShowInfo }) => {
  const theme = useTheme2();
  const styles = getResultsItemStyles(theme);

  return (
    <div aria-label={item.name} className={cx(styles.wrapper)}>
      <div style={{ width: '90%' }}>
        <div className={styles.body} onClick={() => onSelect(item)}>
          <span
            className={styles.label}
            style={{
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              width: '100%',
            }}
          >
            {item.name}
          </span>
          <span
            className={styles.description}
            style={{
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              width: '100%',
            }}
          >
            {item.description}
          </span>
        </div>
      </div>
      <div style={{ fontWeight: 400, fontSize: 'smaller', width: '10%', padding: '0 12px' }}>
        <Icon
          name={
            item.statusid === 53 ? 'shield-exclamation' : item.statusid === 52 ? 'exclamation-triangle' : 'info-circle'
          }
          size={'lg'}
          title={'Show Datamart extra info'}
          className={getStatusIconStyle(item.statusid, theme)}
          onClick={() => onShowInfo(item)}
        />
      </div>
    </div>
  );
};

const getStatusIconStyle = (status: number, theme: GrafanaTheme2) => {
  switch (status) {
    // warning
    case 52: {
      return css`
        color: ${theme.colors.warning.text};
      `;
    }
    // error
    case 53: {
      return css`
        color: ${theme.colors.error.text};
      `;
    }
    // ok
    case 1: {
      return css`
        color: ${theme.colors.success.text};
      `;
    }
    default: {
      return '';
    }
  }
};

const getResultsItemStyles = stylesFactory((theme: GrafanaTheme2) => ({
  wrapper: css`
    ${styleMixins.listItem(theme)};
    height: 40px;
    width: auto;
    margin-bottom: 4px;
    padding: 0 ${theme.spacing(2)};
    &:last-child {
      margin-bottom: 8px;
    }
    :hover {
      cursor: pointer;
    }
    box-shadow: none;
    display: -webkit-box;
    box-sizing: content-box;
    -webkit-align-items: center;
    -webkit-box-align: center;
  `,
  selected: css`
    ${styleMixins.listItemSelected(theme)};
  `,
  body: css`
    align-items: start;
    justify-content: center;
    display: flex;
    flex-flow: column;
    overflow: hidden;
    justify-content: space-between;
  `,
  label: css`
    margin-right: 10px;
  `,
  description: css`
    color: ${theme.colors.text.maxContrast};
    font-size: ${theme.typography.size.xs};
    line-height: ${theme.typography.bodySmall.lineHeight};
    max-width: fit-content;
    position: relative;
  `,
}));
