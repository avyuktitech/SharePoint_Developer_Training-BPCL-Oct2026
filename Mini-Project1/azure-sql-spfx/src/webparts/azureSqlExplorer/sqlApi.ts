// SQL returns null for empty values, so this mirrors the data the API sends.
// eslint-disable-next-line @rushstack/no-new-null
export type CellValue = string | number | boolean | null;

export interface ITableInfo {
  name: string;
  description: string;
  rowCount: number;
}

export interface ITablePage {
  name: string;
  columns: string[];
  rows: Record<string, CellValue>[];
  page: number;
  pageSize: number;
  totalRows: number;
}

export interface IFileInfo {
  id: number;
  name: string;
  contentType: string;
  description: string;
  size: number;
  updatedAt: string;
}

export interface ISqlSource {
  /** Shown in the header, for example the API's host name. */
  label: string;
  isDemo: boolean;
  listTables(): Promise<ITableInfo[]>;
  getRows(table: string, page: number): Promise<ITablePage>;
  listFiles(): Promise<IFileInfo[]>;
  readFile(file: IFileInfo): Promise<Blob>;
}

/** Returns the API address without a trailing slash, or an empty string when it isn't a valid HTTPS URL. */
export function normalizeApiUrl(value: string): string {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' && !url.search && !url.hash ? url.href.replace(/\/+$/, '') : '';
  } catch {
    return '';
  }
}

export function rowsUrl(apiUrl: string, table: string, page: number): string {
  return `${apiUrl}/tables/${encodeURIComponent(table)}?page=${page}`;
}

export function fileContentUrl(apiUrl: string, id: number): string {
  return `${apiUrl}/files/${id}/content`;
}

export function pageCount(totalRows: number, pageSize: number): number {
  return Math.max(1, Math.ceil(totalRows / pageSize));
}

/** Formats a database value for a table cell. */
export function formatCell(value: CellValue): string {
  if (value === null) return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  // SQL DATE columns arrive as midnight UTC timestamps. Only the date part means anything.
  if (typeof value === 'string') {
    const date = /^(\d{4}-\d{2}-\d{2})T00:00:00(\.0+)?Z$/.exec(value);
    if (date) return date[1];
  }
  return String(value);
}

/** Turns common failures into the setup step that fixes them. */
export function explainStatus(status: number): string {
  if (status === 401 || status === 403) return `The API refused access (${status}). Check that App Service Authentication accepts this API's audience and that the API permission is approved.`;
  if (status === 404) return 'The API address was not found (404). The address should end in /api.';
  if (status >= 500) return `The API could not read the database (${status}). See the Function App logs for details.`;
  return `The API returned an error (${status}).`;
}
