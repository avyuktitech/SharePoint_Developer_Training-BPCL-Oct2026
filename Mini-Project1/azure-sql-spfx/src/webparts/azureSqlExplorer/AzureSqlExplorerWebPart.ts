import { Version } from '@microsoft/sp-core-library';
import { IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import AzureSqlExplorer from './AzureSqlExplorer';
import { DemoSqlSource } from './demoData';
import { ISqlSource, normalizeApiUrl } from './sqlApi';
import { SqlApiSource } from './SqlApiSource';

export interface IAzureSqlExplorerWebPartProps {
  apiUrl: string;
  apiClientId: string;
}

export default class AzureSqlExplorerWebPart extends BaseClientSideWebPart<IAzureSqlExplorerWebPartProps> {
  private _source: ISqlSource | undefined;
  private _sourceKey: string | undefined;

  public render(): void {
    const rawUrl = (this.properties.apiUrl || '').trim();
    const clientId = (this.properties.apiClientId || '').trim();
    const apiUrl = normalizeApiUrl(rawUrl);
    let configError = '';
    if (rawUrl || clientId) {
      if (!apiUrl) configError = 'Check the API address in the web part settings. It should start with https://.';
      else if (!clientId) configError = 'Enter the API application (client) ID in the web part settings.';
    }

    // Reuses the source between renders so the explorer reloads only when the settings change.
    const key = `${rawUrl}|${clientId}`;
    if (key !== this._sourceKey) {
      this._sourceKey = key;
      if (!rawUrl && !clientId) this._source = new DemoSqlSource();
      else if (configError) this._source = undefined;
      else this._source = new SqlApiSource(() => this.context.aadHttpClientFactory.getClient(clientId), apiUrl);
    }

    ReactDom.render(React.createElement(AzureSqlExplorer, { key, source: this._source, configError }), this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected get disableReactivePropertyChanges(): boolean {
    return true;
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [{
        header: { description: 'Leave both fields empty to show the built-in sample data.' },
        groups: [{
          groupName: 'Azure Functions API',
          groupFields: [
            PropertyPaneTextField('apiUrl', {
              label: 'API address',
              description: 'For example https://my-function-app.azurewebsites.net/api',
              onGetErrorMessage: value => (value.trim() && !normalizeApiUrl(value) ? 'Enter a valid https:// address.' : '')
            }),
            PropertyPaneTextField('apiClientId', {
              label: 'API application (client) ID',
              description: "From the API's app registration in Microsoft Entra ID"
            })
          ]
        }]
      }]
    };
  }
}
