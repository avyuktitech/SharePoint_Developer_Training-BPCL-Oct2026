import { AadHttpClient, HttpClientResponse } from '@microsoft/sp-http';
import { blobUrl, explainStatus, IBlobItem, IBlobSource, listUrl, parseBlobList, STORAGE_API_VERSION } from './blobRest';

const MAX_ITEMS = 1000;

/** Reads blobs as the signed-in user: SharePoint supplies an Entra ID token and no storage key reaches the browser. */
export class AzureBlobSource implements IBlobSource {
  public readonly isDemo = false;
  public readonly label: string;

  public constructor(
    private readonly _getClient: () => Promise<AadHttpClient>,
    private readonly _account: string,
    private readonly _container: string
  ) {
    this.label = `${_account} / ${_container}`;
  }

  public async list(): Promise<IBlobItem[]> {
    const items: IBlobItem[] = [];
    let marker = '';
    do {
      const response = await this._get(listUrl(this._account, this._container, marker));
      const page = parseBlobList(await response.text());
      items.push(...page.items);
      marker = page.nextMarker;
    } while (marker && items.length < MAX_ITEMS);
    return items;
  }

  public async read(item: IBlobItem): Promise<Blob> {
    const response = await this._get(blobUrl(this._account, this._container, item.name));
    return response.blob();
  }

  private async _get(url: string): Promise<HttpClientResponse> {
    const client = await this._getClient();
    let response: HttpClientResponse;
    try {
      response = await client.get(url, AadHttpClient.configurations.v1, { headers: { 'x-ms-version': STORAGE_API_VERSION } });
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      throw new Error(`Could not reach Azure Storage. Check that the Azure Storage permission is approved in the SharePoint admin center and that the storage account's CORS rules allow this site. (${reason})`);
    }
    if (!response.ok) throw new Error(explainStatus(response.status));
    return response;
  }
}
