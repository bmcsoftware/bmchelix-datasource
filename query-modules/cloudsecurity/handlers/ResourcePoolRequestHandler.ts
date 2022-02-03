import { BMCDataSourceQuery } from '../../../types';
import { DataQueryRequest, DataQueryResponse } from '@grafana/data';
import { CSConstants } from '../CloudSecurityConstants';
import { CSResponseParser } from './CSResponseHandler';
import { AbstCSRequestHandler } from './AbstCSRequestHandler';

export class ResourcePoolRequestHandler extends AbstCSRequestHandler {
  private static instance: ResourcePoolRequestHandler;
  private constructor() {
    super();
  }

  public static getInstance() {
    if (!ResourcePoolRequestHandler.instance) {
      ResourcePoolRequestHandler.instance = new ResourcePoolRequestHandler();
    }
    return ResourcePoolRequestHandler.instance;
  }

  async handleRequest(ds: any, options: DataQueryRequest<BMCDataSourceQuery>, target: any): Promise<DataQueryResponse> {
    let rpRiskRequestObject = ds.queryBuilder.buildResourcePoolRiskQuery(options);
    const rpRiskRequest = JSON.stringify(rpRiskRequestObject);
    let resourcePoolAtRiskMap = new Map<string, string>();
    return this.post(ds, CSConstants.RESOURCE_POOL_RISK_SEARCH_URL, rpRiskRequest)
      .then((response: any) => {
        if (response && response.data && response.data.data.length !== 0) {
          resourcePoolAtRiskMap = this.getResourcePoolAtRiskMap(response.data.data);
          if (resourcePoolAtRiskMap.size === 0) {
            return;
          }
          let resourcePoolRequestObject = ds.queryBuilder.buildResourcePoolQuery(options, resourcePoolAtRiskMap);
          const resourcePoolRequest = JSON.stringify(resourcePoolRequestObject);

          return this.post(ds, CSConstants.RESOURCE_POOL_SEARCH_URL, resourcePoolRequest);
        } else {
          return;
        }
      })
      .then(response => {
        try {
          return new CSResponseParser(response, target.refId).parseResourcePoolQueryResult(
            resourcePoolAtRiskMap,
            target
          );
        } catch (err) {
          console.log(err);
          throw { message: CSConstants.CS_RESPONSE_ERROR };
        }
      });
  }

  getResourcePoolAtRiskMap(response: any): Map<string, string> {
    let resourcePoolAtRiskMap = new Map<string, string>();
    response.forEach((data: any) => {
      resourcePoolAtRiskMap.set(data['resourcePools.poolId'], data.count);
    });
    return resourcePoolAtRiskMap;
  }
}
