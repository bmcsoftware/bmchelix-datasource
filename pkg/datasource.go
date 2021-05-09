package main

import (
	"bytes"
	"context"
	"encoding/json"
	"io/ioutil"
	"net/http"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
)

type dataSource struct {
	im instancemgmt.InstanceManager
}

func newDataSource() *dataSource {
	return &dataSource{
		im: datasource.NewInstanceManager(newDataSourceInstance),
	}
}

// CallResource handles any requests to /api/datasources/:id/resources.
//
// req contains information about the HTTP request
// sender is used for returning a response back to the client
func (ds *dataSource) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	if req.Path != "ims/api/v1/access_keys/login" {
		sender.Send(&backend.CallResourceResponse{
			Status: http.StatusNotFound,
		})
		return nil
	}

	instance, err := ds.im.Get(req.PluginContext)
	if err != nil {
		return err
	}

	dsInstance := instance.(*dataSourceInstance)

	instanceSettingsURL := dsInstance.settings.URL

	// Get the jsonData.
	var jsonData struct {
		TenantID string `json:"tenantId"`
	}
	if err := json.Unmarshal(dsInstance.settings.JSONData, &jsonData); err != nil {
		return err
	}

	// Get the decrypted secureJsonData.
	accessKey := dsInstance.settings.DecryptedSecureJSONData["accessKey"]
	secretKey := dsInstance.settings.DecryptedSecureJSONData["secretKey"]

	payload, err := json.Marshal(map[string]string{
		"access_key":        accessKey,
		"access_secret_key": secretKey,
		"tenant_id":         jsonData.TenantID,
	})
	if err != nil {
		return err
	}

	authReq, err := http.NewRequest("POST", instanceSettingsURL+"/ims/api/v1/access_keys/login", bytes.NewReader(payload))
	if err != nil {
		return err
	}
	authReq.Header.Set("Content-Type", "application/json")

	// Make the actual request to the access token URL.
	resp, err := http.DefaultClient.Do(authReq)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	b, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	// Here we just forward the response from the API call since we're only
	// acting as a proxy.
	sender.Send(&backend.CallResourceResponse{
		Status:  resp.StatusCode,
		Headers: resp.Header,
		Body:    b,
	})

	return nil
}

// dataSourceInstance is the specific instance of a data source.
type dataSourceInstance struct {
	settings backend.DataSourceInstanceSettings
}

func newDataSourceInstance(settings backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	return &dataSourceInstance{settings: settings}, nil
}
