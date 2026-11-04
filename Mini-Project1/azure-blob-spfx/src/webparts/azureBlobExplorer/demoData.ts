import { IBlobItem, IBlobSource } from './blobRest';

// The same files as the sample-data folder, so the web part shows the real experience before Azure is set up.
export const DEMO_FILES: Record<string, string> = {
  'welcome.txt': `Welcome to the Contoso sample container!

Everything you see in this web part is a file in an Azure Blob Storage container.
Pick a file on the left to preview it. Text, CSV and images open right here,
and every file can be downloaded.
`,
  'docs/release-notes.md': `# Release notes

## Version 1.2
- Added product images to the catalog
- Fixed the price rounding in the CSV export

## Version 1.1
- Added the regional settings file
`,
  'data/products.csv': `Id,Product,Category,Unit price,In stock
101,"Trail backpack, 30 L",Outdoor,79.00,Yes
102,Insulated bottle,Outdoor,24.50,Yes
103,Wireless headset,Electronics,129.99,No
104,Standing desk,Office,349.00,Yes
105,Ergonomic chair,Office,219.00,Yes
`,
  'data/settings.json': `{
  "region": "Central India",
  "currency": "INR",
  "features": {
    "catalog": true,
    "exports": true
  }
}
`,
  'images/contoso-banner.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 320" width="640" height="320">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0f6cbd"/>
      <stop offset="1" stop-color="#47c7e8"/>
    </linearGradient>
  </defs>
  <rect width="640" height="320" fill="url(#sky)"/>
  <path d="M0 250 L150 130 L260 215 L370 95 L640 270 L640 320 L0 320 Z" fill="#0b3f6f"/>
  <circle cx="530" cy="75" r="36" fill="#fff4ce"/>
  <text x="40" y="70" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="38" font-weight="600">Contoso</text>
  <text x="40" y="102" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="18">Sample image from blob storage</text>
</svg>
`,
  'images/product-badge.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">
  <circle cx="160" cy="160" r="150" fill="#107c41"/>
  <circle cx="160" cy="160" r="122" fill="none" stroke="#ffffff" stroke-width="6" stroke-dasharray="6 12"/>
  <text x="160" y="150" fill="#ffffff" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="30" font-weight="600">BEST</text>
  <text x="160" y="192" fill="#ffffff" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="30" font-weight="600">SELLER</text>
</svg>
`,
  'archive/catalog-2025.bin': 'This placeholder shows how a file with no preview is handled.'
};

const MODIFIED = 'Mon, 02 Nov 2026 09:30:00 GMT';

export class DemoBlobSource implements IBlobSource {
  public readonly isDemo = true;
  public readonly label = 'Built-in sample data';

  public async list(): Promise<IBlobItem[]> {
    return Object.keys(DEMO_FILES).map(name => ({ name, size: new Blob([DEMO_FILES[name]]).size, lastModified: MODIFIED }));
  }

  public async read(item: IBlobItem): Promise<Blob> {
    return new Blob([DEMO_FILES[item.name]]);
  }
}
