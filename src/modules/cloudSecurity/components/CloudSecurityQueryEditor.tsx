import React, { PureComponent } from 'react';
import { SelectableValue } from '@grafana/data';
import { BMCDataSourceQuery } from '../../../types';
import { BMCDataSource } from '../../../datasource';
import { InlineFieldWrapper } from '../../common/InlineFieldWrapper';
import { clone as _clone } from 'lodash';
import { Select, InlineFieldRow, InlineSwitch, InlineLabel, RadioButtonGroup } from '@grafana/ui';

import { CSConstants } from '../../../query-modules/cloudsecurity/CloudSecurityConstants';

interface Props {
  target: Partial<BMCDataSourceQuery>;
  onQueryUpdate: Function;
  datasource: BMCDataSource;
}

type GenericObject = { [key: string]: any };

export class CloudSecurityQueryEditor extends PureComponent<Props> {
  CS_QUERY_OPTIONS: Array<SelectableValue<string>> = [
    { label: 'Asset Compliance', value: CSConstants.ASSET_COMPLIANCE },
    { label: 'Policy Compliance', value: CSConstants.POLICY_COMPLIANCE },
    { label: 'Compliance Trend', value: CSConstants.COMPLIANCE_TREND },
    { label: 'Risk Account', value: CSConstants.RISK_ACCOUNT },
    { label: 'Operations', value: CSConstants.OPERATIONS },
    { label: 'Resource Pool', value: CSConstants.RESOURCE_POOL },
  ];

  constructor(props: Props) {
    super(props);
    const targetClone = _clone(props.target);
    targetClone.sourceQuery = targetClone.sourceQuery || {};
    targetClone.sourceQuery.csQueryFor = targetClone.sourceQuery.csQueryFor || {};
    props.onQueryUpdate(targetClone, false);
  }

  render() {
    const selectedCSQueryType = this.CS_QUERY_OPTIONS.find(
      (i) => i.value === this.props.target.sourceQuery.csQueryType
    );

    return (
      <div>
        <InlineFieldRow>
          <InlineFieldWrapper label="Query" labelWidth={14}>
            <Select
              width={25}
              placeholder="Please Select"
              options={this.CS_QUERY_OPTIONS}
              value={selectedCSQueryType}
              onChange={(selectedVal) => {
                const targetClone = _clone(this.props.target);
                targetClone.sourceQuery.csQueryType = selectedVal.value;
                targetClone.sourceQuery.csQueryFor = {};
                this.props.onQueryUpdate(targetClone, true);
              }}
              menuPlacement="bottom"
            />
          </InlineFieldWrapper>
        </InlineFieldRow>
        {getCSQueryForTemplate({
          csQueryType: this.props.target.sourceQuery.csQueryType,
          csQueryFor: this.props.target.sourceQuery.csQueryFor,
          onQueryUpdate: (csQueryFor: GenericObject) => {
            const targetClone = _clone(this.props.target);
            targetClone.sourceQuery.csQueryFor = csQueryFor;
            this.props.onQueryUpdate(targetClone, true);
          },
        })}
      </div>
    );
  }
}

const getCSQueryForTemplate: React.FC<{
  csQueryType: string;
  csQueryFor: GenericObject;
  onQueryUpdate: Function;
}> = ({ csQueryType, csQueryFor, onQueryUpdate }) => {
  let temp = null;
  const updateCSQuery = (key: string, val: boolean | string) => {
    return onQueryUpdate({
      ...csQueryFor,
      [key]: val,
    });
  };
  switch (csQueryType) {
    case CSConstants.ASSET_COMPLIANCE:
      temp = getAssetCompliantTemp({ csQueryFor, updateCSQuery });
      break;
    case CSConstants.COMPLIANCE_TREND:
      temp = getComplianceTrendTemp({ csQueryFor, updateCSQuery });
      break;
    case CSConstants.POLICY_COMPLIANCE:
      temp = getPolicyCompliantTemp({ csQueryFor, updateCSQuery });
      break;
    case CSConstants.RISK_ACCOUNT:
      temp = getRiskAccountTemp({ csQueryFor, updateCSQuery });
      break;
    case CSConstants.OPERATIONS:
      temp = getOperationTemp({ csQueryFor, updateCSQuery });
      break;
    case CSConstants.RESOURCE_POOL:
      temp = getResourcePoolTemp({ csQueryFor, updateCSQuery });
      break;
  }
  return temp;
};

interface CSQueryProp {
  csQueryFor: GenericObject;
  updateCSQuery: Function;
}

