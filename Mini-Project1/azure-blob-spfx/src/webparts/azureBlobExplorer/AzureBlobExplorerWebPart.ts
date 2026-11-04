import { Version } from '@microsoft/sp-core-library';
import { IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { AadHttpClient } from '@microsoft/sp-http';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import AzureBlobExplorer from './AzureBlobExplorer';
import { AzureBlobSource } from './AzureBlobSource';
import { IBlobSource, validateAccountName, validateContainerName } from './blobRest';
import { DemoBlobSource } from './demoData';

const STORAGE_RESOURCE = 'https://storage.azure.com';

export interface IAzureBlobExplorerWebPartProps {
  storageAccount: string;
  containerName: string;
}

export default class AzureBlobExplorerWebPart extends BaseClientSideWebPart<IAzureBlobExplorerWebPartProps> {
  private _source: IBlobSource | undefined;
  private _sourceKey: string | undefined;

  public render(): void {
    const account = (this.properties.storageAccount || '').trim();
    const container = (this.properties.containerName || '').trim();
    const configError = account || container
      ? (validateAccountName(account) && 'Check the storage account name in the web part settings.') || (validateContainerName(container) && 'Check the container name in the web part settings.')
      : '';

    // Reuses the source between renders so the explorer reloads only when the settings change.
    const key = `${account}/${container}`;
    if (key !== this._sourceKey) {
      this._sourceKey = key;
      if (!account && !container) this._source = new DemoBlobSource();
      else if (configError) this._source = undefined;
      else this._source = new AzureBlobSource(this._getClient, account, container);
    }

    ReactDom.render(React.createElement(AzureBlobExplorer, { key, source: this._source, configError }), this.domElement);
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
          groupName: 'Azure Blob Storage',
          groupFields: [
            PropertyPaneTextField('storageAccount', {
              label: 'Storage account name',
              onGetErrorMessage: value => (value.trim() ? validateAccountName(value.trim()) : '')
            }),
            PropertyPaneTextField('containerName', {
              label: 'Container name',
              onGetErrorMessage: value => (value.trim() ? validateContainerName(value.trim()) : '')
            })
          ]
        }]
      }]
    };
  }

  private _getClient = (): Promise<AadHttpClient> => this.context.aadHttpClientFactory.getClient(STORAGE_RESOURCE);
}
