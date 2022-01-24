import { ItsmInsightsConstants } from '../ItsmInsightsConstants';
import { AbstItsmInsightsRequestHandler } from './AbstItsmInsightsRequestHandler';
import { EmergingIncidentClustersRequestHandler } from './EmergingIncidentClustersRequestHandler';
import { ExecutionsRequestHandler } from './ExecutionsRequestHandler';
import { ItsmInsightsDefaultRequestHandler } from './ItsmInsightsDefaultRequestHandler';
import { JobsRequestHandler } from './JobsRequestHandler';

export class ItsmInsightsRquestHandlerFactory {
  static getRequestHandler(type: string): AbstItsmInsightsRequestHandler {
    switch (type) {
      case ItsmInsightsConstants.NUMBER_OF_JOBS_CREATED:
        return JobsRequestHandler.getInstance();
      case ItsmInsightsConstants.NUMBER_OF_JOB_EXECUTIONS:
        return ExecutionsRequestHandler.getInstance();
      case ItsmInsightsConstants.TOP_EMERGING_CLUSTERS:
        return EmergingIncidentClustersRequestHandler.getInstance();
      default:
        return new ItsmInsightsDefaultRequestHandler();
    }
  }
}
