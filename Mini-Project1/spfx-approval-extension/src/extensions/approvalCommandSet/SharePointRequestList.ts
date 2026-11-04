import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import { IRequestItem, IRequestList, SUBMITTED } from './approvalLogic';

// SharePoint explains a failed call in the response body, such as which column does not exist.
async function failureDetail(response: SPHttpClientResponse): Promise<string> {
  const status = `HTTP ${response.status}`;
  try {
    const { error } = await response.json();
    const message = error?.message?.value || error?.message;
    return message ? `${status}: ${message}` : status;
  } catch {
    return status;
  }
}

export class SharePointRequestList implements IRequestList {
  public constructor(private _client: SPHttpClient, private _webUrl: string, private _listId: string) {}

  private _itemUrl(id: number): string {
    return `${this._webUrl}/_api/web/lists(guid'${this._listId}')/items(${id})`;
  }

  public async getItem(id: number): Promise<IRequestItem> {
    const response = await this._client.get(`${this._itemUrl(id)}?$select=Id,Title,ApprovalStatus,ApproverId`, SPHttpClient.configurations.v1);
    if (!response.ok) throw new Error(`Could not read the item (${await failureDetail(response)})`);
    const json = await response.json();
    return { id, title: json.Title, status: json.ApprovalStatus || undefined, approverId: json.ApproverId || undefined, etag: response.headers.get('ETag') || '*' };
  }

  // Sending the ETag makes SharePoint refuse the update if someone changed the item after it was read,
  // so one request cannot start two approvals. The update is what triggers the flow.
  public async submit(item: IRequestItem): Promise<void> {
    const response = await this._client.post(this._itemUrl(item.id), SPHttpClient.configurations.v1, {
      headers: {
        'Accept': 'application/json;odata=nometadata',
        'Content-Type': 'application/json;odata=nometadata',
        'odata-version': '',
        'IF-MATCH': item.etag,
        'X-HTTP-Method': 'MERGE'
      },
      body: JSON.stringify({ ApprovalStatus: SUBMITTED, ApprovalComments: '' })
    });
    if (response.status === 412) throw new Error('The item was changed by someone else. Refresh and try again.');
    if (!response.ok) throw new Error(`Could not update the item (${await failureDetail(response)})`);
  }
}
