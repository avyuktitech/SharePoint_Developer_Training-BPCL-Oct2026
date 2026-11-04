export type FileKind = 'image' | 'csv' | 'text' | 'other';

const IMAGE_TYPES: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp', svg: 'image/svg+xml'
};
const TEXT_EXTENSIONS = ['txt', 'md', 'json', 'xml', 'log', 'yml', 'yaml', 'html', 'css', 'js', 'ts', 'sql'];

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.substring(dot + 1).toLowerCase();
}

export function kindOf(name: string): FileKind {
  const ext = extensionOf(name);
  if (IMAGE_TYPES[ext]) return 'image';
  if (ext === 'csv') return 'csv';
  return TEXT_EXTENSIONS.indexOf(ext) !== -1 ? 'text' : 'other';
}

// Storage often stores "application/octet-stream", which an <img> won't render for SVG, so the type comes from the file name.
export function imageMimeType(name: string): string {
  return IMAGE_TYPES[extensionOf(name)] || 'application/octet-stream';
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Handles quoted fields, doubled quotes and line breaks inside quotes.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}
