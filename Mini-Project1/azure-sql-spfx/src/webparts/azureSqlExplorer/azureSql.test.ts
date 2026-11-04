import { DEMO_TABLES, DemoSqlSource } from './demoData';
import { explainStatus, fileContentUrl, formatCell, normalizeApiUrl, pageCount, rowsUrl } from './sqlApi';
import { kindOf, parseCsv } from './fileTypes';

describe('normalizeApiUrl', () => {
  it('removes trailing slashes', () => {
    expect(normalizeApiUrl(' https://fn.azurewebsites.net/api/ ')).toBe('https://fn.azurewebsites.net/api');
  });
  it('rejects anything other than a plain HTTPS address', () => {
    expect(normalizeApiUrl('http://fn.azurewebsites.net/api')).toBe('');
    expect(normalizeApiUrl('not a url')).toBe('');
    expect(normalizeApiUrl('https://fn.azurewebsites.net/api?x=1')).toBe('');
  });
});

describe('API URLs', () => {
  it('encodes the table name and includes the page', () => {
    expect(rowsUrl('https://fn/api', 'My Table', 2)).toBe('https://fn/api/tables/My%20Table?page=2');
  });
  it('builds the file content address', () => {
    expect(fileContentUrl('https://fn/api', 7)).toBe('https://fn/api/files/7/content');
  });
});

describe('formatCell', () => {
  it('formats nulls, booleans and numbers', () => {
    expect(formatCell(null)).toBe('-');
    expect(formatCell(true)).toBe('Yes');
    expect(formatCell(false)).toBe('No');
    expect(formatCell(79.5)).toBe('79.5');
  });
  it('shows SQL dates without the time', () => {
    expect(formatCell('2026-10-02T00:00:00.000Z')).toBe('2026-10-02');
  });
  it('leaves other text alone', () => {
    expect(formatCell('2026-10-02T09:30:00.000Z')).toBe('2026-10-02T09:30:00.000Z');
    expect(formatCell('Shipped')).toBe('Shipped');
  });
});

describe('pageCount', () => {
  it('rounds up and always has at least one page', () => {
    expect(pageCount(0, 10)).toBe(1);
    expect(pageCount(10, 10)).toBe(1);
    expect(pageCount(11, 10)).toBe(2);
  });
});

describe('explainStatus', () => {
  it('describes the likely fix', () => {
    expect(explainStatus(401)).toContain('App Service Authentication');
    expect(explainStatus(404)).toContain('/api');
    expect(explainStatus(500)).toContain('logs');
  });
});

describe('DemoSqlSource', () => {
  const source = new DemoSqlSource();

  it('reports the real row count of each table', async () => {
    const tables = await source.listTables();
    tables.forEach(t => expect(t.rowCount).toBe(DEMO_TABLES[t.name].rows.length));
    expect(tables.map(t => t.name)).toEqual(['Products', 'Customers', 'Orders']);
  });
  it('pages through rows', async () => {
    const first = await source.getRows('Products', 1);
    const second = await source.getRows('Products', 2);
    expect(first.rows).toHaveLength(10);
    expect(second.rows).toHaveLength(2);
    expect(second.rows[0].ProductId).toBe(111);
    expect(first.totalRows).toBe(12);
  });
  it('has every column in every row', () => {
    Object.keys(DEMO_TABLES).forEach(name => {
      DEMO_TABLES[name].rows.forEach(row => expect(Object.keys(row)).toEqual(DEMO_TABLES[name].columns));
    });
  });
  it('includes text, CSV and image files', async () => {
    const kinds = (await source.listFiles()).map(f => kindOf(f.name));
    expect(kinds).toEqual(expect.arrayContaining(['text', 'csv', 'image']));
  });
});

describe('parseCsv', () => {
  it('handles quoted commas', () => {
    expect(parseCsv('a,b\n"x, y",2\n')).toEqual([['a', 'b'], ['x, y', '2']]);
  });
});
