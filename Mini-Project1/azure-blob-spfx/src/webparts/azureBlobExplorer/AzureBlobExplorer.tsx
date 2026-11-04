import * as React from 'react';
import { IBlobItem, IBlobSource } from './blobRest';
import { FileKind, formatSize, imageMimeType, kindOf, parseCsv } from './fileTypes';
import styles from './AzureBlobExplorerWebPart.module.scss';

const MAX_PREVIEW_BYTES = 5 * 1024 * 1024;
const MAX_CSV_ROWS = 200;
const KIND_LABELS: Record<FileKind, string> = { image: 'IMG', csv: 'CSV', text: 'TXT', other: 'FILE' };

type Filter = 'all' | 'images' | 'documents';
type Preview =
  | { type: 'image'; url: string }
  | { type: 'text'; text: string }
  | { type: 'csv'; rows: string[][] };

export interface IAzureBlobExplorerProps {
  source?: IBlobSource;
  configError?: string;
}

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function matches(item: IBlobItem, filter: Filter): boolean {
  if (filter === 'all') return true;
  return (kindOf(item.name) === 'image') === (filter === 'images');
}

async function loadPreview(source: IBlobSource, item: IBlobItem): Promise<Preview> {
  const blob = await source.read(item);
  const kind = kindOf(item.name);
  if (kind === 'image') return { type: 'image', url: URL.createObjectURL(new Blob([blob], { type: imageMimeType(item.name) })) };
  const text = await blob.text();
  return kind === 'csv' ? { type: 'csv', rows: parseCsv(text) } : { type: 'text', text };
}

