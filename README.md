
# BMC Helix Datasource

This is a Grafana datasource for fetching Metrics, Events & logs from Helix Monitor, Helix Remediate & Helix Optimize products

## Requirements

Grafana 7.3.1+ is required.

BMC Helix v21.02+ license/subscription is required

## Features

- Supports Lucene queries to fetch Events & Logs
- Supports Promql & Metricql to fetch Metrics data 
- Utilizes BMC Helix REST API's
- Secured authentication via access key and secret key

## Configuration

This datasource uses the Instana REST API to query the underlying data services.

First of all you will need to generate an Access key & Secret key in BMC Helix portal ([Keys](https://docs.bmc.com/docs/BMCHelixPortal/setting-up-api-users-for-programmatic-access-967330979.html))

Configure Retrived values as shown below

![datasource configuration](https://raw.githubusercontent.com/bmcsoftware/bmchelix-datasource/main/screenshots/configuration.png)

## Usage
- - - -
### Query Types
The following query types are available:
* CloudSecurity

   Use this query type to fetch compliance data of the devices in your environment.
* Events

  Use this query type to fetch event data on the devices in your environment.
* Metric

  Use this query type to fetch the performance metrics data of the devices in your environment.

### Query Editor

This section describes the each query editor.

### **Cloud Security**

The following image displays the CloudSecurity query type:

![query type](https://raw.githubusercontent.com/bmcsoftware/bmchelix-datasource/main/screenshots/cloudSecurity_query.png)

This query type requires the following data:

| Field | Description |
|------|-------|
| **Query Type** | Use this field to select the query type |
| **Query** | Use one of the following queries to build a panel. The options for each query type are different **Asset Compliance**, **Policy Compliance** , **Compliance Trend**, **Risk Account**, **Operations**, **Resource Pool** |


### **Events**

The following image displays the Events query type:

![query type](https://raw.githubusercontent.com/bmcsoftware/bmchelix-datasource/main/screenshots/events_query.png)

This query type requires the following data:

| Field | Description |
|------|-------|
| **Query Type** | Use this field to select the query type |
| **Query** | Use a Lucene query syntax here |
| **Metric** | Click this field to select a metric for the query. For example, Average, Min, Max, and so on |
| **Group by** | Select a clause to group your data in the panel. |

<br>

### **Metrics**

The following image displays the Metric query type:

![query type](https://raw.githubusercontent.com/bmcsoftware/bmchelix-datasource/main/screenshots/metric_query.png)

| Field | Description |
|------|-------|
| **Query Type** | Use this field to select the query type |
| **Metrics** | Add a metrics query to this field.  You can also select an available query form the list. Click the **Metrics** field to view a list of available queries. |
| **Legend** |Add a legend to appear in the panel. You can use a variable here. For example, the value of the {{hostname}} variable is replaced with the host name in the panel. |
| **Min step** | Add a threshold for a lower limit of the Prometheus query. This setting is absolute, and cannot be changed by the value in the **Resolution** field.|
| **Resolution** | Sets the parameter for each pixel to correspond to one data point of a Prometheus range query. Use lower resolutions for better performance.|
| **Format** | Select one of the following formats for the panel: **Time Series** , **Table** , **Heatmap**|
| **Instant** | Use this radio button to return only the latest value for the requested time series. Instant queries return results faster than the normal range queries.|

### **Sample Dashboards**
### Events Dashboard
![events_dashboard](https://raw.githubusercontent.com/bmcsoftware/bmchelix-datasource/main/screenshots/events_dashboard.png)

### Metrics Dashboard
![metrics_dashboard](https://raw.githubusercontent.com/bmcsoftware/bmchelix-datasource/main/screenshots/metrics_dashboard.png)
