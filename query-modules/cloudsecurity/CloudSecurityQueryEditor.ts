import _ from 'lodash';
import coreModule from 'grafana/app/core/core_module';
import { SelectableValue } from '@grafana/data';
import { TEMPLATE_BASE_URL } from 'Constants';
import { CSConstants } from './CloudSecurityConstants';

export class CloudSecurityQueryEditorCtrl {
  readonly CSConstants = CSConstants;
  readonly CS_QUERY_OPTIONS: Array<SelectableValue<string>> = [
    { label: 'Asset Compliance', value: CSConstants.ASSET_COMPLIANCE },
    { label: 'Policy Compliance', value: CSConstants.POLICY_COMPLIANCE },
    { label: 'Compliance Trend', value: CSConstants.COMPLIANCE_TREND },
    { label: 'Risk Account', value: CSConstants.RISK_ACCOUNT },
    { label: 'Operations', value: CSConstants.OPERATIONS },
    { label: 'Resource Pool', value: CSConstants.RESOURCE_POOL },
  ];

  /** @ngInject */
  constructor($scope: any, $rootScope: any, uiSegmentSrv: any) {
    $scope.target.sourceQuery = $scope.target.sourceQuery || {};

    if ($scope.target.sourceQuery.csQueryType) {
      $scope.queryctrl.refresh();
    }

    $scope.onCSQueryTypeChange = function() {
      this.target.sourceQuery.csQueryFor = {};
    };
  }
}

export function cloudsecurityQueryEditor() {
  return {
    templateUrl: TEMPLATE_BASE_URL + '/partials/cloudsecurity/cloudsecurity.query.editor.html',
    controller: CloudSecurityQueryEditorCtrl,
    controllerAs: 'csCtrl',
    restrict: 'E',
    scope: {
      target: '=',
      datasource: '=',
      queryctrl: '=',
    },
  };
}

coreModule.directive('cloudsecurityQueryEditor', cloudsecurityQueryEditor);
