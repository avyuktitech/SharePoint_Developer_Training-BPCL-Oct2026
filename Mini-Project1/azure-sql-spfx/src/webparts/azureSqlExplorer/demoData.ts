import { CellValue, IFileInfo, ISqlSource, ITableInfo, ITablePage } from './sqlApi';

const PAGE_SIZE = 10;

interface IDemoTable {
  description: string;
  columns: string[];
  rows: Record<string, CellValue>[];
}

function toRows(columns: string[], values: CellValue[][]): Record<string, CellValue>[] {
  return values.map(row => {
    const record: Record<string, CellValue> = {};
    columns.forEach((column, i) => { record[column] = row[i]; });
    return record;
  });
}

const PRODUCT_COLUMNS = ['ProductId', 'Name', 'Category', 'UnitPrice', 'InStock'];
const CUSTOMER_COLUMNS = ['CustomerId', 'Company', 'ContactName', 'City', 'Country'];
const ORDER_COLUMNS = ['OrderId', 'CustomerId', 'ProductId', 'Quantity', 'OrderDate', 'Status'];

// The same rows as database/schema-and-tables.sql, so the web part shows the real experience before Azure is set up.
export const DEMO_TABLES: Record<string, IDemoTable> = {
  Products: {
    description: 'Items in the product catalog',
    columns: PRODUCT_COLUMNS,
    rows: toRows(PRODUCT_COLUMNS, [
      [101, 'Trail backpack, 30 L', 'Outdoor', 79, true],
      [102, 'Insulated bottle', 'Outdoor', 24.5, true],
      [103, 'Wireless headset', 'Electronics', 129.99, false],
      [104, 'Standing desk', 'Office', 349, true],
      [105, 'Ergonomic chair', 'Office', 219, true],
      [106, 'USB-C dock', 'Electronics', 89, true],
      [107, 'Desk lamp', 'Office', 39, true],
      [108, 'Camping stove', 'Outdoor', 64, false],
      [109, 'Noise-cancelling earbuds', 'Electronics', 149, true],
      [110, 'Monitor arm', 'Office', 74, true],
      [111, 'Hiking poles', 'Outdoor', 45, true],
      [112, 'Webcam 4K', 'Electronics', 119, true]
    ])
  },
  Customers: {
    description: 'Customer companies and contacts',
    columns: CUSTOMER_COLUMNS,
    rows: toRows(CUSTOMER_COLUMNS, [
      [1, 'Fabrikam Traders', 'Asha Menon', 'Mumbai', 'India'],
      [2, 'Northwind Retail', 'Daniel Reyes', 'Austin', 'United States'],
      [3, 'Tailspin Outdoors', 'Priya Nair', 'Bengaluru', 'India'],
      [4, 'Wingtip Supplies', 'Lena Fischer', 'Berlin', 'Germany'],
      [5, 'Adventure Works', 'Omar Haddad', 'Dubai', 'United Arab Emirates'],
      [6, 'Proseware Office', 'Grace Lee', 'Singapore', 'Singapore']
    ])
  },
  Orders: {
    description: 'Orders placed by customers',
    columns: ORDER_COLUMNS,
    rows: toRows(ORDER_COLUMNS, [
      [5001, 1, 104, 4, '2026-10-02T00:00:00.000Z', 'Delivered'],
      [5002, 2, 103, 10, '2026-10-05T00:00:00.000Z', 'Delivered'],
      [5003, 3, 101, 25, '2026-10-09T00:00:00.000Z', 'Shipped'],
      [5004, 4, 105, 6, '2026-10-12T00:00:00.000Z', 'Shipped'],
      [5005, 5, 111, 30, '2026-10-15T00:00:00.000Z', 'Processing'],
      [5006, 6, 106, 15, '2026-10-19T00:00:00.000Z', 'Processing'],
      [5007, 1, 107, 12, '2026-10-22T00:00:00.000Z', 'Delivered'],
      [5008, 2, 109, 8, '2026-10-26T00:00:00.000Z', 'Shipped'],
      [5009, 3, 108, 5, '2026-10-29T00:00:00.000Z', 'Cancelled'],
      [5010, 4, 110, 9, '2026-11-01T00:00:00.000Z', 'Processing'],
      [5011, 5, 102, 40, '2026-11-02T00:00:00.000Z', 'Processing'],
      [5012, 6, 112, 7, '2026-11-03T00:00:00.000Z', 'Processing']
    ])
  }
};

