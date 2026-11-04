import * as React from 'react';
import { SPFI } from '@pnp/sp';
import { GraphFI } from '@pnp/graph';
import { User } from '@microsoft/microsoft-graph-types';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/fields';
import '@pnp/sp/views';
import '@pnp/graph/users';
import '@pnp/graph/mail';
import '@pnp/graph/calendars';
import { nextDay, overlaps, workingDays } from './leaveDates';
import styles from './HelloWorldWebPart.module.scss';

const LIST_TITLE = 'Leave Requests';
const LEAVE_TYPES = ['Annual', 'Sick', 'Casual', 'Unpaid'];
const STATUSES = ['Pending', 'Approved', 'Rejected'];
const VIEW_FIELDS = ['LeaveType', 'LeaveStart', 'LeaveEnd', 'LeaveDays', 'LeaveStatus', 'RequesterName', 'ApproverName'];
const SELECT = ['Id', 'Title', ...VIEW_FIELDS, 'LeaveReason', 'RequesterEmail', 'ApproverEmail', 'CalendarEventId'];

interface ILeave {
  Id: number; Title: string; LeaveType: string; LeaveStart: string; LeaveEnd: string; LeaveDays: number; LeaveStatus: string;
  LeaveReason?: string; RequesterName: string; RequesterEmail: string; ApproverName: string; ApproverEmail: string; CalendarEventId?: string;
}
interface IPerson { name: string; email: string; }
export interface ILeaveRequestsProps { sp: SPFI; graph: GraphFI; }

// Creates the "Leave Requests" list (generic list template 100) with its columns the first time the web part runs.
async function ensureList(sp: SPFI): Promise<void> {
  const result = await sp.web.lists.ensure(LIST_TITLE, 'Created by the PnP Leave Requests web part', 100);
  if (!result.created) return;
  const fields = result.list.fields;
  await fields.addChoice('LeaveType', { Choices: LEAVE_TYPES });
  await fields.addText('LeaveStart');
  await fields.addText('LeaveEnd');
  await fields.addNumber('LeaveDays');
  await fields.addChoice('LeaveStatus', { Choices: STATUSES });
  await fields.addMultilineText('LeaveReason', { RichText: false });
  await fields.addText('RequesterName');
  await fields.addText('RequesterEmail', { Indexed: true });
  await fields.addText('ApproverName');
  await fields.addText('ApproverEmail', { Indexed: true });
  await fields.addText('CalendarEventId');
  for (const f of VIEW_FIELDS) await result.list.defaultView.fields.add(f);
}

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function toPerson(u: User): IPerson {
  return { name: u.displayName || '', email: u.mail || u.userPrincipalName || '' };
}

function dateRange(l: ILeave): string {
  return l.LeaveStart === l.LeaveEnd ? l.LeaveStart : `${l.LeaveStart} to ${l.LeaveEnd}`;
}

