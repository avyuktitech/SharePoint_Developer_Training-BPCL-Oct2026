import { AadHttpClient, HttpClientResponse } from '@microsoft/sp-http';
import { explainStatus, fileContentUrl, IFileInfo, ISqlSource, ITableInfo, ITablePage, rowsUrl } from './sqlApi';

/** Calls the Azure Functions API with the signed-in user's token. The browser never talks to SQL directly. */
export class SqlApiSource implements ISqlSource {
  public readonly isDemo = false;
  public readonly label: string;

  public constructor(private readonly _getClient: () => Promise<AadHttpClient>, private readonly _apiUrl: string) {
    this.label = new URL(_apiUrl).host;
  }

  public async listTables(): Promise<ITableInfo[]> {
    return (await this._get(`${this._apiUrl}/tables`)).json();
  }

  public async getRows(table: string, page: number): Promise<ITablePage> {
    return (await this._get(rowsUrl(this._apiUrl, table, page))).json();
  }

  public async listFiles(): Promise<IFileInfo[]> {
    return (await this._get(`${this._apiUrl}/files`)).json();
  }

  public async readFile(file: IFileInfo): Promise<Blob> {
    return (await this._get(fileContentUrl(this._apiUrl, file.id))).blob();
  }

  private async _get(url: string): Promise<HttpClientResponse> {
    let response: HttpClientResponse;
    try {
      const client = await this._getClient();
      response = await client.get(url, AadHttpClient.configurations.v1);
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      throw new Error(`Could not reach the API. Check that its permission is approved in the SharePoint admin center and that the Function App's CORS settings allow this site. (${reason})`);
    }
    if (!response.ok) throw new Error(explainStatus(response.status));
    return response;
  }
}
