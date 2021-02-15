import coreModule from 'grafana/app/core/core_module';
import _ from 'lodash';
import * as queryDef from './remedy_query_def';
import { RemedyForm, SortField, SelectionList, SourceList } from './RemedyTypes';
import { TEMPLATE_BASE_URL } from 'Constants';
import {
  EMPTY,
  KEYWORD_SELECT,
  COLUMN_TYPE_FIELD,
  COLUMN_TYPE_SELECT_FORM_NAME,
  COLUMN_TYPE_SELECT_COLUMN_NAME,
  COLUMN_TYPE_SELECT_COLUMN_TYPE,
  SQL_ASCENDING,
  ARROW,
} from './remedy_literal_string';

export class RemedyOrderQueryCtrl {
  /** @ngInject */
  constructor($scope: any, uiSegmentSrv: any, $rootScope: any) {
    const IDENTIFIER_PREFIX = 'O';
    const inputForm: RemedyForm = $scope.target.form;
    const inputSourceList: SourceList[] = $scope.target.form.sourceList;
    const inputGroupList: SelectionList[] = $scope.target.form.groupByField;
    const inputOrderByList: SortField[] = $scope.target.form.sortField;
    // const queryHandlerInstance = $scope.datasource.getQueryHandlerInstance(SOURCE_TYPE_REMEDY);

    $scope.init = () => {
      $scope.remedyForm = inputOrderByList;
      $scope.remedyForm.hideSort = inputForm.hideSort;

      $scope.inputValue = {
        selectionSeqGroupBy: 0,
        selectionType: inputOrderByList[$scope.index].sortOperand.selectionType || COLUMN_TYPE_SELECT_COLUMN_TYPE,
        selectionColumnName:
          inputOrderByList[$scope.index].sortOperand.selectionColumnName || COLUMN_TYPE_SELECT_COLUMN_NAME,
        selectionAlias:
          inputOrderByList[$scope.index].sortOperand.selectionAlias || IDENTIFIER_PREFIX + ($scope.index + 1),
        selectionSrcAlias: inputOrderByList[$scope.index].sortOperand.selectionSrcAlias || COLUMN_TYPE_SELECT_FORM_NAME,
        selectionSortOrder: inputOrderByList[$scope.index].sortOrder || COLUMN_TYPE_SELECT_FORM_NAME,
      };

      $scope.inputAutoComplete = {
        selectionType: queryDef.getColumnTypes(),
        selectionColumnName: inputForm.meta.metaColumnNames || COLUMN_TYPE_SELECT_COLUMN_NAME,
        selectionAlias: queryDef.getColumnAliases(),
        selectionSrcAlias: inputForm.meta.metaFullFormNames || COLUMN_TYPE_SELECT_FORM_NAME,
        selectionSortOrder: queryDef.getSortOrder() || KEYWORD_SELECT,
      };
      $scope.inputAutoComplete.selectionAlias.splice(0, 0, {
        text: IDENTIFIER_PREFIX + ($scope.index + 1),
        value: IDENTIFIER_PREFIX + ($scope.index + 1),
      });

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
      'remedy-group-query-updated',
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

    $scope.validateModel = () => {
      $scope.isFirst = $scope.index === 0;
      $scope.isSingle = $scope.remedyForm.length === 1;
    };

    $scope.updateColumnsAutoComplete = () => {
      if (inputForm.hideGroupBy) {
        $scope.inputAutoComplete.selectionColumnName = inputForm.meta.metaColumnNames;
      } else {
        $scope.updateColumnsForOrder();
      }
    };

    $scope.updateColumnsForOrder = () => {
      inputForm.meta.metaGroupNames = [];
      _.each(inputGroupList, column => {
        if (!queryDef.isDBFunctionsAggregate(column.selectionType)) {
          let form: SourceList = inputSourceList[0];
          _.find(inputSourceList, function(f) {
            if (column.selectionColumnName.includes(f.sourceFormName)) {
              form = f;
            }
          });
          inputForm.meta.metaGroupNames = inputForm.meta.metaGroupNames.concat({
            text: column.selectionColumnName,
            value: {
              formName: form.sourceFormName,
              formAlias: form.sourceAlias,
              columnName: column.selectionColumnName,
              selectionType: column.selectionType,
            },
          });
        }
      });

      $scope.inputAutoComplete.selectionColumnName = inputForm.meta.metaGroupNames;
    };

    $scope.addColumnTypeMenu = function(menu: { text: any; value: any }, subMenu: { text: any; value: any }) {
      if (inputForm.hideSort) {
        return;
      }
      let menuValue = menu.value;
      if (subMenu && subMenu.value) {
        menuValue = subMenu.value;
      }
      $scope.inputValue.selectionType = menuValue;
      $scope.onColumnTypeChange();
    };

    $scope.onColumnTypeChange = () => {
      inputOrderByList[$scope.index].sortOperand.selectionType = $scope.inputValue.selectionType;
      $scope.showClause = true;
      // $scope.isFirstOnClause = true;

      $scope.onChange();
    };

    $scope.onColumnNameChange = () => {
      // Remove previously added alias
      if ($scope.inputAutoComplete.selectionAlias.length === 3) {
        $scope.inputAutoComplete.selectionAlias.splice(0, 1);
      }
      // Add new alias
      $scope.inputAutoComplete.selectionAlias.splice(0, 0, {
        text: $scope.inputValue.selectionColumnName,
        value: $scope.inputValue.selectionColumnName,
      });

      // Assign column as Form Name and Column Value
      if ($scope.inputValue.selectionColumnName.selectionType) {
        inputOrderByList[$scope.index].sortOperand.selectionType = $scope.inputValue.selectionColumnName.selectionType;
        inputOrderByList[$scope.index].sortOperand.selectionColumnName =
          $scope.inputValue.selectionColumnName.columnName;
      } else {
        inputOrderByList[$scope.index].sortOperand.selectionType = COLUMN_TYPE_FIELD;
        inputOrderByList[$scope.index].sortOperand.selectionColumnName =
          $scope.inputValue.selectionColumnName.formName + ARROW + $scope.inputValue.selectionColumnName.columnName;
      }
      inputOrderByList[$scope.index].sortOperand.selectionAlias = $scope.inputValue.selectionAlias;
      // Assign Source Alias
      _.some(inputForm.meta.metaFullFormNames, srcAlias => {
        if (inputOrderByList[$scope.index].sortOperand.selectionColumnName.includes(srcAlias.text)) {
          if (inputForm.useAlias) {
            $scope.inputValue.selectionSrcAlias = $scope.inputValue.selectionColumnName.formAlias;
          } else {
            $scope.inputValue.selectionSrcAlias = srcAlias.value;
          }
          inputOrderByList[$scope.index].sortOperand.selectionSrcAlias = $scope.inputValue.selectionSrcAlias;
          return;
        }
      });

      $scope.onChange();
    };

    $scope.onColumnAliasChange = () => {
      inputOrderByList[$scope.index].sortOperand.selectionAlias = $scope.inputValue.selectionAlias;
      inputOrderByList[$scope.index].sortOrder = $scope.inputValue.selectionSortOrder;

      $scope.onChange();
    };

    $scope.addRemedyColumn = () => {
      if (inputForm.hideSort) {
        return;
      }
      const addIndex = inputOrderByList.length;
      $scope.inputValue.selectionSeqGroupBy += 1;
      let defaultSortFieldSortOperand: SelectionList = new SelectionList(
        COLUMN_TYPE_FIELD,
        COLUMN_TYPE_SELECT_COLUMN_NAME,
        EMPTY,
        EMPTY
      );
      let defaultSortField: SortField = new SortField(defaultSortFieldSortOperand, SQL_ASCENDING);
      inputOrderByList.splice(addIndex, 0, defaultSortField);

      $scope.onChange();
    };

    $scope.removeRemedyColumn = () => {
      if (inputForm.hideSort) {
        return;
      }
      if ($scope.index === 0) {
        inputOrderByList.splice(inputOrderByList.length - 1, 1);
      } else {
        inputOrderByList.splice($scope.index, 1);
      }
      $scope.inputValue.selectionSeqGroupBy -= 1;

      $scope.onChange();
    };

    $scope.toggleShowColumnQuery = () => {
      $scope.remedyForm.hideSort = !$scope.remedyForm.hideSort;
      inputForm.hideSort = $scope.remedyForm.hideSort;
      if (!$scope.remedyForm.hideSort) {
        delete $scope.remedyForm.hideSort;
      }
      $scope.updateColumnsAutoComplete();

      $scope.onChange();
    };

    $scope.init();
    // ReCheck Auto Complete
    $scope.updateColumnsAutoComplete();
  }
}

export function remedyOrderQuery() {
  return {
    templateUrl: TEMPLATE_BASE_URL + '/partials/remedy/remedy.order.query.html',
    controller: RemedyOrderQueryCtrl,
    controllerAs: 'remedyorderctrl',
    restrict: 'E',
    scope: {
      target: '=',
      index: '=',
      datasource: '=',
      onChange: '&',
    },
  };
}

coreModule.directive('remedyOrderQuery', remedyOrderQuery);