const LeaveRequests: React.FC<ILeaveRequestsProps> = ({ sp, graph }) => {
  const [me, setMe] = React.useState<IPerson | undefined>();
  const [manager, setManager] = React.useState<IPerson | undefined>();
  const [mine, setMine] = React.useState<ILeave[]>([]);
  const [toApprove, setToApprove] = React.useState<ILeave[]>([]);
  const [tab, setTab] = React.useState<'mine' | 'approvals'>('mine');
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [leaveType, setLeaveType] = React.useState(LEAVE_TYPES[0]);
  const [start, setStart] = React.useState('');
  const [end, setEnd] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [people, setPeople] = React.useState<IPerson[]>([]);
  const [pickedApprover, setPickedApprover] = React.useState<IPerson | undefined>();

  const list = sp.web.lists.getByTitle(LIST_TITLE);
  const approver = manager || pickedApprover;

  const loadLeaves = async (email: string): Promise<void> => {
    const q = email.replace(/'/g, "''");
    const leavesWhere = (column: string): Promise<ILeave[]> =>
      list.items.select(...SELECT).filter(`${column} eq '${q}'`).orderBy('Id', false).top(100)();
    const [own, team] = await Promise.all([leavesWhere('RequesterEmail'), leavesWhere('ApproverEmail')]);
    setMine(own);
    setToApprove(team);
  };

  React.useEffect(() => {
    const init = async (): Promise<void> => {
      // Microsoft Graph: GET /me
      const person = toPerson(await graph.me.select('displayName', 'mail', 'userPrincipalName')());
      setMe(person);
      // Microsoft Graph: GET /me/manager. Returns 404 when no manager is set, and the user picks an approver instead.
      try {
        setManager(toPerson(await graph.me.manager.select('displayName', 'mail', 'userPrincipalName')()));
      } catch (e) {
        if ((e as { status?: number }).status !== 404) setError(`Manager lookup failed: ${errorText(e)}`);
      }
      await ensureList(sp);
      await loadLeaves(person.email);
    };
    init().catch(e => setError(errorText(e))).then(() => setLoading(false), () => setLoading(false));
  }, []);

  // Microsoft Graph people search: GET /users?$filter=startswith(displayName,'...')
  React.useEffect(() => {
    if (query.length < 2 || pickedApprover) { setPeople([]); return; }
    const handle = setTimeout(() => {
      const q = query.replace(/'/g, "''");
      graph.users.filter(`startswith(displayName,'${q}')`).select('displayName', 'mail', 'userPrincipalName').top(5)()
        .then(users => setPeople(users.map(toPerson).filter(p => p.email !== me?.email)))
        .catch(e => setError(`People search failed: ${errorText(e)}`));
    }, 300);
    return () => clearTimeout(handle);
  }, [query, pickedApprover]);

  // The list item is the source of truth, so a failed email is reported without undoing the saved change.
  const notify = async (to: IPerson, subject: string, lines: string[]): Promise<void> => {
    try {
      // Microsoft Graph: POST /me/sendMail. Plain text, so user-entered values cannot inject HTML into the email.
      await graph.me.sendMail({
        subject,
        body: { contentType: 'text', content: [...lines, '', `Open the app: ${window.location.href}`].join('\n') },
        toRecipients: [{ emailAddress: { name: to.name, address: to.email } }]
      });
    } catch (e) {
      setNotice(`Saved, but the email to ${to.name} could not be sent: ${errorText(e)}`);
    }
  };

  const run = (action: () => Promise<unknown>): void => {
    if (!me) return;
    setBusy(true); setError(''); setNotice('');
    action().then(() => loadLeaves(me.email)).catch(e => setError(errorText(e))).then(() => setBusy(false), () => setBusy(false));
  };

  const submit = (ev: React.FormEvent): void => {
    ev.preventDefault();
    if (!me || !approver) return;
    const requester = me;
    if (!start || !end) { setError('Choose a start and an end date.'); return; }
    if (end < start) { setError('The end date cannot be before the start date.'); return; }
    const days = workingDays(start, end);
    if (days === 0) { setError('The selected dates only cover a weekend.'); return; }
    const clash = mine.find(l => l.LeaveStatus !== 'Rejected' && overlaps(start, end, l.LeaveStart, l.LeaveEnd));
    if (clash) { setError(`These dates overlap your ${clash.LeaveStatus.toLowerCase()} request for ${dateRange(clash)}.`); return; }

    run(async () => {
      const text = reason.trim();
      await list.items.add({
        Title: `${leaveType} leave - ${requester.name}`,
        LeaveType: leaveType, LeaveStart: start, LeaveEnd: end, LeaveDays: days, LeaveStatus: 'Pending', LeaveReason: text || null,
        RequesterName: requester.name, RequesterEmail: requester.email, ApproverName: approver.name, ApproverEmail: approver.email
      });
      setStart(''); setEnd(''); setReason('');
      setNotice(`Request sent to ${approver.name} for approval.`);
      await notify(approver, `Leave request from ${requester.name}`, [
        `${requester.name} requested ${leaveType.toLowerCase()} leave from ${start} to ${end} (${days} working day${days === 1 ? '' : 's'}).`,
        ...(text ? [`Reason: ${text}`] : [])
      ]);
    });
  };

  const decide = (l: ILeave, status: string): void => run(async () => {
    await list.items.getById(l.Id).update({ LeaveStatus: status });
    setNotice(`${l.RequesterName}'s request was ${status.toLowerCase()}.`);
    await notify({ name: l.RequesterName, email: l.RequesterEmail }, `Your leave request was ${status.toLowerCase()}`, [
      `${l.ApproverName} ${status.toLowerCase()} your ${l.LeaveType.toLowerCase()} leave for ${dateRange(l)}.`
    ]);
  });

  // Microsoft Graph: POST /me/events. The end of an all-day event is exclusive, so it is the day after the last day of leave.
  const addToCalendar = (l: ILeave): void => run(async () => {
    const event = await graph.me.events.add({
      subject: `${l.LeaveType} leave`,
      isAllDay: true,
      showAs: 'oof',
      start: { dateTime: `${l.LeaveStart}T00:00:00`, timeZone: 'UTC' },
      end: { dateTime: `${nextDay(l.LeaveEnd)}T00:00:00`, timeZone: 'UTC' }
    });
    await list.items.getById(l.Id).update({ CalendarEventId: event.id });
    setNotice('Added to your calendar as out of office.');
  });

  const statusClass = (status: string): string => `${styles.status} ${status === 'Approved' ? styles.approved : status === 'Rejected' ? styles.rejected : styles.pending}`;
  const year = String(new Date().getFullYear());
  const daysTaken = mine.filter(l => l.LeaveStatus === 'Approved' && l.LeaveStart.indexOf(year) === 0).reduce((sum, l) => sum + l.LeaveDays, 0);
  const pendingMine = mine.filter(l => l.LeaveStatus === 'Pending').length;
  const pendingTeam = toApprove.filter(l => l.LeaveStatus === 'Pending').length;
  const previewDays = start && end && end >= start ? workingDays(start, end) : 0;

  return <main className={styles.app}>
    <header className={styles.header}>
      <div><p className={styles.kicker}>PNPJS · SHAREPOINT LIST + MICROSOFT GRAPH</p><h1>Leave Requests</h1>{me && <p className={styles.hello}>Signed in as {me.name}</p>}</div>
      <div className={styles.counts}>
        <span><b>{pendingMine}</b>My pending</span>
        <span><b>{daysTaken}</b>Days approved in {year}</span>
        <span><b>{pendingTeam}</b>To approve</span>
      </div>
    </header>

    {!loading && me && <form className={styles.form} onSubmit={submit}>
      <label>Type<select value={leaveType} onChange={e => setLeaveType(e.target.value)}>{LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}</select></label>
      <label>From<input type="date" value={start} onChange={e => setStart(e.target.value)} /></label>
      <label>To<input type="date" value={end} onChange={e => setEnd(e.target.value)} /></label>
      <label className={styles.wide}>Reason (optional)<input value={reason} onChange={e => setReason(e.target.value)} /></label>
      <div className={styles.approver}>
        {manager
          ? <p>Approver: <b>{manager.name}</b> <small>your manager, from Microsoft Graph</small></p>
          : <div className={styles.picker}>
            {pickedApprover
              ? <span className={styles.chip}>{pickedApprover.name}<button type="button" aria-label="Remove approver" onClick={() => { setPickedApprover(undefined); setQuery(''); }}>×</button></span>
              : <input placeholder="No manager set. Search for an approver" aria-label="Approver" value={query} onChange={e => setQuery(e.target.value)} />}
            {people.length > 0 && <ul>{people.map(p => <li key={p.email}><button type="button" onClick={() => { setPickedApprover(p); setPeople([]); }}><b>{p.name}</b><small>{p.email}</small></button></li>)}</ul>}
          </div>}
      </div>
      <div className={styles.submit}>
        {previewDays > 0 && <small>{previewDays} working day{previewDays === 1 ? '' : 's'}</small>}
        <button type="submit" className={styles.primary} disabled={busy || !approver}>Submit request</button>
      </div>
    </form>}

    {error && <p className={styles.error} role="alert">{error}</p>}
    {notice && <p className={styles.notice} role="status">{notice}</p>}

    <div className={styles.tabs} role="tablist">
      <button type="button" role="tab" aria-selected={tab === 'mine'} className={tab === 'mine' ? styles.activeTab : undefined} onClick={() => setTab('mine')}>My requests</button>
      <button type="button" role="tab" aria-selected={tab === 'approvals'} className={tab === 'approvals' ? styles.activeTab : undefined} onClick={() => setTab('approvals')}>Team approvals{pendingTeam > 0 && ` (${pendingTeam})`}</button>
    </div>

    {loading ? <p className={styles.empty}>Loading requests…</p> : tab === 'mine'
      ? mine.length === 0 ? <p className={styles.empty}>You have no leave requests yet.</p> :
        <table className={styles.table}>
          <thead><tr><th>Type</th><th>Dates</th><th>Days</th><th>Approver</th><th>Status</th><th /></tr></thead>
          <tbody>{mine.map(l => <tr key={l.Id}>
            <td>{l.LeaveType}{l.LeaveReason && <small>{l.LeaveReason}</small>}</td>
            <td>{dateRange(l)}</td>
            <td>{l.LeaveDays}</td>
            <td>{l.ApproverName}</td>
            <td><span className={statusClass(l.LeaveStatus)}>{l.LeaveStatus}</span></td>
            <td className={styles.actions}>
              {l.LeaveStatus === 'Pending' && <button type="button" className={styles.remove} disabled={busy} onClick={() => run(() => list.items.getById(l.Id).recycle())}>Cancel</button>}
              {l.LeaveStatus === 'Approved' && (l.CalendarEventId
                ? <small>In your calendar</small>
                : <button type="button" className={styles.secondary} disabled={busy} onClick={() => addToCalendar(l)}>Add to calendar</button>)}
            </td>
          </tr>)}</tbody>
        </table>
      : toApprove.length === 0 ? <p className={styles.empty}>Nobody has sent you a leave request.</p> :
        <table className={styles.table}>
          <thead><tr><th>Employee</th><th>Type</th><th>Dates</th><th>Days</th><th>Status</th><th /></tr></thead>
          <tbody>{toApprove.map(l => <tr key={l.Id}>
            <td>{l.RequesterName}<small>{l.RequesterEmail}</small></td>
            <td>{l.LeaveType}{l.LeaveReason && <small>{l.LeaveReason}</small>}</td>
            <td>{dateRange(l)}</td>
            <td>{l.LeaveDays}</td>
            <td><span className={statusClass(l.LeaveStatus)}>{l.LeaveStatus}</span></td>
            <td className={styles.actions}>
              {l.LeaveStatus === 'Pending' && <>
                <button type="button" className={styles.secondary} disabled={busy} onClick={() => decide(l, 'Approved')}>Approve</button>
                <button type="button" className={styles.remove} disabled={busy} onClick={() => decide(l, 'Rejected')}>Reject</button>
              </>}
            </td>
          </tr>)}</tbody>
        </table>}
    <footer>Requests are stored in the “{LIST_TITLE}” list on this site. Weekends are not counted; public holidays are.</footer>
  </main>;
};
export default LeaveRequests;
