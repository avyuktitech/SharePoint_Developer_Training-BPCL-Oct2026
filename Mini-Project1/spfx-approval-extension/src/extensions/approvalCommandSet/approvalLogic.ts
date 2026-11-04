// The Power Automate flow starts when ApprovalStatus becomes this value (see docs/power-automate-flow.md).
export const SUBMITTED = 'Submitted';
const RESUBMITTABLE = ['Draft', 'Rejected'];

export interface IRequestItem { id: number; title: string; status?: string; approverId?: number; etag: string; }
export interface IRequestList {
  getItem(id: number): Promise<IRequestItem>;
  submit(item: IRequestItem): Promise<void>;
}
export interface ISendResult { sent: string[]; skipped: string[]; failed: string[]; }

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

// A blank status counts as Draft, because items created before the column existed have no value.
export function skipReason(item: IRequestItem, currentUserId: number): string | undefined {
  if (item.status && RESUBMITTABLE.indexOf(item.status) < 0) return `already ${item.status.toLowerCase()}`;
  if (!item.approverId) return 'no approver chosen';
  if (item.approverId === currentUserId) return 'you cannot approve your own request';
  return undefined;
}

// Rules are checked against a fresh copy of each item, because the list view on screen can be out of date.
export async function sendForApproval(ids: number[], currentUserId: number, list: IRequestList): Promise<ISendResult> {
  const result: ISendResult = { sent: [], skipped: [], failed: [] };
  for (const id of ids) {
    let label = `Item ${id}`;
    try {
      const item = await list.getItem(id);
      label = item.title || label;
      const reason = skipReason(item, currentUserId);
      if (reason) {
        result.skipped.push(`${label}: ${reason}`);
      } else {
        await list.submit(item);
        result.sent.push(label);
      }
    } catch (e) {
      result.failed.push(`${label}: ${errorText(e)}`);
    }
  }
  return result;
}

export function summarize(result: ISendResult): string {
  const section = (heading: string, lines: string[]): string[] => lines.length ? [`${heading}\n${lines.join('\n')}`] : [];
  return [
    ...section('Sent for approval:', result.sent),
    ...section('Not sent:', result.skipped),
    ...section('Failed:', result.failed)
  ].join('\n\n');
}
