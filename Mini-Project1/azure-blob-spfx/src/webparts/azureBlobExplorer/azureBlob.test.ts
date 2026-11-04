import { blobUrl, explainStatus, listUrl, parseBlobList, validateAccountName, validateContainerName } from './blobRest';
import { formatSize, imageMimeType, kindOf, parseCsv } from './fileTypes';

const LIST_XML = `<?xml version="1.0" encoding="utf-8"?>
<EnumerationResults ServiceEndpoint="https://acct.blob.core.windows.net/" ContainerName="samples">
  <Blobs>
    <Blob>
      <Name>images/banner one.svg</Name>
      <Properties>
        <Last-Modified>Mon, 02 Nov 2026 09:30:00 GMT</Last-Modified>
        <Content-Length>2048</Content-Length>
      </Properties>
    </Blob>
    <Blob>
      <Name>welcome.txt</Name>
      <Properties><Content-Length>10</Content-Length></Properties>
    </Blob>
  </Blobs>
  <NextMarker>page2</NextMarker>
</EnumerationResults>`;

describe('parseBlobList', () => {
  it('reads names, sizes, dates and the next page marker', () => {
    const { items, nextMarker } = parseBlobList(LIST_XML);
    expect(items).toEqual([
      { name: 'images/banner one.svg', size: 2048, lastModified: 'Mon, 02 Nov 2026 09:30:00 GMT' },
      { name: 'welcome.txt', size: 10, lastModified: '' }
    ]);
    expect(nextMarker).toBe('page2');
  });
  it('returns no items and no marker for an empty container', () => {
    expect(parseBlobList('<EnumerationResults><Blobs /><NextMarker /></EnumerationResults>')).toEqual({ items: [], nextMarker: '' });
  });
  it('rejects a response that is not XML', () => {
    expect(() => parseBlobList('<html><oops')).toThrow('could not be read');
  });
});

describe('storage URLs', () => {
  it('lists a container, encoding the marker', () => {
    expect(listUrl('acct', 'samples', 'a b')).toBe('https://acct.blob.core.windows.net/samples?restype=container&comp=list&maxresults=200&marker=a%20b');
  });
  it('encodes blob names but keeps folder separators', () => {
    expect(blobUrl('acct', 'samples', 'my docs/q&a #1.txt')).toBe('https://acct.blob.core.windows.net/samples/my%20docs/q%26a%20%231.txt');
  });
});

describe('name validation', () => {
  it('accepts valid names', () => {
    expect(validateAccountName('contosofiles01')).toBe('');
    expect(validateContainerName('sample-files')).toBe('');
  });
  it('rejects anything that could change the request host or path', () => {
    expect(validateAccountName('evil.example.com/x')).not.toBe('');
    expect(validateAccountName('UPPER')).not.toBe('');
    expect(validateContainerName('a/../b')).not.toBe('');
    expect(validateContainerName('a--b')).not.toBe('');
  });
});

describe('explainStatus', () => {
  it('points a 403 at the missing role', () => {
    expect(explainStatus(403)).toContain('Storage Blob Data Reader');
  });
});

describe('file helpers', () => {
  it('classifies files by extension, ignoring case', () => {
    expect(kindOf('images/A.PNG')).toBe('image');
    expect(kindOf('data/x.csv')).toBe('csv');
    expect(kindOf('docs/readme.md')).toBe('text');
    expect(kindOf('archive.zip')).toBe('other');
    expect(kindOf('no-extension')).toBe('other');
  });
  it('gives SVG files the type an image element needs', () => {
    expect(imageMimeType('a.svg')).toBe('image/svg+xml');
  });
  it('formats sizes', () => {
    expect(formatSize(512)).toBe('512 B');
    expect(formatSize(2048)).toBe('2.0 KB');
    expect(formatSize(3 * 1024 * 1024)).toBe('3.0 MB');
  });
});

describe('parseCsv', () => {
  it('handles quotes, commas, doubled quotes and CRLF', () => {
    expect(parseCsv('a,b\r\n"x, y","say ""hi"""\r\n')).toEqual([['a', 'b'], ['x, y', 'say "hi"']]);
  });
  it('keeps the last row when there is no final line break', () => {
    expect(parseCsv('a,b\n1,2')).toEqual([['a', 'b'], ['1', '2']]);
  });
  it('returns nothing for empty text', () => {
    expect(parseCsv('')).toEqual([]);
  });
});
