import { auto } from 'angular';
import _ from 'lodash';
import { QueryCtrl } from 'grafana/app/plugins/sdk';
import { defaultQuery, queryTypeOptionRemedy, queryTypeOptions } from './types';
import './query-modules/event/EventQueryEditor';
import './query-modules/log/LogQueryEditor';
import './query-modules/metric/metricQuery';
import './query-modules/cloudsecurity/CloudSecurityQueryEditor';
import './query-modules/remedy/RemedyQueryEditor';
import * as Constants from 'Constants';

export class BMCDataSourceQueryCtrl extends QueryCtrl {
  static templateUrl = 'partials/query.editor.html';
  constants = Constants;

  /** @ngInject */
  constructor($scope: any, $injector: auto.IInjectorService) {
    super($scope, $injector);
    _.defaults(this.target, defaultQuery);
    this.target.queryTypeOptions = queryTypeOptions;


    // Validate Feature Flag
    if (getFeatureStatus(Constants.SOURCE_TYPE_REMEDY)) {
      // Add if Remedy is not present
      if (!this.target.queryTypeOptions.find((x: { sourceType: any }) => x.sourceType === 'remedy')) {
        this.target.queryTypeOptions.push(queryTypeOptionRemedy[0]);
      }
    }
  }
  onqueryTypeChange() {
    console.log('Selected Query type: ' + this.target.sourceType);
    this.target.sourceQuery = {};
  }
}

export function getFeatureStatus(featureName: string) {
  // if local storage exist and contain the provided feature return true (to enable the feature), otherwise return false to hide this feature.
  const KeyEnabledFeatures = localStorage.getItem(Constants.ENABLED_FEATURES);
  if (KeyEnabledFeatures && KeyEnabledFeatures.includes(featureName)) {
    return true;
  } else {
    return false;
  }
}
