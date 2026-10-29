import * as React from 'react';
import { SPFI } from '@pnp/sp';
import { GraphFI } from '@pnp/graph';
import { DateTimeFieldFormatType } from '@pnp/sp/fields';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/fields';
import '@pnp/sp/views';
import '@pnp/graph/users';
import styles from './HelloWorldWebPart.module.scss';

const LIST_TITLE = 'Training Tasks';
const STATUSES = ['Not started', 'In progress', 'Done'];
const FIELDS = ['TaskStatus', 'TaskDueDate', 'AssignedToName', 'AssignedToEmail'];

interface ITask { Id: number; Title: string; TaskStatus: string; TaskDueDate?: string; AssignedToName?: string; AssignedToEmail?: string; }
interface IPerson { name: string; email: string; }
export interface ITaskTrackerProps { sp: SPFI; graph: GraphFI; }

// Creates the "Training Tasks" list (generic list template 100) with its columns the first time the web part runs.
async function ensureList(sp: SPFI): Promise<void> {
  const result = await sp.web.lists.ensure(LIST_TITLE, 'Created by the PnP Task Tracker web part', 100);
  if (!result.created) return;
  const fields = result.list.fields;
  await fields.addChoice('TaskStatus', { Choices: STATUSES });
  await fields.addDateTime('TaskDueDate', { DisplayFormat: DateTimeFieldFormatType.DateOnly });
  await fields.addText('AssignedToName');
  await fields.addText('AssignedToEmail');
  for (const f of FIELDS) await result.list.defaultView.fields.add(f);
}

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

const TaskTracker: React.FC<ITaskTrackerProps> = ({ sp, graph }) => {
  const [tasks, setTasks] = React.useState<ITask[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [due, setDue] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [people, setPeople] = React.useState<IPerson[]>([]);
  const [assignee, setAssignee] = React.useState<IPerson | undefined>();

  const list = sp.web.lists.getByTitle(LIST_TITLE);

  const loadTasks = async (): Promise<void> => {
    const items: ITask[] = await list.items.select('Id', 'Title', ...FIELDS).orderBy('Id', false).top(100)();
    setTasks(items);
  };

  React.useEffect(() => {
    ensureList(sp).then(loadTasks).catch(e => setError(errorText(e))).then(() => setLoading(false), () => setLoading(false));
  }, []);

  // Microsoft Graph people search: GET /users?$filter=startswith(displayName,'...')
  React.useEffect(() => {
    if (query.length < 2 || assignee) { setPeople([]); return; }
    const handle = setTimeout(() => {
      const q = query.replace(/'/g, "''");
      graph.users.filter(`startswith(displayName,'${q}')`).select('displayName', 'mail', 'userPrincipalName').top(5)()
        .then(users => setPeople(users.map(u => ({ name: u.displayName || '', email: u.mail || u.userPrincipalName || '' }))))
        .catch(e => setError(`People search failed: ${errorText(e)}`));
    }, 300);
    return () => clearTimeout(handle);
  }, [query, assignee]);

  const run = (action: () => Promise<unknown>): void => {
    setError('');
    action().then(loadTasks).catch(e => setError(errorText(e)));
  };

  const addTask = (ev: React.FormEvent): void => {
    ev.preventDefault();
    if (!title.trim()) return;
    run(async () => {
      await list.items.add({
        Title: title.trim(),
        TaskStatus: STATUSES[0],
        TaskDueDate: due ? new Date(due).toISOString() : null,
        AssignedToName: assignee?.name || null,
        AssignedToEmail: assignee?.email || null
      });
      setTitle(''); setDue(''); setQuery(''); setAssignee(undefined);
    });
  };

  const counts = STATUSES.map(s => tasks.filter(t => t.TaskStatus === s).length);

  return <main className={styles.app}>
    <header className={styles.header}>
      <div><p className={styles.kicker}>PNPJS · SHAREPOINT LIST + MICROSOFT GRAPH</p><h1>Task Tracker</h1></div>
      <div className={styles.counts}>{STATUSES.map((s, i) => <span key={s}><b>{counts[i]}</b>{s}</span>)}</div>
    </header>

    <form className={styles.form} onSubmit={addTask}>
      <input placeholder="What needs to be done?" value={title} onChange={e => setTitle(e.target.value)} />
      <div className={styles.picker}>
        {assignee
          ? <span className={styles.chip}>{assignee.name}<button type="button" aria-label="Remove assignee" onClick={() => { setAssignee(undefined); setQuery(''); }}>×</button></span>
          : <input placeholder="Assign to (search people)" value={query} onChange={e => setQuery(e.target.value)} />}
        {people.length > 0 && <ul>{people.map(p => <li key={p.email}><button type="button" onClick={() => { setAssignee(p); setPeople([]); }}><b>{p.name}</b><small>{p.email}</small></button></li>)}</ul>}
      </div>
      <input type="date" value={due} onChange={e => setDue(e.target.value)} aria-label="Due date" />
      <button type="submit" className={styles.primary}>Add task</button>
    </form>

    {error && <p className={styles.error}>{error}</p>}
    {loading ? <p className={styles.empty}>Loading tasks…</p> : tasks.length === 0 ? <p className={styles.empty}>No tasks yet. Add the first one above.</p> :
      <table className={styles.table}>
        <thead><tr><th>Task</th><th>Assigned to</th><th>Due</th><th>Status</th><th /></tr></thead>
        <tbody>{tasks.map(t => <tr key={t.Id} className={t.TaskStatus === 'Done' ? styles.done : undefined}>
          <td>{t.Title}</td>
          <td>{t.AssignedToName || '—'}{t.AssignedToEmail && <small>{t.AssignedToEmail}</small>}</td>
          <td>{t.TaskDueDate ? new Date(t.TaskDueDate).toLocaleDateString() : '—'}</td>
          <td><select value={t.TaskStatus} onChange={e => { const v = e.target.value; run(() => list.items.getById(t.Id).update({ TaskStatus: v })); }}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></td>
          <td><button type="button" className={styles.remove} onClick={() => run(() => list.items.getById(t.Id).recycle())}>Delete</button></td>
        </tr>)}</tbody>
      </table>}
    <footer>Data is stored in the “{LIST_TITLE}” list on this site. Deleted tasks go to the site recycle bin.</footer>
  </main>;
};
export default TaskTracker;
