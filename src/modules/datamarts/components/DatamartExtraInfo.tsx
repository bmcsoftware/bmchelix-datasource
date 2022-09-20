import { GrafanaTheme2 } from '@grafana/data';
import { stylesFactory, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import React, { FC } from 'react';
import { Datamart } from '../utilities/datamartTypes';

export interface Props {
  item: Datamart | null;
}

export const DatamartExtraInfo: FC<Props> = ({ item }) => {
  const theme = useTheme2();
  const styles = getStyles(theme);

  const extraInfo = item
    ? [
        { label: 'Name', value: item.name },
        { label: 'Description', value: item.description ? item?.description : undefined },
        { label: 'Id', value: item.erid },
        { label: 'Physical name', value: item.physname },
        { label: 'Type', value: item.ertypeid },
        { label: 'Status', value: getStatusLabel(item.statusid), descStyle: getStatusStyle(item.statusid, theme) },
        // { label: 'Creation date', value: item.creationdate },
        // { label: 'Update date', value: item.updatedate }
      ]
    : [];

  return (
    <div aria-label={item?.name + ' extra info'} className={styles.wrapper}>
      <div className={styles.infoContent}>
        <div>
          <span className={styles.title}>Datamart info:</span>
        </div>
        <div className={styles.itemsContent}>
          {extraInfo.map(
            (item) =>
              item.value && (
                <div className={styles.item} key={`${item.label} advanced info`}>
                  <span className={styles.label}>{item.label}</span>
                  <span className={cx(styles.description, item.descStyle ? item.descStyle : '')}>{item.value}</span>
                </div>
              )
          )}
        </div>
      </div>
    </div>
  );
};

const getStatusLabel = (status: number) => {
  switch (status) {
    // warning
    case 52: {
      return 'Warning';
    }
    // error
    case 53: {
      return 'Error';
    }
    // ok
    case 1: {
      return 'OK';
    }
    default: {
      return '';
    }
  }
};

const getStatusStyle = (status: number, theme: GrafanaTheme2) => {
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

const getStyles = stylesFactory((theme: GrafanaTheme2) => ({
  wrapper: css`
    margin: 30px 50px;
  `,
  infoContent: css`
    margin: 10px;
  `,
  title: css`
    font-size: ${theme.typography.size.lg};
  `,
  itemsContent: css`
    margin-top: 15px;
    display: flex-wrap;
    align-items: right;
  `,
  item: css`
    margin-bottom: 15px;
    &:last-child {
      margin-bottom: 0;
    }
  `,
  label: css`
    label: Label;
    font-size: ${theme.typography.size.sm};
    font-weight: ${theme.typography.fontWeightMedium};
    line-height: 1.25;
    max-width: 480px;
  `,
  description: css`
    label: Label-description;
    font-size: ${theme.typography.size.sm};
    display: block;
  `,
}));
