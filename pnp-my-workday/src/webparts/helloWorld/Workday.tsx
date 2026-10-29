import * as React from 'react';
import { SPFI } from '@pnp/sp';
import { GraphFI } from '@pnp/graph';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/graph/users';
import '@pnp/graph/calendars';
import '@pnp/graph/mail';
import '@pnp/graph/files';
import styles from './HelloWorldWebPart.module.scss';

interface IEvent { id: string; subject: string; start: Date; end: Date; location: string; online: boolean; link?: string; }
interface IMail { id: string; subject: string; from: string; received: Date; link?: string; }
interface IFile { id: string; name: string; modified: Date; link?: string; }
interface ILibrary { id: string; title: string; count: number; modified: Date; }
interface ISection<T> { items?: T[]; error?: string; }
export interface IWorkdayProps { sp: SPFI; graph: GraphFI; }

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

// Each section loads on its own, so one missing permission does not break the whole page.
function useSection<T>(load: () => Promise<T[]>): ISection<T> {
  const [state, setState] = React.useState<ISection<T>>({});
  React.useEffect(() => {
    load().then(items => setState({ items })).catch(e => setState({ error: errorText(e) }));
  }, []);
  return state;
}

// Graph returns event times in UTC without a "Z" suffix.
const utc = (value?: string): Date => new Date(value ? (value.endsWith('Z') ? value : `${value}Z`) : 0);
const time = (d: Date): string => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const day = (d: Date): string => d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });

const Workday: React.FC<IWorkdayProps> = ({ sp, graph }) => {
  const [name, setName] = React.useState('');

  React.useEffect(() => {
    // GET /me
    graph.me.select('displayName', 'givenName')().then(u => setName(u.givenName || u.displayName || '')).catch(() => setName(''));
  }, []);

  // GET /me/calendarView?startDateTime=...&endDateTime=...  (Calendars.Read)
  const events = useSection<IEvent>(async () => {
    const start = new Date();
    const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
    const items = await graph.me.calendarView(start.toISOString(), end.toISOString())
      .select('id', 'subject', 'start', 'end', 'location', 'isOnlineMeeting', 'webLink').orderBy('start/dateTime').top(8)();
    return items.map(e => ({
      id: e.id || '', subject: e.subject || '(No title)', start: utc(e.start?.dateTime || undefined), end: utc(e.end?.dateTime || undefined),
      location: e.location?.displayName || '', online: !!e.isOnlineMeeting, link: e.webLink || undefined
    }));
  });

  // GET /me/messages?$filter=isRead eq false  (Mail.Read)
  const mail = useSection<IMail>(async () => {
    const items = await graph.me.messages.filter('isRead eq false').select('id', 'subject', 'from', 'receivedDateTime', 'webLink').top(6)();
    return items.map(m => ({
      id: m.id || '', subject: m.subject || '(No subject)', from: m.from?.emailAddress?.name || m.from?.emailAddress?.address || '',
      received: new Date(m.receivedDateTime || 0), link: m.webLink || undefined
    }));
  });

  // GET /me/drive/recent  (Files.Read)
  const files = useSection<IFile>(async () => {
    const items = await graph.me.drive.recent();
    return items.slice(0, 6).map(f => ({ id: f.id || '', name: f.name || '', modified: new Date(f.lastModifiedDateTime || 0), link: f.webUrl || undefined }));
  });

  // SharePoint via PnPjs: visible document libraries on this site, most recently changed first.
  const libraries = useSection<ILibrary>(async () => {
    const items = await sp.web.lists.filter('BaseTemplate eq 101 and Hidden eq false')
      .select('Id', 'Title', 'ItemCount', 'LastItemModifiedDate').orderBy('LastItemModifiedDate', false).top(5)();
    return items.map(l => ({ id: l.Id, title: l.Title, count: l.ItemCount, modified: new Date(l.LastItemModifiedDate) }));
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const panel = <T,>(title: string, hint: string, section: ISection<T>, row: (item: T) => JSX.Element, empty: string): JSX.Element =>
    <article className={styles.panel}>
      <h2>{title}<small>{hint}</small></h2>
      {section.error ? <p className={styles.error}>{section.error}</p>
        : !section.items ? <p className={styles.empty}>Loading…</p>
        : section.items.length === 0 ? <p className={styles.empty}>{empty}</p>
        : <ul>{section.items.map(row)}</ul>}
    </article>;

  return <main className={styles.app}>
    <header className={styles.header}>
      <p className={styles.kicker}>PNPJS · MICROSOFT GRAPH /ME</p>
      <h1>{greeting}{name && `, ${name}`}.</h1>
      <p className={styles.sub}>{new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </header>
    <section className={styles.grid}>
      {panel('Upcoming meetings', 'Next 7 days', events, e => <li key={e.id}>
        <span className={styles.when}><b>{time(e.start)}</b>{day(e.start)}</span>
        <span className={styles.what}>{e.link ? <a href={e.link} target="_blank" rel="noreferrer">{e.subject}</a> : e.subject}<small>{[e.online && 'Online', e.location].filter(Boolean).join(' · ') || `${time(e.start)} – ${time(e.end)}`}</small></span>
      </li>, 'No meetings in the next 7 days.')}
      {panel('Unread email', 'Inbox', mail, m => <li key={m.id}>
        <span className={styles.dot} />
        <span className={styles.what}>{m.link ? <a href={m.link} target="_blank" rel="noreferrer">{m.subject}</a> : m.subject}<small>{m.from} · {day(m.received)} {time(m.received)}</small></span>
      </li>, 'Inbox zero. Nice.')}
      {panel('Recent files', 'OneDrive & SharePoint', files, f => <li key={f.id}>
        <span className={styles.fileIcon}>{(f.name.split('.').pop() || '').slice(0, 4).toUpperCase()}</span>
        <span className={styles.what}>{f.link ? <a href={f.link} target="_blank" rel="noreferrer">{f.name}</a> : f.name}<small>Modified {day(f.modified)}</small></span>
      </li>, 'No recent files.')}
      {panel('Libraries on this site', 'SharePoint REST', libraries, l => <li key={l.id}>
        <span className={styles.fileIcon}>LIB</span>
        <span className={styles.what}>{l.title}<small>{l.count} items · changed {day(l.modified)}</small></span>
      </li>, 'No document libraries.')}
    </section>
  </main>;
};
export default Workday;