const BANNER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 320" width="640" height="320">
  <defs>
    <linearGradient id="dusk" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5b4bc4"/>
      <stop offset="1" stop-color="#e58fb1"/>
    </linearGradient>
  </defs>
  <rect width="640" height="320" fill="url(#dusk)"/>
  <path d="M0 250 L150 130 L260 215 L370 95 L640 270 L640 320 L0 320 Z" fill="#2c2466"/>
  <circle cx="530" cy="75" r="36" fill="#fff4ce"/>
  <text x="40" y="70" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="38" font-weight="600">Contoso</text>
  <text x="40" y="102" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="18">Sample image from Azure SQL</text>
</svg>
`;

const BADGE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">
  <circle cx="160" cy="160" r="150" fill="#107c41"/>
  <circle cx="160" cy="160" r="122" fill="none" stroke="#ffffff" stroke-width="6" stroke-dasharray="6 12"/>
  <text x="160" y="150" fill="#ffffff" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="30" font-weight="600">BEST</text>
  <text x="160" y="192" fill="#ffffff" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="30" font-weight="600">SELLER</text>
</svg>
`;

// The same files as database/sample-files. In Azure they are stored in the VARBINARY(MAX) column of dbo.Documents.
export const DEMO_FILES: { name: string; contentType: string; description: string; content: string }[] = [
  {
    name: 'contoso-banner.svg', contentType: 'image/svg+xml', description: 'Sample image stored in the database', content: BANNER
  },
  {
    name: 'product-badge.svg', contentType: 'image/svg+xml', description: 'Second sample image', content: BADGE
  },
  {
    name: 'regional-sales.csv', contentType: 'text/csv', description: 'CSV previewed as a table',
    content: `Region,Quarter,Orders,Revenue
"West, India",Q3,412,"1,250,000"
"South, India",Q3,388,"1,104,500"
North America,Q3,271,"980,000"
Europe,Q3,195,"742,300"
`
  },
  {
    name: 'release-notes.md', contentType: 'text/markdown', description: 'Markdown stored as binary data',
    content: `# Release notes

## Version 1.2
- Added product images to the catalog
- Fixed the price rounding in the sales export

## Version 1.1
- Added the regional sales report
`
  },
  {
    name: 'settings.json', contentType: 'application/json', description: 'JSON configuration file',
    content: `{
  "region": "Central India",
  "currency": "INR",
  "features": {
    "catalog": true,
    "exports": true
  }
}
`
  },
  {
    name: 'welcome.txt', contentType: 'text/plain', description: 'A short introduction to this sample',
    content: `Welcome to the Contoso sample database!

These files are not on a file share. Each one is a row in the dbo.Documents
table, with its bytes in a VARBINARY(MAX) column. The Azure Functions API reads
a row and returns the bytes, and this web part previews them.
`
  }
];

export class DemoSqlSource implements ISqlSource {
  public readonly isDemo = true;
  public readonly label = 'Built-in sample data';

  public async listTables(): Promise<ITableInfo[]> {
    return Object.keys(DEMO_TABLES).map(name => ({ name, description: DEMO_TABLES[name].description, rowCount: DEMO_TABLES[name].rows.length }));
  }

  public async getRows(table: string, page: number): Promise<ITablePage> {
    const { columns, rows } = DEMO_TABLES[table];
    const start = (page - 1) * PAGE_SIZE;
    return { name: table, columns, rows: rows.slice(start, start + PAGE_SIZE), page, pageSize: PAGE_SIZE, totalRows: rows.length };
  }

  public async listFiles(): Promise<IFileInfo[]> {
    return DEMO_FILES.map((file, i) => ({
      id: i + 1,
      name: file.name,
      contentType: file.contentType,
      description: file.description,
      size: new Blob([file.content]).size,
      updatedAt: '2026-11-02T09:30:00.000Z'
    }));
  }

  public async readFile(file: IFileInfo): Promise<Blob> {
    return new Blob([DEMO_FILES[file.id - 1].content], { type: file.contentType });
  }
}
