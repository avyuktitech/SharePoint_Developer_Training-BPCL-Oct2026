import { nextDay, overlaps, workingDays } from './leaveDates';

describe('workingDays', () => {
  it('counts a single weekday as one day', () => {
    expect(workingDays('2026-11-04', '2026-11-04')).toBe(1); // Wednesday
  });
  it('skips the weekend', () => {
    expect(workingDays('2026-11-06', '2026-11-09')).toBe(2); // Friday to Monday
  });
  it('returns zero for a weekend-only request', () => {
    expect(workingDays('2026-11-07', '2026-11-08')).toBe(0);
  });
  it('returns zero when the end is before the start', () => {
    expect(workingDays('2026-11-09', '2026-11-06')).toBe(0);
  });
});

describe('nextDay', () => {
  it('rolls over month and year ends', () => {
    expect(nextDay('2026-11-30')).toBe('2026-12-01');
    expect(nextDay('2026-12-31')).toBe('2027-01-01');
  });
  it('handles leap years', () => {
    expect(nextDay('2028-02-28')).toBe('2028-02-29');
  });
});

describe('overlaps', () => {
  it('detects shared days, including a shared boundary', () => {
    expect(overlaps('2026-11-02', '2026-11-06', '2026-11-05', '2026-11-10')).toBe(true);
    expect(overlaps('2026-11-02', '2026-11-06', '2026-11-06', '2026-11-06')).toBe(true);
  });
  it('ignores adjacent ranges', () => {
    expect(overlaps('2026-11-02', '2026-11-06', '2026-11-07', '2026-11-10')).toBe(false);
  });
});
