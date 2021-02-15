import coreModule from 'grafana/app/core/core_module';
import { TEMPLATE_BASE_URL } from 'Constants';

export function eventPipelineVariables() {
  return {
    templateUrl: TEMPLATE_BASE_URL + '/partials/event/pipeline_variables.html',
    controller: 'EventPipelineVariablesCtrl',
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

export class EventPipelineVariablesCtrl {
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

coreModule.directive('eventPipelineVariables', eventPipelineVariables);
coreModule.controller('EventPipelineVariablesCtrl', EventPipelineVariablesCtrl);
