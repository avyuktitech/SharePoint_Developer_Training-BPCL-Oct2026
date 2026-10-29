# PnP Employee Directory (SPFx + PnPjs + Microsoft Graph)

A people directory web part built on Microsoft Graph through PnPjs.

| Feature | API |
| --- | --- |
| Lists people, or searches by name or email | `graph.users.using(ConsistencyLevel()).search('"displayName:..."')` |
| Profile photos (initials when none) | `graph.users.getById(id).photos.getBySize("64x64").getBlob()` |
| Profile panel with manager | `graph.users.getById(id).manager()` |
| Site title and signed-in user | `sp.web()`, `sp.web.currentUser()` |

Code: `src/webparts/helloWorld/Directory.tsx`. The PnPjs `spfi()` and `graphfi()` instances are created in `HelloWorldWebPart.ts`.
## Run locally

Requires Node.js 22.14.x and a SharePoint Framework development environment.

```powershell
npm install
npm start
```

Open `https://<tenant>.sharepoint.com/sites/<site>/_layouts/15/workbench.aspx` and add the web part.

## Deploy

1. `npm run build` creates `sharepoint/solution/pnpdirectory.sppkg`.
2. Upload it to the tenant App Catalog and enable it.
3. Approve the Microsoft Graph permissions: **SharePoint admin center â†’ Advanced â†’ API access**, select each pending request for this solution and click **Approve**:
   - Microsoft Graph Â· `User.Read`
   - Microsoft Graph Â· `User.ReadBasic.All`
   - Microsoft Graph Â· `User.Read.All`
   Until they are approved, the Graph calls return an error message in the web part.