import _ from 'lodash';
import { TimeRange, MetricFindValue } from '@grafana/data';
import { MetricEntityDatasource, RequestOptions } from './MetricEntityDatasource';
import { EntityConstants } from './EntityConstants';

export default class EntityQueryFind {
  range: TimeRange;

  constructor(private datasource: MetricEntityDatasource, private query: string, private timeSrv: any) {
    this.datasource = datasource;
    this.query = query;
    this.range = this.timeSrv.timeRange();
  }

  process() {
    const getTagKeysRegex = /^get_tag_keys\((?:(.+),\s*)?([a-zA-Z_][a-zA-Z0-9_]*)\)\s*$/;
    const getTagValuesRegex = /^get_tag_values\((?:(.+),\s*)?([a-zA-Z_][a-zA-Z0-9_]*)\)\s*$/;
    const getEntityIdsRegex = /^get_entity_ids\((?:(.+),\s*)(?:(.+),\s*)(\{[^}]*\})\)\s*$/;

    const get_tag_keys = this.query.match(getTagKeysRegex);
    if (get_tag_keys) {
        return this.get_tag_keys(get_tag_keys[2]);
    }

    const get_tag_values = this.query.match(getTagValuesRegex);
    if (get_tag_values) {
        return this.get_tag_values(get_tag_values[1], get_tag_values[2]);
    }

    const get_entity_ids = this.query.match(getEntityIdsRegex);
    if (get_entity_ids) {
      return this.get_entity_ids(get_entity_ids[1], get_entity_ids[2], get_entity_ids[3]);
    }

    // if query contains full metric name, return metric name and label list

    const res = new Promise<MetricFindValue[]>((resolve) => {        
      resolve([{ text: '' } as MetricFindValue]);    
    });  

    return res;   

  }

  get_tag_keys(type: string) {
    let url: string;

    // return label values globally
    url = EntityConstants.MANAGED_OBJECT_SERVICE_URL + '/keys?entityType=' + type;

    return this.datasource.metadataRequest(url, {}, null).then((result: any) => {
      console.log(result);
      return _.map(result.data, value => {
        return { text: value };
      }) as MetricFindValue[];;
    });
  }

  get_tag_values(type: string, tag_key: string) {
    let url: string;

    // return label values globally
    url = EntityConstants.MANAGED_OBJECT_SERVICE_URL + '/values?entityType=' + type + '&tagKey=' + tag_key;

    return this.datasource.metadataRequest(url, {}, null).then((result: any) => {
      return _.map(result.data, value => {
        return { text: value };
      }) as MetricFindValue[];;
    });
  }

  get_entity_ids(entity: string, type: string, tag_information: string) {
    const url = EntityConstants.MANAGED_OBJECT_SERVICE_URL + '/entities';

    try {
      const requestData = {
        entity: entity,
        entityType: type,
        tagInformation: JSON.parse(tag_information)
      };
  
      const requestOptions = {method: 'POST', headers: {'Content-Type': 'application/json'}} as RequestOptions;
  
      return this.datasource._request(url, requestData, requestOptions).then((result: any) => {
        return _.map(result.data, value => {
          return { text: value };
        }) as MetricFindValue[];
      });
    } catch (error) {
      const res = new Promise<MetricFindValue[]>((resolve) => {        
        resolve([{ text: '' } as MetricFindValue]);    
      });      
      return res;
    }
  }

}
