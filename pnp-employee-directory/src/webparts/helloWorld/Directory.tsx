import * as React from 'react';
import { SPFI } from '@pnp/sp';
import { GraphFI, ConsistencyLevel } from '@pnp/graph';
import '@pnp/sp/webs';
import '@pnp/sp/site-users/web';
import '@pnp/graph/users';
import '@pnp/graph/photos';
import styles from './HelloWorldWebPart.module.scss';

interface IPerson { id: string; displayName: string; jobTitle?: string; department?: string; mail?: string; officeLocation?: string; mobilePhone?: string; businessPhones?: string[]; }
interface IManager { displayName: string; jobTitle?: string; }
export interface IDirectoryProps { sp: SPFI; graph: GraphFI; }

const FIELDS = ['id', 'displayName', 'jobTitle', 'department', 'mail', 'officeLocation', 'mobilePhone', 'businessPhones'];

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

const Directory: React.FC<IDirectoryProps> = ({ sp, graph }) => {
  const [site, setSite] = React.useState('');
  const [me, setMe] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [people, setPeople] = React.useState<IPerson[]>([]);
  const [photos, setPhotos] = React.useState<Record<string, string>>({});
  const [selected, setSelected] = React.useState<IPerson | undefined>();
  // undefined = loading, displayName '' = no manager set.
  const [manager, setManager] = React.useState<IManager | undefined>();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  // SharePoint via PnPjs: current site title and signed-in user.
  React.useEffect(() => {
    sp.web.select('Title')().then(w => setSite(w.Title)).catch(() => setSite(''));
    sp.web.currentUser.select('Title')().then(u => setMe(u.Title)).catch(() => setMe(''));
  }, []);

  // Microsoft Graph: GET /users, or /users?$search="displayName:..." (requires ConsistencyLevel: eventual).
  React.useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      setError('');
      const term = query.trim().replace(/"/g, '');
      const request = term
        ? graph.users.using(ConsistencyLevel()).search(`"displayName:${term}" OR "mail:${term}"`)
        : graph.users;
      request.select(...FIELDS).top(24)()
        .then(users => setPeople(users.map(u => ({ ...u, id: u.id || '', displayName: u.displayName || '' } as IPerson))))
        .catch(e => setError(errorText(e)))
        .then(() => setLoading(false), () => setLoading(false));
    }, 350);
    return () => clearTimeout(handle);
  }, [query]);

  // Profile photos: GET /users/{id}/photos/64x64/$value. People without a photo keep their initials.
  React.useEffect(() => {
    const missing = people.filter(p => !(p.id in photos));
    missing.forEach(p => {
      graph.users.getById(p.id).photos.getBySize('64x64').getBlob()
        .then(blob => setPhotos(prev => ({ ...prev, [p.id]: URL.createObjectURL(blob) })))
        .catch(() => setPhotos(prev => ({ ...prev, [p.id]: '' })));
    });
  }, [people]);

  React.useEffect(() => () => Object.keys(photos).forEach(id => photos[id] && URL.revokeObjectURL(photos[id])), []);

  // Manager: GET /users/{id}/manager. Returns 404 when no manager is set.
  const open = (p: IPerson): void => {
    setSelected(p);
    setManager(undefined);
    graph.users.getById(p.id).manager.select('displayName', 'jobTitle')()
      .then(m => setManager({ displayName: (m as IManager).displayName, jobTitle: (m as IManager).jobTitle }))
      .catch(() => setManager({ displayName: '' }));
  };

  const avatar = (p: IPerson, big?: boolean): JSX.Element => photos[p.id]
    ? <img className={big ? styles.avatarBig : styles.avatar} src={photos[p.id]} alt="" />
    : <span className={big ? styles.avatarBig : styles.avatar}>{initials(p.displayName)}</span>;

  return <main className={styles.app}>
    <header className={styles.header}>
      <div><p className={styles.kicker}>PNPJS · MICROSOFT GRAPH USERS</p><h1>Employee Directory</h1>{site && <p className={styles.sub}>{site}{me && ` · signed in as ${me}`}</p>}</div>
      <input className={styles.search} placeholder="Search by name or email" value={query} onChange={e => setQuery(e.target.value)} />
    </header>

    {error && <p className={styles.error}>{error}</p>}
    <div className={styles.layout}>
      <section className={styles.grid}>
        {loading && people.length === 0 ? <p className={styles.empty}>Loading people…</p>
          : people.length === 0 ? <p className={styles.empty}>No people found.</p>
          : people.map(p => <button type="button" key={p.id} className={`${styles.card} ${selected?.id === p.id ? styles.active : ''}`} onClick={() => open(p)}>
            {avatar(p)}<span><b>{p.displayName}</b><small>{p.jobTitle || p.mail || ''}</small></span>
          </button>)}
      </section>
      <aside className={styles.detail}>
        {!selected ? <p className={styles.empty}>Select a person to see their profile.</p> : <>
          {avatar(selected, true)}
          <h2>{selected.displayName}</h2>
          <p className={styles.sub}>{[selected.jobTitle, selected.department].filter(Boolean).join(' · ') || 'No job title'}</p>
          <dl>
            <dt>Email</dt><dd>{selected.mail || '—'}</dd>
            <dt>Phone</dt><dd>{selected.businessPhones?.[0] || selected.mobilePhone || '—'}</dd>
            <dt>Office</dt><dd>{selected.officeLocation || '—'}</dd>
            <dt>Manager</dt><dd>{manager === undefined ? 'Loading…' : !manager.displayName ? '—' : `${manager.displayName}${manager.jobTitle ? ` (${manager.jobTitle})` : ''}`}</dd>
          </dl>
        </>}
      </aside>
    </div>
  </main>;
};
export default Directory;
