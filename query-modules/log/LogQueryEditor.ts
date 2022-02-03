import * as queryDef from './log_query_def';
import angular from 'angular';
import _ from 'lodash';
import coreModule from 'grafana/app/core/core_module';
import './bucket_agg';
import './metric_agg';
import './pipeline_variables';
import { LogAggregation } from './logTypes';
import { TEMPLATE_BASE_URL, SOURCE_TYPE_LOG } from 'Constants';

export class LogQueryEditorCtrl {
  rawQueryOld: string | undefined;
  /** @ngInject */
  constructor($scope: any, $rootScope: any, uiSegmentSrv: any) {
    $scope.target.sourceQuery = $scope.target.sourceQuery || {};
    $scope.target.sourceQuery.metrics = $scope.target.sourceQuery.metrics || [queryDef.defaultMetricAgg()];
    $scope.target.sourceQuery.bucketAggs = $scope.target.sourceQuery.bucketAggs || [queryDef.defaultBucketAgg()];
    const queryHandlerInstance = $scope.datasource.getQueryHandlerInstance(SOURCE_TYPE_LOG);
    if ($scope.target.sourceQuery.bucketAggs.length === 0) {
      const metric = $scope.target.sourceQuery.metrics[0];
      if (!metric || metric.type !== 'raw_document') {
        $scope.target.sourceQuery.bucketAggs = [queryDef.defaultBucketAgg()];
      }
      $scope.queryctrl.refresh();
    }

    $scope.handleQueryError = function(err: any): any[] {
      this.error = err.message || 'Failed to issue metric query';
      return [];
    };

    $scope.getFields = function(type: any) {
      const jsonStr = angular.toJson({ find: 'fields', type: type });
      return $scope
        .metricQuery(jsonStr)
        .then(uiSegmentSrv.transformToSegments(false))
        .catch($scope.handleQueryError.bind(this));
    };

    $scope.queryUpdated = () => {
      // As Raw Data and Raw Document have the same request, we need to run refresh if they are updated
      const isPossiblyRawDataSwitch = $scope.target.sourceQuery.metrics.some(
        (metric: any) => metric.type === 'raw_data' || metric.type === 'raw_document'
      );
      const newJson = angular.toJson($scope.buildQueryBuilder(), true);
      if (this.rawQueryOld && newJson !== this.rawQueryOld) {
        $scope.queryctrl.refresh();
      } else if (isPossiblyRawDataSwitch) {
        $scope.queryctrl.refresh();
      }

      this.rawQueryOld = newJson;
      $rootScope.appEvent('elastic-query-updated');
    }

    $scope.getCollapsedText = () => {
      const metricAggs: LogAggregation[] = $scope.target.sourceQuery.metrics;
      const bucketAggs = $scope.target.sourceQuery.bucketAggs;
      const metricAggTypes = queryDef.getMetricAggTypes();
      const bucketAggTypes = queryDef.bucketAggTypes;
      let text = '';

      if ($scope.target.sourceQuery.query) {
        text += 'Query: ' + $scope.target.sourceQuery.query + ', ';
      }

      text += 'Metrics: ';

      _.each(metricAggs, (metric, index) => {
        const aggDef: any = _.find(metricAggTypes, { value: metric.type });
        text += aggDef.text + '(';
        if (aggDef.requiresField) {
          text += metric.field;
        }
        if (aggDef.supportsMultipleBucketPaths) {
          text += metric.settings.script.replace(new RegExp('params.', 'g'), '');
        }
        text += '), ';
      });

      _.each(bucketAggs, (bucketAgg: any, index: number) => {
        if (index === 0) {
          text += ' Group by: ';
        }

        const aggDef: any = _.find(bucketAggTypes, { value: bucketAgg.type });
        text += aggDef.text + '(';
        if (aggDef.requiresField) {
          text += bucketAgg.field;
        }
        text += '), ';
      });

      if ($scope.target.sourceQuery.alias) {
        text += 'Alias: ' + $scope.target.sourceQuery.alias;
      }

      return text;
    };

    $scope.metricQuery = function(query: any) {
      query = angular.fromJson(query);
      return queryHandlerInstance.metricFindQuery(query);
    };

    $scope.buildQueryBuilder = function() {
      queryHandlerInstance.queryBuilder.build(this.target.sourceQuery);
    };

    $scope.queryUpdated();
    //$scope.queryctrl.refresh();
  }
}

export function logQueryEditor() {
  return {
    templateUrl: TEMPLATE_BASE_URL + '/partials/log/log.query.editor.html',
    controller: LogQueryEditorCtrl,
    controllerAs: 'logCtrl',
    restrict: 'E',
    scope: {
      target: '=',
      datasource: '=',
      queryctrl: '=',
    },
  };
}

coreModule.directive('logQueryEditor', logQueryEditor);