const AzureBlobExplorer: React.FC<IAzureBlobExplorerProps> = ({ source, configError }) => {
  const [items, setItems] = React.useState<IBlobItem[]>([]);
  const [loading, setLoading] = React.useState(!!source);
  const [error, setError] = React.useState(configError || '');
  const [filter, setFilter] = React.useState<Filter>('all');
  const [selected, setSelected] = React.useState<IBlobItem | undefined>();
  const [preview, setPreview] = React.useState<Preview | undefined>();
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [previewError, setPreviewError] = React.useState('');
  const [downloadError, setDownloadError] = React.useState('');
  const [reloadCount, setReloadCount] = React.useState(0);

  React.useEffect(() => {
    if (!source) return;
    let current = true;
    setLoading(true);
    setError('');
    source.list()
      .then(list => {
        if (!current) return;
        setItems(list);
        setSelected(list[0]);
      })
      .catch(e => { if (current) setError(errorText(e)); })
      .then(() => { if (current) setLoading(false); })
      .catch(() => undefined);
    return () => { current = false; };
  }, [source, reloadCount]);

  React.useEffect(() => {
    setPreview(undefined);
    setPreviewError('');
    setDownloadError('');
    if (!source || !selected || kindOf(selected.name) === 'other' || selected.size > MAX_PREVIEW_BYTES) {
      setPreviewLoading(false);
      return;
    }
    let current = true;
    let imageUrl = '';
    setPreviewLoading(true);
    loadPreview(source, selected)
      .then(result => {
        if (result.type === 'image') imageUrl = result.url;
        if (current) setPreview(result);
        else if (imageUrl) URL.revokeObjectURL(imageUrl);
      })
      .catch(e => { if (current) setPreviewError(errorText(e)); })
      .then(() => { if (current) setPreviewLoading(false); })
      .catch(() => undefined);
    return () => {
      current = false;
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [source, selected]);

  const download = async (item: IBlobItem): Promise<void> => {
    if (!source) return;
    setDownloadError('');
    try {
      const url = URL.createObjectURL(await source.read(item));
      const link = document.createElement('a');
      link.href = url;
      link.download = item.name.substring(item.name.lastIndexOf('/') + 1);
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) {
      setDownloadError(errorText(e));
    }
  };

  const visible = items.filter(item => matches(item, filter));
  const imageCount = items.filter(item => matches(item, 'images')).length;
  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: `All (${items.length})` },
    { key: 'images', label: `Images (${imageCount})` },
    { key: 'documents', label: `Documents (${items.length - imageCount})` }
  ];

  const renderPreview = (item: IBlobItem): React.ReactNode => {
    if (previewLoading) return <p className={styles.empty}>Loading preview...</p>;
    if (previewError) return <p className={styles.error} role="alert">{previewError}</p>;
    if (item.size > MAX_PREVIEW_BYTES) return <p className={styles.empty}>This file is {formatSize(item.size)}, too large to preview. Download it to see the contents.</p>;
    if (!preview) return <p className={styles.empty}>This file type has no preview. Download it to see the contents.</p>;
    if (preview.type === 'image') return <img className={styles.image} src={preview.url} alt={item.name} />;
    if (preview.type === 'text') return <pre className={styles.text}>{preview.text}</pre>;
    if (!preview.rows.length) return <p className={styles.empty}>This CSV file is empty.</p>;
    const shown = preview.rows.slice(1, MAX_CSV_ROWS + 1);
    return (
      <>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr>{preview.rows[0].map((cell, i) => <th key={i} scope="col">{cell}</th>)}</tr></thead>
            <tbody>{shown.map((row, r) => <tr key={r}>{row.map((cell, c) => <td key={c}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
        {preview.rows.length - 1 > shown.length && <p className={styles.note}>Showing the first {shown.length} of {preview.rows.length - 1} rows.</p>}
      </>
    );
  };

  return (
    <section className={styles.app}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>AZURE BLOB STORAGE</p>
          <h2>Blob Explorer</h2>
          {source && <p className={styles.source}>{source.label}</p>}
        </div>
        {source && <button type="button" className={styles.secondary} disabled={loading} onClick={() => setReloadCount(c => c + 1)}>Refresh</button>}
      </header>

      {source?.isDemo && (
        <p className={styles.notice}>You're viewing built-in sample data. To connect your container, edit this web part and enter a storage account and container name.</p>
      )}
      {error && <p className={styles.error} role="alert">{error}</p>}
      {loading && <p className={styles.empty}>Loading files...</p>}

      {!loading && !error && !items.length && <p className={styles.empty}>This container has no files yet.</p>}

      {!loading && !error && items.length > 0 && (
        <>
          <div className={styles.filters}>
            {filters.map(f => (
              <button key={f.key} type="button" className={filter === f.key ? styles.filterActive : styles.filter} aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>{f.label}</button>
            ))}
          </div>
          <div className={styles.split}>
            <ul className={styles.list}>
              {visible.map(item => {
                const kind = kindOf(item.name);
                return (
                  <li key={item.name}>
                    <button type="button" className={selected?.name === item.name ? styles.fileActive : styles.file} aria-current={selected?.name === item.name} onClick={() => setSelected(item)}>
                      <span className={styles.badge}>{KIND_LABELS[kind]}</span>
                      <span className={styles.fileText}>
                        <span className={styles.fileName}>{item.name}</span>
                        <small>{formatSize(item.size)}</small>
                      </span>
                    </button>
                  </li>
                );
              })}
              {!visible.length && <li className={styles.empty}>No files in this view.</li>}
            </ul>

            <div className={styles.preview}>
              {selected ? (
                <>
                  <div className={styles.previewHeader}>
                    <div className={styles.previewTitle}>
                      <h3>{selected.name}</h3>
                      <small>{formatSize(selected.size)}{selected.lastModified ? ` · Modified ${new Date(selected.lastModified).toLocaleString()}` : ''}</small>
                    </div>
                    <button type="button" className={styles.primary} onClick={() => { download(selected).catch(() => undefined); }}>Download</button>
                  </div>
                  {downloadError && <p className={styles.error} role="alert">{downloadError}</p>}
                  {renderPreview(selected)}
                </>
              ) : <p className={styles.empty}>Select a file to preview it.</p>}
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default AzureBlobExplorer;
