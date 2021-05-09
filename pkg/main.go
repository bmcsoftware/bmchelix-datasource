package main

import (
	"os"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
)

func main() {
	backend.SetupPluginEnvironment("bmchelix-ade-datasource")

	ds := newDataSource()

	opts := datasource.ServeOpts{
		CallResourceHandler: ds,
	}

	if err := datasource.Serve(opts); err != nil {
		backend.Logger.Error(err.Error())
		os.Exit(1)
	}
}
