# PnP Leave Requests (SPFx + PnPjs + Microsoft Graph)

A small leave approval workflow. Employees submit a request, their manager approves or rejects it, and approved leave can be added to the employee's Outlook calendar as out of office.

## How it works

1. **Request.** The employee fills in the form. The approver comes from Graph (`/me/manager`). If no manager is set, the employee searches for an approver instead.
2. **Save and notify.** The request is saved to a SharePoint list and the approver gets an email.
3. **Decide.** The approver opens **Team approvals** and approves or rejects it. The employee gets an email.
4. **Calendar.** On an approved request, the employee clicks **Add to calendar** to create an all-day out of office event.

| Feature | Library | API |
| --- | --- | --- |
| Create the list and columns on first run | `@pnp/sp` | `sp.web.lists.ensure()`, `list.fields.add*()` |
| Read, create, update and cancel requests | `@pnp/sp` | `list.items.filter()`, `.add()`, `.getById().update()`, `.recycle()` |
| Signed-in user | `@pnp/graph` | `graph.me()` |
| Default approver | `@pnp/graph` | `graph.me.manager()` |
| Approver search when no manager is set | `@pnp/graph` | `graph.users.filter("startswith(displayName,'...')")` |
| Email notifications | `@pnp/graph` | `graph.me.sendMail()` |
| Out of office event | `@pnp/graph` | `graph.me.events.add()` |

The app code is in `src/webparts/helloWorld/LeaveRequests.tsx`, and the date logic is in `leaveDates.ts` with unit tests in `leaveDates.test.ts`. The PnPjs `spfi()` and `graphfi()` instances are created in `HelloWorldWebPart.ts`.

## Run locally

Requires Node.js 22.14.x or later 22.x and a SharePoint Framework development environment.

```powershell
npm install
npm start
```

Open `https://<tenant>.sharepoint.com/sites/<site>/_layouts/15/workbench.aspx` and add the **PnP Leave Requests** web part. The Graph calls fail in the workbench until the permissions below are approved.

## Deploy

1. `npm run build` creates `sharepoint/solution/pnpleave.sppkg`.
2. Upload it to the tenant App Catalog and enable it.
3. Approve the Microsoft Graph permissions: **SharePoint admin center > Advanced > API access**, select each pending request for this solution and click **Approve**:
   - `User.Read`: read the signed-in user and their manager
   - `User.ReadBasic.All`: search for an approver
   - `Mail.Send`: send notifications as the signed-in user
   - `Calendars.ReadWrite`: create the out of office event
4. Give employees and approvers **Edit** or **Contribute** access to the site. The first person to open the web part must be able to create lists, because that run creates the **Leave Requests** list.

To try the full flow, use two accounts: one as the employee and one as the manager or chosen approver. You cannot pick yourself as approver.

## Limitations

This is a training sample, not a production HR system:

- **Approval rules are only enforced in the browser.** Anyone who can edit the list can change an item directly, including its status. A production version needs a server-side approval step, such as Power Automate or an Azure Function, and restricted list permissions.
- **Public holidays count as working days.** Only weekends are excluded.
- **There are no leave balances.** The app shows days approved this year, but it doesn't limit them.
- **Calendar events aren't kept in sync.** Deleting the event in Outlook doesn't update the list.
- **Each view loads the latest 100 requests.**
