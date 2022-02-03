import _ from 'lodash';
import coreModule from 'grafana/app/core/core_module';
import { TEMPLATE_BASE_URL } from 'Constants';
import { RemedyDataSourceQuery, RemedyForm } from './RemedyTypes';
import * as queryDef from './remedy_query_def';
import './remedy.header.query';
import './remedy.form.query';
import './remedy.column.query';
import './remedy.group.query';
import './remedy.having.query';
import './remedy.order.query';
import './remedy.where.query';
import './remedy.qual.query';
import './remedy.calculated.query';
import angular from 'angular';
import { RemedyQueryBuilder } from './remedy_query_builder';
import { KEYWORD_SQL } from './remedy_literal_string';

export class RemedyQueryEditorCtrl {
  queryType: any[] = queryDef.queryType;
  formatAs: any[] = queryDef.formatAs;
  default: Partial<RemedyDataSourceQuery> = {
    sourceQuery: queryDef.getRemedyQuery(),
  };

  dstType: any[] = queryDef.dstType;

  /** @ngInject */
  constructor($scope: any, $rootScope: any, uiSegmentSrv: any) {
    $scope.target.sourceQuery.guid = $scope.target.sourceQuery.guid || this.default.sourceQuery?.guid;

    // Must be first, hack to init global data
    // if not present, Init on rootscope
    $rootScope.inputAutoComplete = {
      [$scope.target.sourceQuery.guid]: queryDef.getAutoComplete(),
    };

    $scope.target.queryType = $scope.target.queryType || this.queryType;
    $scope.target.sourceQuery.queryType = $scope.target.sourceQuery.queryType || this.default.sourceQuery?.queryType;
    $scope.target.sourceQuery.dstType = $scope.target.sourceQuery.dstType || this.default.sourceQuery?.dstType;
    $scope.target.sourceQuery.formatAs = $scope.target.sourceQuery.formatAs || this.default.sourceQuery?.formatAs;
    $scope.target.sourceQuery.rawQuery = $scope.target.sourceQuery.rawQuery || this.default.sourceQuery?.rawQuery;
    $scope.target.sourceQuery.form = $scope.target.sourceQuery.form || this.default.sourceQuery?.form;
    $scope.target.sourceQuery.header = $scope.target.sourceQuery.header || this.default.sourceQuery?.header;
    $scope.target.sourceQuery.guid = $scope.target.sourceQuery.guid || this.default.sourceQuery?.guid;

    let queryBuilder: RemedyQueryBuilder = new RemedyQueryBuilder();

    $scope.handleQueryError = function (err: any): any[] {
      this.error = err.message || 'Failed to issue remedy query';
      return [];
    };

    $rootScope.onAppEvent(
      'remedy-qual-query-updated',
      () => {
        $scope.queryUpdated();
      },
      $scope
    );

    $scope.onQueryTypeChange = function () {
      let form: RemedyForm = $scope.target.sourceQuery.form;
      if ($scope.target.sourceQuery.queryType === KEYWORD_SQL && form.meta.syncToSql) {
        $scope.target.sourceQuery.rawQuery = form.meta.rawSql;
        form.meta.syncToSql = false;
      }
    };

    $scope.generate = function () {
      let form: RemedyForm = $scope.target.sourceQuery.form;
      if (form.meta.hideSql) {
        form.meta.rawSql = queryBuilder.buildFullSql($scope.target.sourceQuery.form);
      }

      // Generate JSON
      if (form.meta.hideJson) {
        let outputForm = queryBuilder.build($scope.target);
        form.meta.rawJson = angular.toJson(outputForm, 2);
      }
    };

    $scope.queryUpdated = function () {
      $scope.generate();
      $scope.queryctrl.refresh();

      $rootScope.appEvent('remedy-query-updated');
    };

    $scope.onUseDistinctChange = () => {
      $scope.queryUpdated();
    };

    $scope.onMaxEntries = () => {
      let inputForm: RemedyForm = $scope.target.sourceQuery.form;
      if (
        !+inputForm.maxEntries ||
        !Number.isInteger(+inputForm.maxEntries) ||
        inputForm.maxEntries < 0 ||
        inputForm.maxEntries > Number.MAX_SAFE_INTEGER
      ) {
        inputForm.maxEntries = 100;
      }

      $scope.queryUpdated();
    };

    $scope.queryUpdated();
  }
}

export function remedyQueryEditor() {
  return {
    templateUrl: TEMPLATE_BASE_URL + '/partials/remedy/remedy.query.editor.html',
    controller: RemedyQueryEditorCtrl,
    controllerAs: 'remedyctrl',
    restrict: 'E',
    scope: {
      target: '=',
      datasource: '=',
      queryctrl: '=',
    },
  };
}

coreModule.directive('remedyQueryEditor', remedyQueryEditor);
