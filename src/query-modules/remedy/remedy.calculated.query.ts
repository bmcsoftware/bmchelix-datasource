import coreModule from 'grafana/app/core/core_module';
import _ from 'lodash';
import * as queryDef from './remedy_query_def';
import { CalculatedFieldList, RemedyForm } from './RemedyTypes';
import { TEMPLATE_BASE_URL } from 'Constants';
import {
  EMPTY,
  COLUMN_TYPE_SELECT_COLUMN_NAME,
  CALCULATED_FIELD,
  ARROW,
  OPENING_BRACKET,
} from './remedy_literal_string';
import { getBackendSrv } from '@grafana/runtime';

export class RemedyCalculatedQueryCtrl {
  /** @ngInject */
  constructor($scope: any, uiSegmentSrv: any, $rootScope: any) {
    const IDENTIFIER_PREFIX = 'CF';
    const inputForm: RemedyForm = $scope.target.form;
    const inputCalculatedFieldList: CalculatedFieldList[] = $scope.target.form.calculatedFieldList;
    // Must be first, hack to init global data
    // if not present, Init on root scope
    if ($rootScope.inputAutoComplete === undefined) {
      $rootScope.inputAutoComplete = {};
    }
    if ($rootScope.inputAutoComplete[$scope.target.guid] === undefined) {
      $rootScope.inputAutoComplete[$scope.target.guid] = queryDef.getAutoComplete();
    }

    $scope.init = () => {
      $scope.remedyForm = inputCalculatedFieldList;

      $scope.inputValue = {
        selectionSeqGroupBy: 0,
        selectionQuery: inputCalculatedFieldList[$scope.index].selectionQuery || COLUMN_TYPE_SELECT_COLUMN_NAME,
        selectionAlias: inputCalculatedFieldList[$scope.index].selectionAlias || IDENTIFIER_PREFIX + ($scope.index + 1),
        selectionCalculatedFields: inputCalculatedFieldList[$scope.index].selectionCalculatedFields || CALCULATED_FIELD,
        hideCalculatedField: inputCalculatedFieldList[$scope.index].hideCalculatedField,
        selectionCalculatedFieldName: inputCalculatedFieldList[$scope.index].selectionCalculatedFieldName,
      };

      $scope.inputAutoComplete = {
        selectionQuery: inputForm.meta.metaColumnNames || COLUMN_TYPE_SELECT_COLUMN_NAME,
        selectionAlias: [],
        selectionCalculatedFields: inputForm.meta.metaCalculatedFields || CALCULATED_FIELD,
      };

      $scope.inputAutoComplete.selectionAlias.splice(0, 0, {
        text: IDENTIFIER_PREFIX + ($scope.index + 1),
        value: IDENTIFIER_PREFIX + ($scope.index + 1),
      });

      // Add if existing Alias is not already present
      let existingAlias = inputCalculatedFieldList[$scope.index].selectionAlias;
      let index = _.findIndex($scope.inputAutoComplete.selectionAlias, (data) => {
        let data1: any = data;
        return data1.text === existingAlias;
      });
      if (existingAlias && existingAlias !== EMPTY && index === -1) {
        let addIndex = $scope.inputAutoComplete.selectionAlias.length;
        $scope.inputAutoComplete.selectionAlias.splice(addIndex, 0, {
          text: existingAlias,
          value: existingAlias,
        });
      }

      // Add column Name as alias if does not exist
      existingAlias = inputCalculatedFieldList[$scope.index].selectionCalculatedFieldName;
      if (existingAlias !== EMPTY) {
        index = _.findIndex($scope.inputAutoComplete.selectionAlias, (data) => {
          let data1: any = data;
          return data1.text === existingAlias;
        });
        if (existingAlias && index === -1) {
          $scope.inputAutoComplete.selectionAlias.splice(0 + 1, 0, {
            text: existingAlias,
            value: existingAlias,
          });
        }
      }

      inputCalculatedFieldList[$scope.index].selectionAlias = $scope.inputValue.selectionAlias;

      $scope.validateModel();
    };

    $rootScope.onAppEvent(
      'remedy-calculated-query-updated',
      () => {
        $scope.updateColumnsAutoComplete();
      },
      $scope
    );

    $rootScope.onAppEvent(
      'remedy-query-updated',
      () => {
        $scope.validateModel();
      },
      $scope
    );

    $rootScope.onAppEvent(
      'remedy-form-name-query-updated',
      () => {
        $scope.getCalculatedField();
      },
      $scope
    );

    $scope.getCalculatedField = async (): Promise<any> => {
      let result: any;
      try {
        result = await getBackendSrv().get('api/org/calculatedfield');
      } catch (e) {
        $scope.updateCalculatedFieldList([]);
      } finally {
        return $scope.updateCalculatedFieldList(result);
      }
    };

    $scope.updateCalculatedFieldList = (result: any) => {
      let calculatedFields: any[] = [];
      let formNames: any[] = [];
      inputForm.sourceList.forEach((item: any) => {
        formNames.push(item.sourceFormName);
      });
      _.each(result, (item: any) => {
        if (formNames.includes(item.formName)) {
          calculatedFields = calculatedFields.concat({
            text: item.module + ARROW + item.name,
            value: {
              name: item.name,
              text: item.module + ARROW + item.name,
              query: item.sqlQuery,
              aggregation: item.Aggregation,
            },
          });
        }
      });
      $scope.inputAutoComplete.selectionCalculatedFields = calculatedFields;
      $rootScope.inputAutoComplete[$scope.target.guid].metaCalculatedFields =
        $scope.inputAutoComplete.selectionCalculatedFields;
      $rootScope.appEvent('remedy-calculated-query-updated');
    };

    $scope.validateModel = () => {
      $scope.isFirst = $scope.index === 0;
      $scope.isSingle = $scope.remedyForm.length === 1;
    };

    $scope.updateColumnsAutoComplete = () => {
      $scope.inputAutoComplete.selectionCalculatedFields =
        $rootScope.inputAutoComplete[$scope.target.guid].metaCalculatedFields;
    };

    $scope.onColumnAliasChange = () => {
      inputCalculatedFieldList[$scope.index].selectionAlias = $scope.inputValue.selectionAlias;

      $rootScope.appEvent('remedy-calc-query-updated');
      $scope.onChange();
    };

    $scope.onCalculatedFieldChange = () => {
      if ($scope.inputValue.selectionCalculatedFields.name.indexOf(OPENING_BRACKET) !== -1) {
        $scope.inputValue.selectionCalculatedFields.name =
          $scope.inputValue.selectionCalculatedFields.name.split(/[(' ',?,.]/)[0];
      }
      // Add new alias
      $scope.inputAutoComplete.selectionAlias.splice(0, 0, {
        text: $scope.inputValue.selectionCalculatedFields.name,
        value: $scope.inputValue.selectionCalculatedFields.name,
      });

      inputCalculatedFieldList[$scope.index].selectionCalculatedFields =
        $scope.inputValue.selectionCalculatedFields.text;
      inputCalculatedFieldList[$scope.index].selectionQuery = $scope.inputValue.selectionCalculatedFields.query;
      inputCalculatedFieldList[$scope.index].selectionAlias = IDENTIFIER_PREFIX + ($scope.index + 1);
      inputCalculatedFieldList[$scope.index].selectionCalculatedFieldName =
        $scope.inputValue.selectionCalculatedFields.name;
      inputCalculatedFieldList[$scope.index].selectionAggregation = $scope.inputValue.selectionCalculatedFields.aggregation;
      $scope.showClause = true;
      $rootScope.appEvent('remedy-calc-query-updated');
      $scope.onChange();
    };

    $scope.addCalculatedField = () => {
      if ($scope.inputValue.hideCalculatedField) {
        return;
      }
      const addIndex = inputCalculatedFieldList.length;
      $scope.inputValue.selectionSeqGroupBy += 1;
      let defaultSelectionList: CalculatedFieldList = new CalculatedFieldList(
        CALCULATED_FIELD,
        COLUMN_TYPE_SELECT_COLUMN_NAME,
        EMPTY,
        EMPTY,
        true,
        false
      );
      inputCalculatedFieldList.splice(addIndex, 0, defaultSelectionList);

      $scope.onChange();
    };

    $scope.removeCalculatedField = () => {
      if ($scope.inputValue.hideCalculatedField) {
        return;
      }
      if ($scope.index === 0) {
        inputCalculatedFieldList.splice(inputCalculatedFieldList.length - 1, 1);
      } else {
        inputCalculatedFieldList.splice($scope.index, 1);
      }
      $scope.inputValue.selectionSeqGroupBy -= 1;

      $scope.onChange();
    };

    $scope.toggleShowCalculatedQuery = () => {
      inputCalculatedFieldList[$scope.index].hideCalculatedField = !$scope.inputValue.hideCalculatedField;
      $scope.inputValue.hideCalculatedField = !$scope.inputValue.hideCalculatedField;

      $scope.onChange();
    };

    $scope.init();
    $scope.getCalculatedField();
  }
}

export function remedyCalculatedQuery() {
  return {
    templateUrl: TEMPLATE_BASE_URL + '/partials/remedy/remedy.calculated.query.html',
    controller: RemedyCalculatedQueryCtrl,
    controllerAs: 'remedycalculatedctrl',
    restrict: 'E',
    scope: {
      target: '=',
      index: '=',
      datasource: '=',
      onChange: '&',
    },
  };
}

coreModule.directive('remedyCalculatedQuery', remedyCalculatedQuery);
