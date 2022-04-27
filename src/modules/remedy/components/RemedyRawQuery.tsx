import React, { PureComponent } from 'react';
import { CodeEditor } from '@grafana/ui';

export class RawQueryComponent extends PureComponent<any> {
  onBlur = (rawQuery: string) => {
    return this.props.runQueryOnBlur ? this.props.onRawQueryChange(rawQuery) : null;
  };

  render() {
    return (
      <div className="gf-form gf-form--grow">
        <label className="gf-form-label query-keyword width-8">SQL Editor</label>
        <div style={{ width: '100%' }}>
          <CodeEditor
            value={this.props.rawQuery}
            language={'sql'}
            height={'150px'}
            showLineNumbers={true}
            showMiniMap={true}
            onBlur={this.onBlur}
          />
        </div>
      </div>
    );
  }
}
