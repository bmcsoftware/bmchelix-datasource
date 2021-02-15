import { MetricQueryEditor } from './MetricQueryEditor';
import coreModule from 'grafana/app/core/core_module';
import ReactDOM from 'react-dom';
import React from 'react';
import angular from 'angular';

const metricQuery = ($injector: any): any => {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      target: '=',
      datasource: '=',
      queryctrl: '=',
    },
    link: function(scope: any, elem: Element[], attrs: any) {
      const renderMyComponent = () => {
        const dataSource = scope.datasource.getQueryHandlerInstance(scope.target.sourceType);
        const prop = {
          target: scope.target,
          datasource: dataSource,
          queryctrl: scope.queryctrl,
        };

        renderComponent(MetricQueryEditor, prop, scope, elem);
      };

      // If there are props, re-render when they change
      attrs.props ? watchProps(attrs.watchDepth, scope, [attrs.props], renderMyComponent) : renderMyComponent();

      // cleanup when scope is destroyed
      scope.$on('$destroy', () => {
        if (!attrs.onScopeDestroy) {
          ReactDOM.unmountComponentAtNode(elem[0]);
        } else {
          scope.$eval(attrs.onScopeDestroy, {
            unmountComponent: ReactDOM.unmountComponentAtNode.bind(this, elem[0]),
          });
        }
      });
    },
  };
};

function renderComponent(component: any, props: object, scope: any, elem: Element[]) {
  scope.$evalAsync(() => {
    ReactDOM.render(React.createElement(component, props), elem[0]);
  });
}

function watchProps(watchDepth: string, scope: any, watchExpressions: any[], listener: any) {
  const supportsWatchCollection = angular.isFunction(scope.$watchCollection);
  const supportsWatchGroup = angular.isFunction(scope.$watchGroup);

  const watchGroupExpressions = [];

  for (const expr of watchExpressions) {
    const actualExpr = getPropExpression(expr);
    const exprWatchDepth = getPropWatchDepth(watchDepth, expr);

    // ignore empty expressions & expressions with functions
    if (!actualExpr || actualExpr.match(/\(.*\)/) || exprWatchDepth === 'one-time') {
      continue;
    }

    if (exprWatchDepth === 'collection' && supportsWatchCollection) {
      scope.$watchCollection(actualExpr, listener);
    } else if (exprWatchDepth === 'reference' && supportsWatchGroup) {
      watchGroupExpressions.push(actualExpr);
    } else {
      scope.$watch(actualExpr, listener, exprWatchDepth !== 'reference');
    }
  }

  if (watchDepth === 'one-time') {
    listener();
  }

  if (watchGroupExpressions.length) {
    scope.$watchGroup(watchGroupExpressions, listener);
  }
}

function getPropExpression(prop: any) {
  return Array.isArray(prop) ? prop[0] : prop;
}

function getPropWatchDepth(defaultWatch: string, prop: string | any[]) {
  const customWatchDepth = Array.isArray(prop) && angular.isObject(prop[1]) && prop[1].watchDepth;
  return customWatchDepth || defaultWatch;
}

coreModule.directive('metricQuery', ['$injector', metricQuery]);
