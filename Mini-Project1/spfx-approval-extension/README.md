# SPFx Approval Extension (SharePoint extension + Power Automate)

A purchase request approval built from two parts:

- **SPFx ListView Command Set:** adds a **Send for approval** button to the **Purchase Requests** list.
- **Power Automate flow:** runs the approval, records the decision and emails the requester.

## How it works

```
Employee selects rows and clicks "Send for approval"
  |  SPFx checks each item, then sets ApprovalStatus = Submitted
  v
SharePoint list "Purchase Requests"
  |  the flow's trigger sees the change
  v
Power Automate: Pending approval > approver responds > Approved or Rejected > email to requester
```

The list connects the two parts, and the extension never calls the flow directly. The alternative is an HTTP-triggered flow, but this design has three advantages:

- **No secret in the browser:** an HTTP trigger URL would have to be available to client-side code.
- **Normal permissions:** SharePoint decides who can submit, using the person's own access.
- **No premium licence:** the HTTP trigger is a premium connector, while this flow uses standard ones.

| Part | File |
|---|---|
| Command visibility and click handling | `src/extensions/approvalCommandSet/ApprovalCommandSetCommandSet.ts` |
| Approval rules, with tests | `approvalLogic.ts`, `approvalLogic.test.ts` |
| SharePoint REST calls | `SharePointRequestList.ts` |
| Registers the command on the site | `sharepoint/assets/elements.xml` |
| Flow build guide | [`docs/power-automate-flow.md`](docs/power-automate-flow.md) |

The command only sends an item when its status is blank, `Draft` or `Rejected`, it has an approver, and that approver isn't the person clicking. It checks a fresh copy of each item rather than what's on screen.

## Setup

### 1. Create the list

Create a blank list named exactly `Purchase Requests`, then add these columns.

Type each name **without spaces** when you create the column, because that name becomes its permanent internal name, which the code and flow rely on. You can change the display name afterwards.

| Column | Type | Settings |
|---|---|---|
| `Title` | Built in | Already there |
| `Amount` | Currency or Number | |
| `Justification` | Multiple lines of text | Plain text |
| `ApprovalStatus` | Choice | `Draft`, `Submitted`, `Pending approval`, `Approved`, `Rejected`. Default: `Draft` |
| `Approver` | Person | One person only |
| `ApprovalComments` | Multiple lines of text | Plain text |

### 2. Deploy the extension

Requires Node.js 22.14.x or later 22.x.

```powershell
npm install
npm run build
```

1. Upload `sharepoint/solution/spfx-approval-extension.sppkg` to the tenant App Catalog and enable it.
2. On your site, go to **Site contents > New > App** and add **spfx-approval-extension-client-side-solution**.
3. Open the list and select a row. **Send for approval** appears in the command bar.

The extension has no Graph permissions to approve, because it only calls SharePoint as the signed-in user.

### 3. Build the flow

Follow [`docs/power-automate-flow.md`](docs/power-automate-flow.md). Flows are created in your tenant, so this step is done in the Power Automate portal.

## Debug locally

1. In `config/serve.json`, replace both `pageUrl` values with the URL of your list.
2. Run `npm start`.
3. In the browser, select **Load debug scripts**.

## Limitations

This is a training sample, not a production approval system:

- **The status column can be edited directly.** Anyone who can edit the list can set `ApprovalStatus` to `Approved` by hand, or change the approver. A production version needs restricted column or item permissions, with status changes made only by the flow's account.
- **Self-approval is only blocked by the button.** A user who edits the list directly to `Submitted` still starts the flow. Add a condition to the flow to enforce it there too.
- **The flow isn't included as a file.** You build it from the guide, because an exported flow package is tied to the tenant and connections it was exported from.
- **Status updates aren't instant.** The trigger checks the list on a schedule, so `Submitted` can last a few minutes.
