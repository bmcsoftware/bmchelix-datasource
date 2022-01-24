import coreModule from 'grafana/app/core/core_module';
import { TEMPLATE_BASE_URL } from 'Constants';

export function logPipelineVariables() {
  return {
    templateUrl: TEMPLATE_BASE_URL + '/partials/log/pipeline_variables.html',
    controller: 'LogPipelineVariablesCtrl',
    restrict: 'E',
    scope: {
      onChange: '&',
      variables: '=',
      options: '=',
    },
  };
}

const newVariable = (index: any) => {
  return {
    name: 'var' + index,
    pipelineAgg: 'select metric',
  };
};

export class LogPipelineVariablesCtrl {
  /** @ngInject */
  constructor($scope: any) {
    $scope.variables = $scope.variables || [newVariable(1)];

    $scope.onChangeInternal = () => {
      $scope.onChange();
    };

    $scope.add = () => {
      $scope.variables.push(newVariable($scope.variables.length + 1));
      $scope.onChange();
    };

    $scope.remove = (index: number) => {
      $scope.variables.splice(index, 1);
      $scope.onChange();
    };
  }
}

coreModule.directive('logPipelineVariables', logPipelineVariables);
coreModule.controller('LogPipelineVariablesCtrl', LogPipelineVariablesCtrl);