const getAssetCompliantTemp: React.FC<CSQueryProp> = ({ csQueryFor, updateCSQuery }) => {
  return (
    <InlineFieldRow>
      <InlineFieldWrapper label="Compliant" labelWidth={20}>
        <InlineSwitch
          value={csQueryFor.compliant}
          onChange={() => {
            updateCSQuery('compliant', !csQueryFor.compliant);
          }}
        />
      </InlineFieldWrapper>
      <InlineFieldWrapper label="Non-compliant" labelWidth={20}>
        <InlineSwitch
          value={csQueryFor.nonCompliant}
          onChange={() => {
            updateCSQuery('nonCompliant', !csQueryFor.nonCompliant);
          }}
        />
      </InlineFieldWrapper>
      <InlineFieldWrapper label="Total assets" labelWidth={20}>
        <InlineSwitch
          value={csQueryFor.totalAssets}
          onChange={() => {
            updateCSQuery('totalAssets', !csQueryFor.totalAssets);
          }}
        />
      </InlineFieldWrapper>
      <InlineLabel style={{ flexGrow: 1, width: 'auto' }}>{''}</InlineLabel>
    </InlineFieldRow>
  );
};
const getPolicyCompliantTemp: React.FC<CSQueryProp> = ({ csQueryFor, updateCSQuery }) => {
  return (
    <InlineFieldRow>
      <InlineFieldWrapper label="Compliant rule" labelWidth={20}>
        <InlineSwitch
          value={csQueryFor.compliantRules}
          onChange={() => {
            updateCSQuery('compliantRules', !csQueryFor.compliantRules);
          }}
        />
      </InlineFieldWrapper>
      <InlineFieldWrapper label="Non-compliant rule" labelWidth={20}>
        <InlineSwitch
          value={csQueryFor.nonCompliantRules}
          onChange={() => {
            updateCSQuery('nonCompliantRules', !csQueryFor.nonCompliantRules);
          }}
        />
      </InlineFieldWrapper>
      <InlineFieldWrapper label="Indeterminate rule" labelWidth={20}>
        <InlineSwitch
          value={csQueryFor.indeterminateRules}
          onChange={() => {
            updateCSQuery('indeterminateRules', !csQueryFor.indeterminateRules);
          }}
        />
      </InlineFieldWrapper>
      <InlineFieldWrapper label="Policy status" labelWidth={20}>
        <InlineSwitch
          value={csQueryFor.policyStatus}
          onChange={() => {
            updateCSQuery('policyStatus', !csQueryFor.policyStatus);
          }}
        />
      </InlineFieldWrapper>
      <InlineLabel style={{ flexGrow: 1, width: 'auto' }}>{''}</InlineLabel>
    </InlineFieldRow>
  );
};
const getComplianceTrendTemp: React.FC<CSQueryProp> = ({ csQueryFor, updateCSQuery }) => {
  return (
    <InlineFieldRow>
      <InlineFieldWrapper label="Trend" labelWidth={14}>
        <RadioButtonGroup
          fullWidth={false}
          value={csQueryFor.trend || CSConstants.complianceTrendOptions[1].value}
          options={CSConstants.complianceTrendOptions as SelectableValue[]}
          onChange={(selectedVal: string) => {
            updateCSQuery('trend', selectedVal);
          }}
          className="testing"
          size="md"
        />
      </InlineFieldWrapper>
      <InlineLabel style={{ flexGrow: 1, width: 'auto' }}>{''}</InlineLabel>
    </InlineFieldRow>
  );
};
const getRiskAccountTemp: React.FC<CSQueryProp> = ({ csQueryFor, updateCSQuery }) => {
  return (
    <InlineFieldRow>
      <InlineFieldWrapper label="Risk account" labelWidth={20}>
        <InlineSwitch
          value={csQueryFor.riskAccount}
          onChange={() => {
            updateCSQuery('riskAccount', !csQueryFor.riskAccount);
          }}
        />
      </InlineFieldWrapper>
      <InlineLabel style={{ flexGrow: 1, width: 'auto' }}>{''}</InlineLabel>
    </InlineFieldRow>
  );
};
const getOperationTemp: React.FC<CSQueryProp> = ({ csQueryFor, updateCSQuery }) => {
  return (
    <InlineFieldRow>
      <InlineFieldWrapper label="Operations" labelWidth={20}>
        <InlineSwitch
          value={csQueryFor.operations}
          onChange={() => {
            updateCSQuery('operations', !csQueryFor.operations);
          }}
        />
      </InlineFieldWrapper>
      <InlineLabel style={{ flexGrow: 1, width: 'auto' }}>{''}</InlineLabel>
    </InlineFieldRow>
  );
};
const getResourcePoolTemp: React.FC<CSQueryProp> = ({ csQueryFor, updateCSQuery }) => {
  return (
    <InlineFieldRow>
      <InlineFieldWrapper label="Resource pools at risk" labelWidth={20}>
        <InlineSwitch
          value={csQueryFor.resourcePoolAtRisk}
          onChange={() => {
            updateCSQuery('resourcePoolAtRisk', !csQueryFor.resourcePoolAtRisk);
          }}
        />
      </InlineFieldWrapper>
      <InlineLabel style={{ flexGrow: 1, width: 'auto' }}>{''}</InlineLabel>
    </InlineFieldRow>
  );
};
