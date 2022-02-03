import coreModule from 'grafana/app/core/core_module';
import _ from 'lodash';
import * as queryDef from './remedy_query_def';
import { HeaderList } from './RemedyTypes';
import { TEMPLATE_BASE_URL } from 'Constants';

export class RemedyHeaderQueryCtrl {
  /** @ngInject */
  constructor($scope: any, uiSegmentSrv: any, $rootScope: any) {
    const inputRemedyHeader = $scope.target.header;
    const inputHeaderList: HeaderList[] = $scope.target.header.headerList;
    // Must be first, hack to init global data
    // if not present, Init on root scope
    if ($rootScope.inputAutoComplete === undefined) {
      $rootScope.inputAutoComplete = {};
    }
    if ($rootScope.inputAutoComplete[$scope.target.guid] === undefined) {
      $rootScope.inputAutoComplete[$scope.target.guid] = queryDef.getAutoComplete();
    }

    $scope.init = () => {
      $scope.remedyForm = inputRemedyHeader;
      $scope.remedyForm.hideHeader = inputRemedyHeader.hideHeader;
      $scope.remedyForm.collapseHeader = true;

      $scope.remedyHeaderList = inputHeaderList;
      $scope.remedyHeaderList.collapseHeader = inputHeaderList[$scope.index].collapseHeader;

      $scope.inputValue = {
        sourceText: inputHeaderList[$scope.index].text || queryDef.HeaderFunctions.RowLimit.text,
        sourceValue: inputHeaderList[$scope.index].value || queryDef.HeaderFunctions.RowLimit.value,
        sourceCollapseHeader:
          inputHeaderList[$scope.index].collapseHeader || queryDef.HeaderFunctions.RowLimit.collapseHeader,
        sourceDataType: inputHeaderList[$scope.index].dataType || queryDef.HeaderFunctions.RowLimit.dataType,
        sourceARType: inputHeaderList[$scope.index].arType || queryDef.HeaderFunctions.RowLimit.arType,
        sourceARKey: inputHeaderList[$scope.index].arKey || queryDef.HeaderFunctions.RowLimit.arKey,
      };

      $scope.inputAutoComplete = {
        sourceHeader: queryDef.getHeaderFunctions(),
        sourceValue:
          $scope.inputValue.sourceText === queryDef.HeaderFunctions.Locale.text
            ? $rootScope.inputAutoComplete[$scope.target.guid].locale
            : $rootScope.inputAutoComplete[$scope.target.guid].timezone,
      };

      $scope.validateModel();
    };

    $rootScope.onAppEvent(
      'remedy-header-query-updated',
      () => {
        $scope.validateModel();
      },
      $scope
    );

    $scope.validateModel = () => {
      $scope.isFirst = $scope.index === 0;
      $scope.isSingle = inputHeaderList.length === 1;
      $scope.remedyHeaderList = inputHeaderList;
      if ($scope.isFirst) {
        inputHeaderList[$scope.index].collapseHeader = false;
      }
      $scope.remedyHeaderList.collapseHeader = inputHeaderList[$scope.index].collapseHeader;
    };

    $scope.addHeaderTypeMenu = function (menu: { text: any; value: any }, subMenu: { text: any; value: any }) {
      let menuValue = menu.value;
      if (subMenu && subMenu.value) {
        menuValue = subMenu.value;
      }
      $scope.inputValue.sourceText = menu.text;
      $scope.inputValue.sourceValue = menuValue;
      $scope.onHeaderTypeChange();
    };

    $scope.onHeaderTypeChange = () => {
      inputHeaderList[$scope.index].text = $scope.inputValue.sourceText;
      inputHeaderList[$scope.index].value = $scope.inputValue.sourceValue;
      inputHeaderList[$scope.index].collapseHeader = $scope.inputValue.sourceCollapseHeader;
      // Data Type
      $scope.inputValue.sourceDataType = queryDef.getHeaderDataType($scope.inputValue.sourceText).dataType;
      inputHeaderList[$scope.index].dataType = $scope.inputValue.sourceDataType;
      // AR type
      $scope.inputValue.sourceARType = queryDef.getHeaderDataType($scope.inputValue.sourceText).arType;
      inputHeaderList[$scope.index].arType = $scope.inputValue.sourceARType;
      // AR Key
      $scope.inputValue.sourceARKey = queryDef.getHeaderDataType($scope.inputValue.sourceText).arKey;
      inputHeaderList[$scope.index].arKey = $scope.inputValue.sourceARKey;

      // Set selection list
      switch ($scope.inputValue.sourceText) {
        case queryDef.HeaderFunctions.Locale.text:
          $scope.inputAutoComplete.sourceValue = $rootScope.inputAutoComplete[$scope.target.guid].locale;
          break;
        case queryDef.HeaderFunctions.Timezone.text:
          $scope.inputAutoComplete.sourceValue = $rootScope.inputAutoComplete[$scope.target.guid].timezone;
          break;
        default:
          break;
      }

      $scope.onChange();
    };

    $scope.onInputValueChangeCalculate = () => {
      inputHeaderList[$scope.index].value = $scope.inputValue.sourceValue;

      $scope.onChange();
    };

    $scope.addRemedyHeader = () => {
      if ($scope.remedyForm.hideHeader) {
        return;
      }
      const addIndex = inputHeaderList.length;
      // Add new element at the end
      let defaultHeaderList = new HeaderList(
        queryDef.HeaderFunctions.DateFormat.text,
        queryDef.HeaderFunctions.DateFormat.value,
        queryDef.HeaderFunctions.DateFormat.collapseHeader,
        queryDef.HeaderFunctions.DateFormat.dataType,
        queryDef.HeaderFunctions.DateFormat.arType,
        queryDef.HeaderFunctions.DateFormat.arKey
      );

      inputHeaderList.splice(addIndex, 0, defaultHeaderList);

      $rootScope.appEvent('remedy-header-query-updated');
      $scope.onChange();
    };

    $scope.removeRemedyHeader = () => {
      if ($scope.remedyForm.hideHeader) {
        return;
      }
      if ($scope.index === 0) {
        inputHeaderList.splice(inputHeaderList.length - 1, 1);
      } else {
        inputHeaderList.splice($scope.index, 1);
      }

      $rootScope.appEvent('remedy-header-query-updated');
      $scope.onChange();
    };

    $scope.toggleShowHeaderQuery = () => {
      $scope.remedyForm.hideHeader = !$scope.remedyForm.hideHeader;
      inputRemedyHeader.hideHeader = $scope.remedyForm.hideHeader;

      $rootScope.appEvent('remedy-header-query-updated');
      $scope.onChange();
    };

    $scope.collapseHeader = () => {
      $scope.remedyForm.collapseHeader = !$scope.remedyForm.collapseHeader;
      _.each(inputHeaderList, function (header, index) {
        if (index !== 0) {
          header.collapseHeader = !header.collapseHeader;
        }
      });

      $rootScope.appEvent('remedy-header-query-updated');
      $scope.onChange();
    };

    $scope.init();
  }
}

export function remedyHeaderQuery() {
  return {
    templateUrl: TEMPLATE_BASE_URL + '/partials/remedy/remedy.header.query.html',
    controller: RemedyHeaderQueryCtrl,
    controllerAs: 'remedyheaderctrl',
    restrict: 'E',
    scope: {
      target: '=',
      index: '=',
      datasource: '=',
      onChange: '&',
    },
  };
}

coreModule.directive('remedyHeaderQuery', remedyHeaderQuery);
