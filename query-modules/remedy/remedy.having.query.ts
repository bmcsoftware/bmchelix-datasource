import coreModule from 'grafana/app/core/core_module';
import _ from 'lodash';
import * as queryDef from './remedy_query_def';
import { TEMPLATE_BASE_URL } from 'Constants';
import { RemedyForm, Qualification } from './RemedyTypes';

export class RemedyHavingQueryCtrl {
  /** @ngInject */
  constructor($scope: any, uiSegmentSrv: any, $rootScope: any) {
    const inputForm: RemedyForm = $scope.target.form;
    const inputQualification: Qualification = $scope.target.form.qualification;
    // Must be first, hack to init global data
    // if not present, Init on root scope
    if ($rootScope.inputAutoComplete === undefined) {
      $rootScope.inputAutoComplete = {};
    }
    if ($rootScope.inputAutoComplete[$scope.target.guid] === undefined) {
      $rootScope.inputAutoComplete[$scope.target.guid] = queryDef.getAutoComplete();
    }

    $scope.init = () => {
      $scope.qualType = 'Having';
      $scope.remedyForm = inputQualification;
      $scope.remedyForm.hideHaving = inputForm.hideHaving;

      $scope.inputValue = inputQualification;

      $scope.inputAutoComplete = {};

      $scope.showGroup = false;
      // $scope.isFirstOnClause = true;
      $scope.validateModel();
    };

    $rootScope.onAppEvent(
      'remedy-query-updated',
      () => {
        $scope.validateModel();
      },
      $scope
    );

    $scope.validateModel = () => {
      $scope.isFirst = $scope.index === 0;
    };

    $scope.toggleShowHavingQuery = () => {
      $scope.remedyForm.hideHaving = !$scope.remedyForm.hideHaving;
      inputForm.hideHaving = $scope.remedyForm.hideHaving;

      if (!$scope.remedyForm.hideHaving) {
        delete $scope.remedyForm.hideHaving;
      }

      $scope.onChange();
    };

    $scope.init();
  }
}

export function remedyHavingQuery() {
  return {
    templateUrl: TEMPLATE_BASE_URL + '/partials/remedy/remedy.having.query.html',
    controller: RemedyHavingQueryCtrl,
    controllerAs: 'remedyhavingctrl',
    restrict: 'E',
    scope: {
      target: '=',
      index: '=',
      datasource: '=',
      onChange: '&',
    },
  };
}

coreModule.directive('remedyHavingQuery', remedyHavingQuery);
