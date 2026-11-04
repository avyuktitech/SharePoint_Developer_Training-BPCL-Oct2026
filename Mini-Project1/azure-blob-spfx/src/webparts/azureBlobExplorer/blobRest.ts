export interface IBlobItem {
  name: string;
  size: number;
  lastModified: string;
}

export interface IBlobSource {
  /** Shown in the header, for example "contosofiles / samples". */
  label: string;
  isDemo: boolean;
  list(): Promise<IBlobItem[]>;
  read(item: IBlobItem): Promise<Blob>;
}

/** The Azure Storage REST API version sent with each request. Entra ID tokens require this header. */
export const STORAGE_API_VERSION = '2023-11-03';

/** Checks names before they become part of a URL that receives the user's storage token. */
export function validateAccountName(value: string): string {
  return /^[a-z0-9]{3,24}$/.test(value) ? '' : 'Use 3-24 lowercase letters and numbers.';
}

export function validateContainerName(value: string): string {
  return value.length >= 3 && value.length <= 63 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value)
    ? ''
    : 'Use 3-63 lowercase letters, numbers and single hyphens.';
}

function containerUrl(account: string, container: string): string {
  return `https://${account}.blob.core.windows.net/${container}`;
}

export function listUrl(account: string, container: string, marker?: string): string {
  const next = marker ? `&marker=${encodeURIComponent(marker)}` : '';
  return `${containerUrl(account, container)}?restype=container&comp=list&maxresults=200${next}`;
}

// "/" stays as a separator so virtual folders keep working. Everything else in the name is encoded.
export function blobUrl(account: string, container: string, name: string): string {
  return `${containerUrl(account, container)}/${name.split('/').map(encodeURIComponent).join('/')}`;
}

export function parseBlobList(xml: string): { items: IBlobItem[]; nextMarker: string } {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('Azure Storage returned a list that could not be read.');
  const textOf = (parent: Element, tag: string): string => parent.getElementsByTagName(tag)[0]?.textContent || '';
  const items = Array.from(doc.getElementsByTagName('Blob')).map(blob => ({
    name: textOf(blob, 'Name'),
    size: Number(textOf(blob, 'Content-Length')) || 0,
    lastModified: textOf(blob, 'Last-Modified')
  }));
  return { items, nextMarker: textOf(doc.documentElement, 'NextMarker') };
}

/** Turns common failures into the setup step that fixes them. */
export function explainStatus(status: number): string {
  if (status === 401 || status === 403) return `Azure Storage refused access (${status}). Give this user the Storage Blob Data Reader role on the storage account. New roles can take a few minutes to apply.`;
  if (status === 404) return 'The container was not found (404). Check the storage account and container names in the web part settings.';
  return `Azure Storage returned an error (${status}).`;
}
