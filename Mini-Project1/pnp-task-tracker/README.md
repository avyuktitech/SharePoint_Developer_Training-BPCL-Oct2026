# PnP Task Tracker (SPFx + PnPjs + Microsoft Graph)

A task list web part that shows full create, read, update and delete operations with PnPjs.

| Feature | API |
| --- | --- |
| Creates the **Training Tasks** list and its columns on first run | `sp.web.lists.ensure()`, `list.fields.addChoice/addDateTime/addText()` |
| Lists tasks | `list.items.select(...).orderBy(...).top(100)()` |
| Adds, updates status, deletes (to recycle bin) | `items.add()`, `items.getById(id).update()`, `.recycle()` |
| "Assign to" people search | Microsoft Graph `graph.users.filter("startswith(displayName,'...')")` |

Code: `src/webparts/helloWorld/TaskTracker.tsx`. The PnPjs `spfi()` and `graphfi()` instances are created in `HelloWorldWebPart.ts`.
## Run locally

Requires Node.js 22.14.x and a SharePoint Framework development environment.

```powershell
npm install
npm start
```

Open `https://<tenant>.sharepoint.com/sites/<site>/_layouts/15/workbench.aspx` and add the web part.

## Deploy

1. `npm run build` creates `sharepoint/solution/pnptasks.sppkg`.
2. Upload it to the tenant App Catalog and enable it.
3. Approve the Microsoft Graph permissions: **SharePoint admin center â†’ Advanced â†’ API access**, select each pending request for this solution and click **Approve**:
   - Microsoft Graph Â· `User.ReadBasic.All`
   Until they are approved, the Graph calls return an error message in the web part.