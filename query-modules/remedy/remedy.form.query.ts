import coreModule from 'grafana/app/core/core_module';
import _ from 'lodash';
import * as queryDef from './remedy_query_def';
import { SourceList, RemedyForm, LeftOperand, RightOperand, Qualification } from './RemedyTypes';
import { TEMPLATE_BASE_URL, SOURCE_TYPE_REMEDY } from 'Constants';
import angular from 'angular';
import {
  EMPTY,
  OPERATOR_EQUAL,
  KEYWORD_COLUMN,
  KEYWORD_FORM,
  COLUMN_TYPE_FIELD,
  COLUMN_TYPE_SELECT_FORM_NAME,
  COLUMN_TYPE_SELECT_COLUMN_NAME,
  RELATIONAL,
  CHAR,
  ARROW,
  DEFAULT_GROUP,
} from './remedy_literal_string';

export class RemedyFormQueryCtrl {
  /** @ngInject */
  constructor($scope: any, uiSegmentSrv: any, $rootScope: any) {
    const IDENTIFIER_PREFIX = 'F';
    const inputForm: RemedyForm = $scope.target.form;
    const inputSourceList: SourceList[] = $scope.target.form.sourceList;
    const queryHandlerInstance = $scope.datasource.getQueryHandlerInstance(SOURCE_TYPE_REMEDY);

    // Must be first, hack to init global data
    // if not present, Init on root scope
    if ($rootScope.inputAutoComplete === undefined) {
      $rootScope.inputAutoComplete = {};
    }
    if ($rootScope.inputAutoComplete[$scope.target.guid] === undefined) {
      $rootScope.inputAutoComplete[$scope.target.guid] = queryDef.getAutoComplete();
    }

    $scope.init = () => {
      $scope.remedyForm = inputSourceList;

      $scope.inputValue = {
        sourceType: inputSourceList[$scope.index].sourceType || KEYWORD_FORM,
        sourceFormName: inputSourceList[$scope.index].sourceFormName || COLUMN_TYPE_SELECT_FORM_NAME,
        sourceAlias: inputSourceList[$scope.index].sourceAlias || IDENTIFIER_PREFIX + ($scope.index + 1),
        sourceHideClause: inputSourceList[$scope.index].sourceHideClause || false,
        sourceJoinClause: inputSourceList[$scope.index].sourceJoinClause,
      };

      $scope.inputAutoComplete = {
        sourceType: queryDef.getFormTypes(),
        sourceFormName: inputForm.meta.metaFullFormNames,
        sourceAlias: queryDef.getFormAliases(),
        joinColumnName: inputForm.meta.metaColumnNames || COLUMN_TYPE_SELECT_COLUMN_NAME,
        relationalOperator: queryDef.getFormJoinRelationalOperator(),
      };
      $scope.inputAutoComplete.sourceAlias.splice(0, 0, {
        text: IDENTIFIER_PREFIX + ($scope.index + 1),
        value: IDENTIFIER_PREFIX + ($scope.index + 1),
      });

      inputSourceList[$scope.index].sourceAlias = $scope.inputValue.sourceAlias;

      // Reset to blank
      inputForm.meta.metaFullFormNames = [];
      inputForm.meta.metaColumnNames = [];
      inputForm.meta.metaGroupNames = [];

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
      // Double check/reset root scope list
      if ($rootScope.inputAutoComplete === undefined) {
        $rootScope.inputAutoComplete = {};
      }
      if ($rootScope.inputAutoComplete[$scope.target.guid] === undefined) {
        $rootScope.inputAutoComplete[$scope.target.guid] = queryDef.getAutoComplete();
      }
      if ($rootScope.inputAutoComplete[$scope.target.guid].metaColumnNames === undefined) {
        $rootScope.inputAutoComplete[$scope.target.guid].metaColumnNames = [];
      }
      // Update Field Name
      $scope.inputAutoComplete.joinColumnName = $rootScope.inputAutoComplete[$scope.target.guid].metaColumnNames;
    };

    $scope.getMetricColumnList = function (form: SourceList) {
      const jsonStr = angular.toJson({ find: KEYWORD_COLUMN, sourceFormName: form.sourceFormName });
      const columnList = $scope.metricQuery(jsonStr);
      let modifiedColumList: any[] = [];
      _.each(columnList, (column) => {
        modifiedColumList = modifiedColumList.concat({
          text: form.sourceFormName + ARROW + column.text,
          value: { formName: form.sourceFormName, formAlias: form.sourceAlias, ColumnName: column.text },
        });
      });
      return modifiedColumList;
    };

    $scope.getMetaFullFormNames = function () {
      $scope.inputAutoComplete.sourceFormName = queryDef.getFormNames();

      const jsonStr = angular.toJson({ find: KEYWORD_FORM });
      let result = $scope.metricQuery(jsonStr);
      Promise.all([result]).then((data) => {
        // inputForm.meta.metaFullFormNames = queryDef.getFormNames(data[0]);
        $scope.inputAutoComplete.sourceFormName = queryDef.getFormNames(data[0]);
        // Double check/reset root scope list
        if ($rootScope.inputAutoComplete === undefined) {
          $rootScope.inputAutoComplete = {};
        }
        if ($rootScope.inputAutoComplete[$scope.target.guid] === undefined) {
          $rootScope.inputAutoComplete[$scope.target.guid] = queryDef.getAutoComplete();
        }
        if ($rootScope.inputAutoComplete[$scope.target.guid].metaFullFormNames === undefined) {
          $rootScope.inputAutoComplete[$scope.target.guid].metaFullFormNames = [];
        }
        // Assign to root scope
        $rootScope.inputAutoComplete[$scope.target.guid].metaFullFormNames = $scope.inputAutoComplete.sourceFormName;

        // refresh column names across all scopes
        $rootScope.appEvent('remedy-form-name-query-updated');
        $scope.onChange();
      });
    };

    $scope.metricQuery = function (query: any) {
      query = angular.fromJson(query);
      return queryHandlerInstance.metricFindData(query);
    };

    $scope.addFormTypeMenu = function (menu: { text: any; value: any }, subMenu: { text: any; value: any }) {
      let menuValue = menu.value;
      if (subMenu && subMenu.value) {
        menuValue = subMenu.value;
      }
      $scope.inputValue.sourceType = menuValue;
      $scope.onFormTypeChange();
    };

    $scope.onFormTypeChange = () => {
      $scope.inputValue.sourceHideClause = true;
      inputSourceList[$scope.index].sourceHideClause = $scope.inputValue.sourceHideClause;
      $scope.showClause = true;
      // JoinClause
      let defaultJoinClauseLeftOperand: LeftOperand = new LeftOperand(
        COLUMN_TYPE_FIELD,
        null,
        COLUMN_TYPE_SELECT_COLUMN_NAME,
        EMPTY
      );
      let defaulJoinClauseRightOperand: RightOperand = new RightOperand(
        COLUMN_TYPE_FIELD,
        null,
        CHAR,
        EMPTY,
        COLUMN_TYPE_SELECT_COLUMN_NAME,
        EMPTY
      );
      let defaultJoinClauseQualification: Qualification[] = [
        new Qualification(
          false,
          1,
          DEFAULT_GROUP,
          RELATIONAL,
          EMPTY,
          OPERATOR_EQUAL,
          null,
          null,
          defaultJoinClauseLeftOperand,
          defaulJoinClauseRightOperand
        ),
      ];
      $scope.inputValue.sourceJoinClause = defaultJoinClauseQualification;
      inputSourceList[$scope.index].sourceJoinClause = $scope.inputValue.sourceJoinClause;
      inputSourceList[$scope.index].sourceType = $scope.inputValue.sourceType;

      switch (inputSourceList[$scope.index].sourceType) {
        case KEYWORD_FORM: {
          $scope.inputValue.sourceHideClause = false;
          inputSourceList[$scope.index].sourceHideClause = $scope.inputValue.sourceHideClause;
          $scope.showClause = false;
          break;
        }
      }

      $scope.onChange();
    };

    $scope.onFormNameChange = () => {
      // Remove previously added alias
      if ($scope.inputAutoComplete.sourceAlias.length === 3) {
        $scope.inputAutoComplete.sourceAlias.splice(0, 1);
      }
      // Add new alias
      $scope.inputAutoComplete.sourceAlias.splice(0, 0, {
        text: $scope.inputValue.sourceFormName,
        value: $scope.inputValue.sourceFormName,
        requiresField: false,
      });

      inputSourceList[$scope.index].sourceFormName = $scope.inputValue.sourceFormName;
      inputSourceList[$scope.index].sourceAlias = $scope.inputValue.sourceAlias;

      // refresh column names across all scopes
      $rootScope.appEvent('remedy-form-name-query-updated');

      $scope.onChange();
    };

    $scope.onFormAliasChange = () => {
      inputSourceList[$scope.index].sourceAlias = $scope.inputValue.sourceAlias;

      $scope.onChange();
    };

    $scope.onFirstClauseColumnChange = () => {
      let tempFieldDetails = $scope.inputValue.sourceJoinClause[0].leftOperand.fieldName;
      $scope.inputValue.sourceJoinClause[0].leftOperand.fieldName =
        tempFieldDetails.formName + ARROW + tempFieldDetails.columnName;
      $scope.inputValue.sourceJoinClause[0].leftOperand.fieldSourceAlias = tempFieldDetails.formAlias;
      inputSourceList[$scope.index].sourceJoinClause = $scope.inputValue.sourceJoinClause;

      $scope.onChange();
    };

    $scope.onSecondClauseColumnChange = () => {
      let tempFieldDetails = $scope.inputValue.sourceJoinClause[0].rightOperand.fieldName;
      $scope.inputValue.sourceJoinClause[0].rightOperand.fieldName =
        tempFieldDetails.formName + ARROW + tempFieldDetails.columnName;
      $scope.inputValue.sourceJoinClause[0].rightOperand.fieldSourceAlias = tempFieldDetails.formAlias;
      inputSourceList[$scope.index].sourceJoinClause = $scope.inputValue.sourceJoinClause;

      $scope.onChange();
    };

    $scope.onRelationalOperatorChange = () => {
      inputSourceList[$scope.index].sourceJoinClause[0].relationalOperator =
        $scope.inputValue.sourceJoinClause[0].relationalOperator;

      $scope.onChange();
    };

    $scope.addRemedyForm = () => {
      const addIndex = inputSourceList.length;
      // JoinClause
      let defaultJoinClauseLeftOperand: LeftOperand = new LeftOperand(
        COLUMN_TYPE_FIELD,
        null,
        COLUMN_TYPE_SELECT_COLUMN_NAME,
        EMPTY
      );
      let defaulJoinClauseRightOperand: RightOperand = new RightOperand(
        COLUMN_TYPE_FIELD,
        null,
        CHAR,
        EMPTY,
        COLUMN_TYPE_SELECT_COLUMN_NAME,
        EMPTY
      );
      let defaultJoinClauseQualification: Qualification[] = [
        new Qualification(
          false,
          1,
          DEFAULT_GROUP,
          RELATIONAL,
          EMPTY,
          OPERATOR_EQUAL,
          null,
          null,
          defaultJoinClauseLeftOperand,
          defaulJoinClauseRightOperand
        ),
      ];

      let defaultSourceList: SourceList = new SourceList(
        KEYWORD_FORM,
        COLUMN_TYPE_SELECT_FORM_NAME,
        IDENTIFIER_PREFIX + (addIndex + 1),
        false,
        defaultJoinClauseQualification
      );
      $scope.inputValue.sourceJoinClause = defaultJoinClauseQualification;

      // Add new element at the end
      inputSourceList.splice(addIndex, 0, defaultSourceList);

      $scope.onChange();
    };

    $scope.removeRemedyForm = () => {
      if ($scope.index === 0) {
        inputSourceList.splice(inputSourceList.length - 1, 1);
      } else {
        inputSourceList.splice($scope.index, 1);
      }

      $scope.onChange();
    };

    $scope.toggleClause = () => {
      $scope.showClause = !$scope.showClause;
    };

    $scope.toggleShowFormQuery = () => {
      $scope.remedyForm.hideForm = !$scope.remedyForm.hideForm;
      if (!$scope.remedyForm.hideForm) {
        delete $scope.remedyForm.hideForm;
      }

      $scope.onChange();
    };

    $scope.init();
    $scope.getMetaFullFormNames();
  }
}

export function remedyFormQuery() {
  return {
    templateUrl: TEMPLATE_BASE_URL + '/partials/remedy/remedy.form.query.html',
    controller: RemedyFormQueryCtrl,
    controllerAs: 'remedyformctrl',
    restrict: 'E',
    scope: {
      target: '=',
      index: '=',
      datasource: '=',
      onChange: '&',
    },
  };
}

coreModule.directive('remedyFormQuery', remedyFormQuery);
