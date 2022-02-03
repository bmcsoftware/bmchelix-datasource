import _ from 'lodash';
import coreModule from 'grafana/app/core/core_module';
import { SelectableValue } from '@grafana/data';
import { TEMPLATE_BASE_URL } from 'Constants';
import { ItsmInsightsConstants } from './ItsmInsightsConstants';

export class ItsmInsightsQueryEditorCtrl {
  readonly INConstants = ItsmInsightsConstants;
  readonly IN_QUERY_OPTIONS: Array<SelectableValue<string>> = [
    { label: 'Problem Management jobs', value: ItsmInsightsConstants.NUMBER_OF_JOBS_CREATED },
    { label: 'Problem Management job execution', value: ItsmInsightsConstants.NUMBER_OF_JOB_EXECUTIONS },
    { label: 'Top Emerging clusters', value: ItsmInsightsConstants.TOP_EMERGING_CLUSTERS },
  ];

  /** @ngInject */
  constructor($scope: any, $rootScope: any, uiSegmentSrv: any) {
    $scope.target.sourceQuery = $scope.target.sourceQuery || {
      limitTopRecords: ItsmInsightsConstants.DEFAULT_LIMIT_TOP_EMERGING_CLUSTERS,
    };

    if ($scope.target.sourceQuery.itsmInsigntsQueryType) {
      $scope.queryctrl.refresh();
    }

    $scope.onItsmInsightsQueryTypeChange = function () {
      this.target.sourceQuery.limitTopRecords =
        this.target.sourceQuery.limitTopRecords || ItsmInsightsConstants.DEFAULT_LIMIT_TOP_EMERGING_CLUSTERS;
      $scope.queryctrl.refresh();
    };

    $scope.onLimitTopRecordsChange = function () {
      $scope.queryctrl.refresh();
    };
  }
}

export function itsmInsightsQueryEditor() {
  return {
    templateUrl: TEMPLATE_BASE_URL + '/partials/itsm-insights/itsm-insights.query.editor.html',
    controller: ItsmInsightsQueryEditorCtrl,
    controllerAs: 'iqCtrl',
    restrict: 'E',
    scope: {
      target: '=',
      datasource: '=',
      queryctrl: '=',
    },
  };
}

coreModule.directive('itsmInsightsQueryEditor', itsmInsightsQueryEditor);
