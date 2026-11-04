import * as React from 'react';
import { formatSize, kindOf, parseCsv } from './fileTypes';
import { formatCell, IFileInfo, ISqlSource, ITableInfo, ITablePage, pageCount } from './sqlApi';
import styles from './AzureSqlExplorerWebPart.module.scss';

const MAX_PREVIEW_BYTES = 5 * 1024 * 1024;

type Tab = 'tables' | 'files';
type Preview =
  | { type: 'image'; url: string }
  | { type: 'text'; text: string }
  | { type: 'csv'; rows: string[][] };

export interface IAzureSqlExplorerProps {
  source?: ISqlSource;
  configError?: string;
}

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

async function loadPreview(source: ISqlSource, file: IFileInfo): Promise<Preview> {
  const blob = await source.readFile(file);
  const kind = kindOf(file.name);
  if (kind === 'image') return { type: 'image', url: URL.createObjectURL(new Blob([blob], { type: file.contentType })) };
  const text = await blob.text();
  return kind === 'csv' ? { type: 'csv', rows: parseCsv(text) } : { type: 'text', text };
}

const TablesView: React.FC<{ source: ISqlSource }> = ({ source }) => {
  const [tables, setTables] = React.useState<ITableInfo[]>([]);
  const [selected, setSelected] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState<ITablePage | undefined>();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let current = true;
    source.listTables()
      .then(list => {
        if (!current) return;
        setTables(list);
        if (list.length) setSelected(list[0].name);
        else setLoading(false);
      })
      .catch(e => { if (current) { setError(errorText(e)); setLoading(false); } });
    return () => { current = false; };
  }, [source]);

  React.useEffect(() => {
    if (!selected) return;
    let current = true;
    setLoading(true);
    setError('');
    source.getRows(selected, page)
      .then(result => { if (current) setData(result); })
      .catch(e => { if (current) setError(errorText(e)); })
      .then(() => { if (current) setLoading(false); })
      .catch(() => undefined);
    return () => { current = false; };
  }, [source, selected, page]);

  const selectTable = (name: string): void => {
    setSelected(name);
    setPage(1);
    setData(undefined);
  };

  const totalPages = data ? pageCount(data.totalRows, data.pageSize) : 1;
  const info = tables.filter(t => t.name === selected)[0];

  return (
    <>
      {tables.length > 0 && (
        <div className={styles.cards}>
          {tables.map(t => (
            <button key={t.name} type="button" className={t.name === selected ? styles.cardActive : styles.card} aria-pressed={t.name === selected} onClick={() => selectTable(t.name)}>
              <span className={styles.cardName}>{t.name}</span>
              <small>{t.rowCount} rows</small>
            </button>
          ))}
        </div>
      )}
      {error && <p className={styles.error} role="alert">{error}</p>}
      {!tables.length && !loading && !error && <p className={styles.empty}>No tables are available.</p>}
      {loading && !data && <p className={styles.empty}>Loading...</p>}
      {data && data.name === selected && (
        <div className={styles.panel}>
          {info && <p className={styles.description}>{info.description}</p>}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr>{data.columns.map(c => <th key={c} scope="col">{c}</th>)}</tr></thead>
              <tbody>
                {data.rows.map((row, r) => <tr key={r}>{data.columns.map(c => <td key={c}>{formatCell(row[c])}</td>)}</tr>)}
                {!data.rows.length && <tr><td colSpan={data.columns.length} className={styles.empty}>This page has no rows.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className={styles.pager}>
            <button type="button" className={styles.secondary} disabled={loading || page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <span>Page {data.page} of {totalPages} · {data.totalRows} rows</span>
            <button type="button" className={styles.secondary} disabled={loading || page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </div>
      )}
    </>
  );
};

const FilesView: React.FC<{ source: ISqlSource }> = ({ source }) => {
  const [files, setFiles] = React.useState<IFileInfo[]>([]);
  const [selected, setSelected] = React.useState<IFileInfo | undefined>();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [preview, setPreview] = React.useState<Preview | undefined>();
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [previewError, setPreviewError] = React.useState('');
  const [downloadError, setDownloadError] = React.useState('');

  React.useEffect(() => {
    let current = true;
    source.listFiles()
      .then(list => { if (current) { setFiles(list); setSelected(list[0]); } })
      .catch(e => { if (current) setError(errorText(e)); })
      .then(() => { if (current) setLoading(false); })
      .catch(() => undefined);
    return () => { current = false; };
  }, [source]);

  React.useEffect(() => {
    setPreview(undefined);
    setPreviewError('');
    setDownloadError('');
    if (!selected || kindOf(selected.name) === 'other' || selected.size > MAX_PREVIEW_BYTES) {
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

  const download = async (file: IFileInfo): Promise<void> => {
    setDownloadError('');
    try {
      const url = URL.createObjectURL(await source.readFile(file));
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) {
      setDownloadError(errorText(e));
    }
  };

  const renderPreview = (file: IFileInfo): React.ReactNode => {
    if (previewLoading) return <p className={styles.empty}>Loading preview...</p>;
    if (previewError) return <p className={styles.error} role="alert">{previewError}</p>;
    if (file.size > MAX_PREVIEW_BYTES) return <p className={styles.empty}>This file is {formatSize(file.size)}, too large to preview. Download it to see the contents.</p>;
    if (!preview) return <p className={styles.empty}>This file type has no preview. Download it to see the contents.</p>;
    if (preview.type === 'image') return <img className={styles.image} src={preview.url} alt={file.description || file.name} />;
    if (preview.type === 'text') return <pre className={styles.text}>{preview.text}</pre>;
    if (!preview.rows.length) return <p className={styles.empty}>This CSV file is empty.</p>;
    return (
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr>{preview.rows[0].map((cell, i) => <th key={i} scope="col">{cell}</th>)}</tr></thead>
          <tbody>{preview.rows.slice(1, 201).map((row, r) => <tr key={r}>{row.map((cell, c) => <td key={c}>{cell}</td>)}</tr>)}</tbody>
        </table>
      </div>
    );
  };

  if (loading) return <p className={styles.empty}>Loading files...</p>;
  if (error) return <p className={styles.error} role="alert">{error}</p>;
  if (!files.length) return <p className={styles.empty}>The Documents table has no files yet.</p>;

  return (
    <div className={styles.split}>
      <ul className={styles.list}>
        {files.map(file => (
          <li key={file.id}>
            <button type="button" className={selected?.id === file.id ? styles.fileActive : styles.file} aria-current={selected?.id === file.id} onClick={() => setSelected(file)}>
              <span className={styles.badge}>{kindOf(file.name) === 'image' ? 'IMG' : kindOf(file.name) === 'csv' ? 'CSV' : kindOf(file.name) === 'text' ? 'TXT' : 'FILE'}</span>
              <span className={styles.fileText}>
                <span className={styles.fileName}>{file.name}</span>
                <small>{formatSize(file.size)}</small>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className={styles.preview}>
        {selected && (
          <>
            <div className={styles.previewHeader}>
              <div className={styles.previewTitle}>
                <h3>{selected.name}</h3>
                <small>{selected.description}</small>
              </div>
              <button type="button" className={styles.primary} onClick={() => { download(selected).catch(() => undefined); }}>Download</button>
            </div>
            {downloadError && <p className={styles.error} role="alert">{downloadError}</p>}
            {renderPreview(selected)}
          </>
        )}
      </div>
    </div>
  );
};

const AzureSqlExplorer: React.FC<IAzureSqlExplorerProps> = ({ source, configError }) => {
  const [tab, setTab] = React.useState<Tab>('tables');

  return (
    <section className={styles.app}>
      <header className={styles.header}>
        <p className={styles.kicker}>AZURE SQL DATABASE</p>
        <h2>SQL Explorer</h2>
        {source && <p className={styles.source}>{source.label}</p>}
      </header>

      {configError && <p className={styles.error} role="alert">{configError}</p>}
      {source?.isDemo && (
        <p className={styles.notice}>You're viewing built-in sample data. To connect your database, edit this web part and enter your API address and client ID.</p>
      )}

      {source && (
        <>
          <div className={styles.tabs} role="tablist">
            <button type="button" role="tab" aria-selected={tab === 'tables'} className={tab === 'tables' ? styles.tabActive : styles.tab} onClick={() => setTab('tables')}>Tables</button>
            <button type="button" role="tab" aria-selected={tab === 'files'} className={tab === 'files' ? styles.tabActive : styles.tab} onClick={() => setTab('files')}>Files and images</button>
          </div>
          {tab === 'tables' ? <TablesView source={source} /> : <FilesView source={source} />}
        </>
      )}
    </section>
  );
};

export default AzureSqlExplorer;
