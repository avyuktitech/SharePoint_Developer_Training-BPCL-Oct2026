import { IRequestItem, IRequestList, sendForApproval, skipReason, summarize } from './approvalLogic';

const ME = 7;
const APPROVER = 9;
const item = (props: Partial<IRequestItem>): IRequestItem => ({ id: 1, title: 'Laptop', approverId: APPROVER, etag: '"1"', ...props });

describe('skipReason', () => {
  it.each([undefined, 'Draft', 'Rejected'])('allows status %s', status => {
    expect(skipReason(item({ status }), ME)).toBeUndefined();
  });
  it.each(['Submitted', 'Pending approval', 'Approved'])('blocks status %s', status => {
    expect(skipReason(item({ status }), ME)).toBe(`already ${status.toLowerCase()}`);
  });
  it('requires an approver', () => {
    expect(skipReason(item({ approverId: undefined }), ME)).toBe('no approver chosen');
  });
  it('blocks self-approval', () => {
    expect(skipReason(item({ approverId: ME }), ME)).toBe('you cannot approve your own request');
  });
});

describe('sendForApproval', () => {
  const list = (items: IRequestItem[], submitError?: Error): IRequestList & { submitted: number[] } => ({
    submitted: [],
    async getItem(id: number): Promise<IRequestItem> {
      const found = items.filter(i => i.id === id)[0];
      if (!found) throw new Error('HTTP 404');
      return found;
    },
    async submit(i: IRequestItem): Promise<void> {
      if (submitError) throw submitError;
      this.submitted.push(i.id);
    }
  });

  it('submits eligible items and reports the rest, without stopping at a failure', async () => {
    const fake = list([item({ id: 1, title: 'A' }), item({ id: 2, title: 'B', status: 'Approved' }), item({ id: 4, title: 'D', status: 'Rejected' })]);
    const result = await sendForApproval([1, 2, 3, 4], ME, fake);
    expect(fake.submitted).toEqual([1, 4]);
    expect(result).toEqual({ sent: ['A', 'D'], skipped: ['B: already approved'], failed: ['Item 3: HTTP 404'] });
  });

  it('reports an update failure against the item title', async () => {
    const result = await sendForApproval([1], ME, list([item({})], new Error('denied')));
    expect(result).toEqual({ sent: [], skipped: [], failed: ['Laptop: denied'] });
  });
});

describe('summarize', () => {
  it('only includes sections that have entries', () => {
    expect(summarize({ sent: ['A', 'B'], skipped: [], failed: ['C: denied'] })).toBe('Sent for approval:\nA\nB\n\nFailed:\nC: denied');
  });
});
