import * as queryDef from './remedy_query_def';
import coreModule from 'grafana/app/core/core_module';
import _ from 'lodash';
import { TEMPLATE_BASE_URL } from 'Constants';
import {
  Qualification,
  RemedyForm,
  LeftOperand,
  RightOperand,
  SelectionList,
  SourceList,
  CalculatedFieldList,
} from './RemedyTypes';
import {
  DOT,
  EMPTY,
  OPERATOR_AND,
  OPERATOR_OR,
  OPERATOR_EQUAL,
  RELATIONAL,
  VALUE,
  CHAR,
  COLUMN_TYPE_FIELD,
  COLUMN_TYPE_SELECT_FORM_NAME,
  COLUMN_TYPE_SELECT_COLUMN_NAME,
  ARROW,
  GROUP_IDENTIFIER,
  NULL,
  CALCULATED_FIELD,
  UNDERSCORE,
} from './remedy_literal_string';

export class RemedyQualQueryCtrl {
  /** @ngInject */
  constructor($scope: any, uiSegmentSrv: any, $rootScope: any) {
    const inputForm: RemedyForm = $scope.target.form;
    const inputSourceList: SourceList[] = $scope.target.form.sourceList;
    const inputSelectionList: SelectionList[] = $scope.target.form.selectionList;
    const inputCalculatedFieldList: CalculatedFieldList[] = $scope.target.form.calculatedFieldList;
    let inputQualification: Qualification = $scope.qualification;
    let inputQualificationList: Qualification[] = $scope.qualifications;
    let showHideQual: boolean = $scope.showhide;
    let qualType: boolean = $scope.qualtype;
    // Must be first, hack to init global data
    // if not present, Init on root scope
    if ($rootScope.inputAutoComplete === undefined) {
      $rootScope.inputAutoComplete = {};
    }
    if ($rootScope.inputAutoComplete[$scope.target.guid] === undefined) {
      $rootScope.inputAutoComplete[$scope.target.guid] = queryDef.getAutoComplete();
    }

    $scope.init = () => {
      $scope.qualType = qualType;
      $scope.showHideQual = showHideQual;
      $scope.remedyForm = inputForm;
      $scope.qualList = inputQualificationList;
      $scope.inputValue = inputQualification;

      $scope.inputAutoComplete = {
        fieldType: queryDef.getWhereTypes(),
        fieldName: inputForm.meta.metaColumnNames || COLUMN_TYPE_SELECT_COLUMN_NAME,
        fieldAlias: queryDef.getColumnAliases(),
        fieldSrcAlias: inputForm.meta.metaFullFormNames || COLUMN_TYPE_SELECT_FORM_NAME,
        relationalOperator: queryDef.getRelationalOperator(),
        logicalOperator: [
          { text: OPERATOR_AND, value: OPERATOR_AND },
          { text: OPERATOR_OR, value: OPERATOR_OR },
        ],
      };

      $scope.inputValue.collapseGroup = true;
      inputQualification.collapseGroup = true;
      $scope.onInputValueChangeCalculate();
      $scope.validateModel();
    };

    $rootScope.onAppEvent(
      'remedy-where-query-updated',
      () => {
        $scope.toggleHideWhereQuery();
      },
      $scope
    );

    $rootScope.onAppEvent(
      'remedy-having-query-updated',
      () => {
        $scope.toggleHideHavingQuery();
      },
      $scope
    );

    $rootScope.onAppEvent(
      'remedy-column-query-updated',
      () => {
        $scope.updateAllColumns();
      },
      $scope
    );

    $rootScope.onAppEvent(
      'remedy-calc-query-updated',
      () => {
        $scope.updateAllColumns();
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

    $scope.replaceSpaceWithUnderscore = (input: string) => {
      return input.replace(/\s/g, UNDERSCORE);
    };

    $scope.updateAllColumns = () => {
      if ($scope.qualType === 'Where') {
        $scope.updateColumnsAutoComplete();
        $scope.inputAutoComplete.fieldType = queryDef.getWhereTypes();
      }
      if ($scope.qualType === 'Having') {
        $scope.updateColumnsForGroup();
        $scope.inputAutoComplete.fieldType = queryDef.getHavingTypes();
      }

      $scope.onChange();
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
      $scope.inputAutoComplete.fieldName = $rootScope.inputAutoComplete[$scope.target.guid].metaColumnNames;

      $scope.onChange();
    };

    $scope.updateColumnsForGroup = () => {
      let metaHavingNames: any[] = [];
      _.each(inputSelectionList, (column) => {
        if (queryDef.isDBFunctionsAggregate(column.selectionType)) {
          let form: SourceList = inputSourceList[0];
          _.find(inputSourceList, function (f) {
            if (column.selectionColumnName.includes(f.sourceFormName)) {
              form = f;
            }
          });
          let tempColumnName = column.selectionColumnName.substring(
            column.selectionColumnName.indexOf(ARROW) + ARROW.length,
            column.selectionColumnName.length
          );

          metaHavingNames = metaHavingNames.concat({
            text: column.selectionColumnName,
            value: {
              formName: form.sourceFormName,
              formAlias: form.sourceAlias,
              columnName: tempColumnName,
            },
          });
        }
      });
      if (inputCalculatedFieldList !== undefined) {
        _.each(inputCalculatedFieldList, (field) => {
          if (field.selectionCalculatedFields !== CALCULATED_FIELD) {
            let form: SourceList = inputSourceList[0];
            _.find(inputSourceList, function (f) {
              if (field.selectionAlias.includes(f.sourceFormName)) {
                form = f;
              }
            });
            let tempColumnName = $scope.replaceSpaceWithUnderscore(field.selectionAlias);
            metaHavingNames = metaHavingNames.concat({
              text: field.selectionAlias,
              value: {
                formName: form.sourceFormName,
                formAlias: form.sourceAlias,
                columnName: tempColumnName,
                isCalculatedField: true,
              },
            });
          }
        });
      }
      $scope.inputAutoComplete.fieldName = metaHavingNames;
      if (
        $rootScope.inputAutoComplete !== undefined &&
        $rootScope.inputAutoComplete[$scope.target.guid] !== undefined &&
        $rootScope.inputAutoComplete[$scope.target.guid].metaHavingNames !== undefined
      ) {
        $rootScope.inputAutoComplete[$scope.target.guid].metaHavingNames = metaHavingNames;
      }
    };

    $scope.addColumnTypeMenu = function (menu: { text: any; value: any }, subMenu: { text: any; value: any }) {
      let menuValue = menu.value;
      if (subMenu && subMenu.value) {
        menuValue = subMenu.value;
      }
      $scope.inputValue.leftOperand.fieldType = menuValue;
      $scope.onColumnTypeChange();
    };

    $scope.onColumnTypeChange = () => {
      if (inputQualification.leftOperand) {
        inputQualification.leftOperand.fieldType = $scope.inputValue.leftOperand.fieldType;
      }

      // refresh qualification for all scopes
      $rootScope.appEvent('remedy-qual-query-updated');

      // $scope.generateSQL();
      $scope.onChange();
    };

    $scope.onColumnNameChange = () => {
      // Remove previously added alias
      if ($scope.inputAutoComplete.fieldAlias.length === 3) {
        $scope.inputAutoComplete.fieldAlias.splice(0, 1);
      }
      // Add new alias
      $scope.inputAutoComplete.fieldAlias.splice(0, 0, {
        text: $scope.inputAutoComplete.fieldName.columnName,
        value: $scope.inputAutoComplete.fieldName.columnName,
      });

      let tempFormName = $scope.inputValue.leftOperand.fieldName;

      // Assign column as Form Name and Column Value
      if (inputQualification.leftOperand) {
        if (inputQualification.leftOperand.fieldName.isCalculatedField === true) {
          inputQualification.leftOperand.fieldName = tempFormName.columnName;
        } else {
          inputQualification.leftOperand.fieldName = tempFormName.formName + ARROW + tempFormName.columnName;
        }
        inputQualification.leftOperand.fieldAlias = $scope.inputValue.leftOperand.fieldAlias;
      }

      // Assign Source Alias
      _.some($rootScope.inputAutoComplete[$scope.target.guid].metaFullFormNames, (srcAlias) => {
        if (inputQualification.leftOperand && inputQualification.leftOperand.fieldName.includes(srcAlias.text)) {
          if (inputForm.useAlias) {
            $scope.inputValue.leftOperand.formAlias = tempFormName.formAlias;
          } else {
            $scope.inputValue.leftOperand.formAlias = tempFormName.formName;
          }
          if (inputQualification.leftOperand) {
            inputQualification.leftOperand.fieldSourceAlias = $scope.inputValue.leftOperand.formAlias;
          }
          if (inputQualification.rightOperand) {
            inputQualification.rightOperand.fieldSourceAlias = $scope.inputValue.leftOperand.formAlias;
          }
          return;
        }
      });

      // refresh qualification for all scopes
      $rootScope.appEvent('remedy-qual-query-updated');

      // $scope.generateSQL();
      $scope.onChange();
    };

    $scope.onLogicalOperatorChange = () => {
      inputQualification.logicalOperator = $scope.inputValue.logicalOperator;

      // refresh qualification for all scopes
      $rootScope.appEvent('remedy-qual-query-updated');

      // $scope.generateSQL();
      $scope.onChange();
    };

    $scope.onRelationalOperatorChange = () => {
      inputQualification.relationalOperator = $scope.inputValue.relationalOperator;
      if (
        inputQualification.rightOperand &&
        (inputQualification.relationalOperator === queryDef.DBOperator.Is.value ||
          inputQualification.relationalOperator === queryDef.DBOperator.IsNot.value)
      ) {
        inputQualification.rightOperand.fieldValue = NULL;
      }
      $scope.onInputValueChangeCalculate();
      // refresh qualification for all scopes
      $rootScope.appEvent('remedy-qual-query-updated');

      // $scope.generateSQL();
      $scope.onChange();
    };

    $scope.onInputValueChangeCalculate = () => {
      // Recalulated the input box length
      if (inputQualification.rightOperand) {
        $scope.inputValue.valueLength = Math.min(20, Math.max(7, $scope.inputValue.rightOperand.fieldValue.length));
        if (
          inputQualification.relationalOperator === queryDef.DBOperator.Is.value ||
          inputQualification.relationalOperator === queryDef.DBOperator.IsNot.value
        ) {
          $scope.inputValue.rightOperand.fieldValue = NULL;
          inputQualification.rightOperand.fieldValue = NULL;
        } else {
          inputQualification.rightOperand.fieldValue = $scope.inputValue.rightOperand.fieldValue;
        }
      }
    };
    $scope.onInputValueChange = () => {
      $scope.onInputValueChangeCalculate();
      // refresh qualification for all scopes
      $rootScope.appEvent('remedy-qual-query-updated');

      $scope.onChange();
    };

    $scope.toggleHideWhereQuery = () => {
      if ($scope.qualType === 'Where') {
        $scope.showHideQual = inputForm.hideQual;
        $scope.remedyForm.hideQual = inputForm.hideQual;
      }

      $rootScope.appEvent('remedy-qual-query-updated');

      $scope.onChange();
    };

    $scope.toggleHideHavingQuery = () => {
      if ($scope.qualType === 'Having') {
        $scope.showHideQual = inputForm.hideHaving;
        $scope.remedyForm.hideHaving = inputForm.hideHaving;
      }

      $rootScope.appEvent('remedy-qual-query-updated');

      // $scope.generateSQL();
      $scope.onChange();
    };

    $scope.toggleShowHideQuery = () => {
      // Toggle all row for show Hide
      if ($scope.qualType === 'Where') {
        inputForm.hideQual = !inputForm.hideQual;
        $rootScope.appEvent('remedy-where-query-updated');
      }
      if ($scope.qualType === 'Having') {
        inputForm.hideHaving = !inputForm.hideHaving;
        $rootScope.appEvent('remedy-having-query-updated');
      }

      // $scope.generateSQL();
      $scope.onChange();
    };

    $scope.toggleUseOneEqualOne = () => {
      $scope.inputValue.useOneEqualOne = !$scope.inputValue.useOneEqualOne;
      inputForm.useOneEqualOne = $scope.inputValue.useOneEqualOne;

      // $scope.generateSQL();
      $scope.onChange();
    };

    $scope.toggleGroup = () => {
      $scope.inputValue.showGroup = !$scope.inputValue.showGroup;

      $scope.onChange();
    };

    $scope.collapseGroup = () => {
      _.each(inputQualificationList, function (qual, index) {
        if (index === 0) {
          return;
        }
        qual.collapseGroup = !qual.collapseGroup;
      });
    };

    $scope.shiftRightAndStartGroupQualification = () => {
      if ($scope.showHideQual || $scope.index === 0) {
        return;
      }
      $scope.inputValue.splitGroup = true;
      inputQualification.splitGroup = true;
      inputQualification.groupCounter += 1;
      // Calculate Group Hierarchy
      let prevGroup = inputQualificationList[$scope.index - 1];
      // E.g. Previous Element = G1.G2.G3
      // E.g. Previous Element = G1.G2.G3
      // E.g. Current Element = G1.G2.G4
      inputQualification.groupHierarchy += DOT + GROUP_IDENTIFIER + (prevGroup.groupCounter + 1);
      $scope.inputValue = inputQualification;

      // refresh qualification for all scopes
      $rootScope.appEvent('remedy-qual-query-updated');

      // $scope.generateSQL();
      $scope.onChange();
    };

    $scope.shiftRightQualification = () => {
      if ($scope.showHideQual) {
        return;
      }
      inputQualification.groupCounter += 1;
      // Calculate Group Hierarchy
      inputQualification.groupHierarchy += DOT + GROUP_IDENTIFIER + inputQualification.groupCounter;
      $scope.inputValue = inputQualification;

      // refresh qualification for all scopes
      $rootScope.appEvent('remedy-qual-query-updated');

      // $scope.generateSQL();
      $scope.onChange();
    };

    $scope.shiftLeftQualification = () => {
      if ($scope.showHideQual) {
        return;
      }
      if (inputQualification.groupCounter === 1) {
        return;
      }
      $scope.inputValue.splitGroup = false;
      inputQualification.splitGroup = false;
      inputQualification.groupCounter -= 1;
      // Calculate Group Hierarchy from G1.G2 => G1
      inputQualification.groupHierarchy = inputQualification.groupHierarchy.substring(
        0,
        inputQualification.groupHierarchy.lastIndexOf(DOT)
      );
      $scope.inputValue = inputQualification;

      // refresh qualification for all scopes
      $rootScope.appEvent('remedy-qual-query-updated');

      // $scope.generateSQL();
      $scope.onChange();
    };

    $scope.removeQualification = () => {
      if ($scope.showHideQual) {
        return;
      }
      if ($scope.index === 0) {
        if (inputQualificationList.length !== 1) {
          inputQualificationList.splice(inputQualificationList.length - 1, 1);
        }
      } else {
        inputQualificationList.splice($scope.index, 1);
      }

      // refresh qualification for all scopes
      $rootScope.appEvent('remedy-qual-query-updated');

      // $scope.generateSQL();
      $scope.onChange();
    };

    $scope.addQualification = () => {
      if ($scope.showHideQual) {
        return;
      }
      inputQualification.logicalOperator = OPERATOR_AND;
      const addIndex = $scope.index + 1;

      let leftOperand = new LeftOperand(COLUMN_TYPE_FIELD, null, COLUMN_TYPE_SELECT_COLUMN_NAME, EMPTY);
      let rightOperand = new RightOperand(VALUE, null, CHAR, EMPTY, COLUMN_TYPE_SELECT_COLUMN_NAME, EMPTY);
      let relationalQualification = new Qualification(
        true,
        inputQualification.groupCounter,
        inputQualification.groupHierarchy,
        RELATIONAL,
        OPERATOR_AND,
        OPERATOR_EQUAL,
        null,
        null,
        leftOperand,
        rightOperand
      );

      if ($scope.index !== 0) {
        relationalQualification.splitGroup = inputQualification.splitGroup;
      }
      inputQualificationList.splice(addIndex, 0, relationalQualification);

      // refresh qualification for all scopes
      $rootScope.appEvent('remedy-qual-query-updated');

      // $scope.generateSQL();
      $scope.onChange();
    };

    $scope.generateSQL = () => {
      // inputForm.meta.rawSql = queryBuilder.buildFullSql(inputForm);
      // $scope.onChange();
    };

    $scope.init();
    $scope.updateAllColumns();
  }
}

export function remedyQualQuery() {
  return {
    templateUrl: TEMPLATE_BASE_URL + '/partials/remedy/remedy.qual.query.html',
    controller: RemedyQualQueryCtrl,
    controllerAs: 'remedyqualctrl',
    restrict: 'E',
    scope: {
      target: '=',
      qualification: '=',
      qualifications: '=',
      showhide: '=',
      qualtype: '=',
      index: '=',
      datasource: '=',
      onChange: '&',
    },
  };
}

coreModule.directive('remedyQualQuery', remedyQualQuery);
