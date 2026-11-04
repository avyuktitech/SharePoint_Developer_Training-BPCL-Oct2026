# Build the Power Automate flow

This flow does the approval work after the **Send for approval** command sets a request to `Submitted`. It uses only standard connectors, so a Microsoft 365 licence that includes Power Automate is enough.

Build it in the same tenant as the **Purchase Requests** list. The list must already exist, as described in the [project README](../README.md).

## What the finished flow looks like

```
When an item is created or modified  (runs only when ApprovalStatus = Submitted)
  |
Update item: ApprovalStatus = Pending approval
  |
Start and wait for an approval  (Assigned to = Approver, times out after 14 days)
  |                                             |
  | succeeded                                   | failed or timed out
  v                                             v
Condition: Outcome = Approve                 Update item: ApprovalStatus = Draft
  | Yes                    | No              + note in ApprovalComments
  v                        v
Update item: Approved    Update item: Rejected
Email the requester      Email the requester
```

## Step 1: Create the flow and its trigger

1. Go to [make.powerautomate.com](https://make.powerautomate.com) and select **Create > Automated cloud flow**.
2. Name it `Purchase request approval`.
3. Choose the SharePoint trigger **When an item is created or modified**, then select **Create**.
4. Set **Site Address** to your site and **List Name** to `Purchase Requests`.

## Step 2: Add the trigger condition

This condition stops the flow running on every edit. It's also what prevents an endless loop, because the flow's own updates never set the status to `Submitted`.

1. Open the trigger's **Settings**.
2. Under **Trigger conditions**, select **Add** and paste:

```
@equals(triggerOutputs()?['body/ApprovalStatus/Value'], 'Submitted')
```

## Step 3: Mark the request as pending

Add the SharePoint action **Update item** and rename it `Mark as pending`:

| Field | Value |
|---|---|
| Site Address, List Name | Same as the trigger |
| Id | **ID** from the trigger |
| Title | **Title** from the trigger |
| ApprovalStatus Value | `Pending approval` |

## Step 4: Start the approval

Add the Approvals action **Start and wait for an approval**. Keep its default name, because the expressions below use it.

| Field | Value |
|---|---|
| Approval type | **Approve/Reject - First to respond** |
| Title | `Purchase approval:` followed by **Title** from the trigger |
| Assigned to | **Approver Email** from the trigger |
| Details | **Amount** and **Justification** from the trigger, with **Modified By DisplayName** as the requester |
| Item link | **Link to item** from the trigger |
| Item link description | `Open the request` |

Then open the action's **Settings** and set **Action timeout** to `P14D`. A flow run can't last longer than 30 days, so this lets the failure branch in Step 7 run before that limit.

## Step 5: Branch on the outcome

Add a **Condition** after the approval:

| Left value | Operator | Right value |
|---|---|---|
| **Outcome** from the approval | is equal to | `Approve` |

## Step 6: Record the decision and email the requester

For both comment fields below, enter this as an expression:

```
first(outputs('Start_and_wait_for_an_approval')?['body/responses'])?['comments']
```

**In the True branch**, add:

1. **Update item**, with the same Site, List, Id and Title as Step 3, plus:
   - **ApprovalStatus Value:** `Approved`
   - **ApprovalComments:** the expression above
2. The Office 365 Outlook action **Send an email (V2)**:
   - **To:** **Modified By Email** from the trigger
   - **Subject:** `Approved:` followed by **Title** from the trigger
   - **Body:** a short message with the comments and **Link to item**

**In the False branch**, add the same two actions, using `Rejected` for the status and `Rejected:` in the subject.

**Modified By** comes from the trigger, so it's the person who clicked **Send for approval**. The flow's own updates don't change it.

## Step 7: Handle failures and timeouts

Without this step, a request stays on `Pending approval` forever if the approval fails or times out.

1. Add a new parallel action after **Start and wait for an approval**: another **Update item**, renamed `Reset after failure`.
2. Set the same Site, List, Id and Title as Step 3, plus:
   - **ApprovalStatus Value:** `Draft`
   - **ApprovalComments:** `The approval could not be completed. Please send it again.`
3. Open its **Settings**, and under **Run after**, select only **Has failed** and **Has timed out** for the approval action.

## Step 8: Save and test

1. Save the flow.
2. As the employee, create a request and choose a different person as **Approver**.
3. Select the row and click **Send for approval**. The status becomes `Submitted`.
4. Wait for the status to change to `Pending approval`. The trigger checks the list on a schedule, so this can take a few minutes.
5. As the approver, respond from the email or at **Power Automate > Approvals**.
6. Check that the status and comments update and that the employee gets an email.

## Troubleshooting

| Symptom | What to check |
|---|---|
| The flow never runs | Check the condition in Step 2 is exact. A status column whose internal name isn't `ApprovalStatus` won't match, so see the column steps in the README. |
| The flow fails at the approval on its first run | Approvals sets up its data store in the environment the first time, which can take a few minutes or need an admin. Run it again. |
| **Assigned to** fails | The **Approver** column is empty, or that person has no mailbox. |
| Updates fail with an access error | The flow's connections run as the person who created it, who needs **Edit** access to the list. |
| Emails come from the wrong person | **Send an email (V2)** sends from the connection owner's mailbox. This is expected, and a shared mailbox action is the usual production choice. |
