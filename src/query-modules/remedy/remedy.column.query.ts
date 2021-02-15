import coreModule from 'grafana/app/core/core_module';
import _ from 'lodash';
import * as queryDef from './remedy_query_def';
import { SourceList, SelectionList, RemedyForm } from './RemedyTypes';
import { TEMPLATE_BASE_URL, SOURCE_TYPE_REMEDY } from 'Constants';
import angular from 'angular';
import {
  EMPTY,
  KEYWORD_COLUMN,
  KEYWORD_VALUE,
  COLUMN_TYPE_FIELD,
  COLUMN_TYPE_SELECT_FORM_NAME,
  COLUMN_TYPE_SELECT_COLUMN_NAME,
  COLUMN_TYPE_SELECT_COLUMN_TYPE,
  ARROW,
} from './remedy_literal_string';

export class RemedyColumnQueryCtrl {
  /** @ngInject */
  constructor($scope: any, uiSegmentSrv: any, $rootScope: any) {
    const IDENTIFIER_PREFIX = 'C';
    const inputForm: RemedyForm = $scope.target.form;
    const inputSourceList: SourceList[] = $scope.target.form.sourceList;
    const inputSelectionList: SelectionList[] = $scope.target.form.selectionList;
    const queryHandlerInstance = $scope.datasource.getQueryHandlerInstance(SOURCE_TYPE_REMEDY);

    $scope.init = () => {
      $scope.remedyForm = inputSelectionList;

      $scope.inputValue = {
        selectionSeqGroupBy: 0,
        selectionType: inputSelectionList[$scope.index].selectionType || COLUMN_TYPE_SELECT_COLUMN_TYPE,
        selectionColumnName: inputSelectionList[$scope.index].selectionColumnName || COLUMN_TYPE_SELECT_COLUMN_NAME,
        selectionAlias: inputSelectionList[$scope.index].selectionAlias || IDENTIFIER_PREFIX + ($scope.index + 1),
        selectionSrcAlias: inputSelectionList[$scope.index].selectionSrcAlias || COLUMN_TYPE_SELECT_FORM_NAME,
      };

      $scope.inputAutoComplete = {
        selectionType: queryDef.getColumnTypes(),
        selectionColumnName: inputForm.meta.metaColumnNames || COLUMN_TYPE_SELECT_COLUMN_NAME,
        selectionAlias: queryDef.getColumnAliases(),
        selectionSrcAlias: inputForm.meta.metaFullFormNames || COLUMN_TYPE_SELECT_FORM_NAME,
      };

      $scope.inputAutoComplete.selectionAlias.splice(0, 0, {
        text: IDENTIFIER_PREFIX + ($scope.index + 1),
        value: IDENTIFIER_PREFIX + ($scope.index + 1),
      });
      // Add if existing Alias is not already present
      let existingAlias = inputSelectionList[$scope.index].selectionAlias;
      let index = _.findIndex($scope.inputAutoComplete.selectionAlias, data => {
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
      existingAlias = inputSelectionList[$scope.index].selectionColumnName;
      if (existingAlias.indexOf(ARROW)) {
        existingAlias = existingAlias.substring(existingAlias.indexOf(ARROW) + ARROW.length, existingAlias.length);
      }
      index = _.findIndex($scope.inputAutoComplete.selectionAlias, data => {
        let data1: any = data;
        return data1.text === existingAlias;
      });
      if (existingAlias && index === -1) {
        $scope.inputAutoComplete.selectionAlias.splice(0, 0, {
          text: KEYWORD_VALUE + existingAlias,
          value: KEYWORD_VALUE + existingAlias,
        });
        $scope.inputAutoComplete.selectionAlias.splice(0 + 1, 0, {
          text: existingAlias,
          value: existingAlias,
        });
      }

      inputSelectionList[$scope.index].selectionAlias = $scope.inputValue.selectionAlias;

      // $scope.isFirstOnClause = true;
      $scope.validateModel();
    };

    $rootScope.onAppEvent(
      'remedy-column-query-updated',
      () => {
        $scope.updateColumnsAutoComplete();
      },
      $scope
    );

    $rootScope.onAppEvent(
      'remedy-form-name-query-updated',
      () => {
        $scope.updateFullColumnList();
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

    $scope.validateModel = () => {
      $scope.isFirst = $scope.index === 0;
      $scope.isSingle = $scope.remedyForm.length === 1;
    };

    $scope.updateColumnsAutoComplete = () => {
      // Update Field Name
      $scope.inputAutoComplete.selectionColumnName = inputForm.meta.metaColumnNames;
    };

    $scope.updateFullColumnList = () => {
      // Process only for first row
      if ($scope.index !== 0) {
        return;
      }
      // Reset ColumnList
      inputForm.meta.metaColumnNames = queryDef.getColumnNames();
      $scope.inputAutoComplete.selectionColumnName = inputForm.meta.metaColumnNames;

      // Query Column list based on all the form
      let result: any[] = [];
      _.each(inputSourceList, form => {
        if (form.sourceFormName) {
          const jsonStr = angular.toJson({ find: KEYWORD_COLUMN, name: form.sourceFormName });
          result.push($scope.metricQuery(jsonStr));
        }
      });
      // For each form resolve promise
      Promise.all(result).then(columnList => {
        let modifiedColumList: any[] = [];
        _.each(columnList, function(column, index) {
          const columnList = queryDef.getColumnNames(column);
          _.each(columnList, column => {
            modifiedColumList = modifiedColumList.concat({
              text: inputSourceList[index].sourceFormName + ARROW + column.text,
              value: {
                formName: inputSourceList[index].sourceFormName,
                formAlias: inputSourceList[index].sourceAlias,
                columnName: column.text,
              },
            });
          });
        });
        // refresh ColumnList
        inputForm.meta.metaColumnNames = modifiedColumList;
        $scope.inputAutoComplete.selectionColumnName = inputForm.meta.metaColumnNames;

        // refresh column names across all scopes
        $rootScope.appEvent('remedy-column-query-updated');
      });
    };

    $scope.metricQuery = function(query: any) {
      query = angular.fromJson(query);
      return queryHandlerInstance.metricFindData(query);
    };

    $scope.addColumnTypeMenu = function(menu: { text: any; value: any }, subMenu: { text: any; value: any }) {
      let menuValue = menu.value;
      if (subMenu && subMenu.value) {
        menuValue = subMenu.value;
      }
      $scope.inputValue.selectionType = menuValue;
      $scope.onColumnTypeChange();
    };

    $scope.onColumnTypeChange = () => {
      inputSelectionList[$scope.index].selectionType = $scope.inputValue.selectionType;
      $scope.showClause = true;
      // $scope.isFirstOnClause = true;

      // refresh column names across all scopes
      $rootScope.appEvent('remedy-column-query-updated');

      $scope.onChange();
    };

    $scope.onColumnNameChange = () => {
      // Remove previously added alias
      if (
        $scope.inputAutoComplete.selectionAlias &&
        $scope.inputAutoComplete.selectionAlias.length > queryDef.columnAliases.length + 1
      ) {
        $scope.inputAutoComplete.selectionAlias.splice(0, 2);
      }
      // Add new alias
      $scope.inputAutoComplete.selectionAlias.splice(0, 0, {
        text: $scope.inputValue.selectionColumnName.columnName,
        value: $scope.inputValue.selectionColumnName.columnName,
      });
      $scope.inputAutoComplete.selectionAlias.splice(0, 0, {
        text: KEYWORD_VALUE + $scope.inputValue.selectionColumnName.columnName,
        value: KEYWORD_VALUE + $scope.inputValue.selectionColumnName.columnName,
      });

      // Assign column as Form Name and Column Value
      inputSelectionList[$scope.index].selectionColumnName =
        $scope.inputValue.selectionColumnName.formName + ARROW + $scope.inputValue.selectionColumnName.columnName;
      inputSelectionList[$scope.index].selectionAlias = $scope.inputValue.selectionAlias;

      // Assign Source Alias
      _.some(inputForm.meta.metaFullFormNames, srcAlias => {
        if ($scope.inputValue.selectionColumnName.formName.includes(srcAlias.text)) {
          if (inputForm.useAlias) {
            $scope.inputValue.selectionSrcAlias = $scope.inputValue.selectionColumnName.formAlias;
          } else {
            $scope.inputValue.selectionSrcAlias = srcAlias.value;
          }
          inputSelectionList[$scope.index].selectionSrcAlias = $scope.inputValue.selectionSrcAlias;
          return;
        }
      });

      // refresh column names across all scopes
      $rootScope.appEvent('remedy-column-query-updated');

      $scope.onChange();
    };

    $scope.onColumnAliasChange = () => {
      inputSelectionList[$scope.index].selectionAlias = $scope.inputValue.selectionAlias;

      $scope.onChange();
    };

    $scope.addRemedyColumn = () => {
      const addIndex = inputSelectionList.length;
      $scope.inputValue.selectionSeqGroupBy += 1;
      let defaultSelectionList: SelectionList = new SelectionList(
        COLUMN_TYPE_FIELD,
        COLUMN_TYPE_SELECT_COLUMN_NAME,
        EMPTY,
        EMPTY
      );
      inputSelectionList.splice(addIndex, 0, defaultSelectionList);

      $scope.onChange();
    };

    $scope.removeRemedyColumn = () => {
      if ($scope.index === 0) {
        inputSelectionList.splice(inputSelectionList.length - 1, 1);
      } else {
        inputSelectionList.splice($scope.index, 1);
      }
      $scope.inputValue.selectionSeqGroupBy -= 1;

      $scope.onChange();
    };

    $scope.toggleShowColumnQuery = () => {
      $scope.remedyForm.hideColumn = !$scope.remedyForm.hideColumn;
      if (!$scope.remedyForm.hideColumn) {
        delete $scope.remedyForm.hideColumn;
      }

      $scope.onChange();
    };

    $scope.init();
  }
}

export function remedyColumnQuery() {
  return {
    templateUrl: TEMPLATE_BASE_URL + '/partials/remedy/remedy.column.query.html',
    controller: RemedyColumnQueryCtrl,
    controllerAs: 'remedycolumnctrl',
    restrict: 'E',
    scope: {
      target: '=',
      index: '=',
      datasource: '=',
      onChange: '&',
    },
  };
}

coreModule.directive('remedyColumnQuery', remedyColumnQuery);
