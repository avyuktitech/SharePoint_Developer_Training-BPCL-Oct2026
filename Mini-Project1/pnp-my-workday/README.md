# PnP My Workday (SPFx + PnPjs + Microsoft Graph)

A personal "my day" dashboard web part. Each panel loads separately and shows its own error, so a missing permission only affects that panel.

| Panel | API |
| --- | --- |
| Greeting | `graph.me()` |
| Upcoming meetings (7 days) | `graph.me.calendarView(start, end)` |
| Unread email | `graph.me.messages.filter("isRead eq false")` |
| Recent files | `graph.me.drive.recent()` |
| Document libraries on this site | `sp.web.lists.filter("BaseTemplate eq 101 and Hidden eq false")` |

Code: `src/webparts/helloWorld/Workday.tsx`. The PnPjs `spfi()` and `graphfi()` instances are created in `HelloWorldWebPart.ts`.
## Run locally

Requires Node.js 22.14.x and a SharePoint Framework development environment.

```powershell
npm install
npm start
```

Open `https://<tenant>.sharepoint.com/sites/<site>/_layouts/15/workbench.aspx` and add the web part.

## Deploy

1. `npm run build` creates `sharepoint/solution/pnpworkday.sppkg`.
2. Upload it to the tenant App Catalog and enable it.
3. Approve the Microsoft Graph permissions: **SharePoint admin center â†’ Advanced â†’ API access**, select each pending request for this solution and click **Approve**:
   - Microsoft Graph Â· `User.Read`
   - Microsoft Graph Â· `Calendars.Read`
   - Microsoft Graph Â· `Mail.Read`
   - Microsoft Graph Â· `Files.Read`
   Until they are approved, the Graph calls return an error message in the web part.