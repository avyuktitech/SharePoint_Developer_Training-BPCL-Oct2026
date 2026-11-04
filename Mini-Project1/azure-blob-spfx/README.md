# Azure Blob Explorer (SPFx + Azure Blob Storage)

A SharePoint web part that browses an Azure Blob Storage container. It lists the files, shows images, opens text and JSON files, displays CSV files as tables, and downloads anything.

It starts with built-in sample data, so you can see it working before setting up Azure.

## How it works

```text
SharePoint page  ->  Microsoft Entra ID token for the signed-in user  ->  Azure Blob Storage REST API
```

The browser calls Azure Storage directly as the signed-in user. There are no storage keys or SAS tokens in the code or the page, and Azure decides what each person can read through their role.

| File | Purpose |
| --- | --- |
| `src/webparts/azureBlobExplorer/AzureBlobExplorer.tsx` | The file list and preview UI |
| `src/webparts/azureBlobExplorer/AzureBlobSource.ts` | Calls Azure Storage using `AadHttpClient` |
| `src/webparts/azureBlobExplorer/blobRest.ts` | URLs, list parsing, name checks and error messages |
| `src/webparts/azureBlobExplorer/demoData.ts` | The built-in sample data |
| `sample-data/` | The sample files to upload to your container |
| `deploy/setup-azure.ps1` | Creates the Azure resources and uploads the sample files |

## Try it with sample data

Requires Node.js 22.14.x or later 22.x.

```powershell
npm install
npm start
```

Open `https://<tenant>.sharepoint.com/sites/<site>/_layouts/15/workbench.aspx` and add the **Azure Blob Explorer** web part. No Azure setup is needed for this.

## Connect your storage account

You need an Azure subscription, the [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) signed in with `az login`, and the SharePoint Administrator role to approve the permission.

**1. Create the Azure resources.** The script creates a storage account and a private container, gives you access, adds the CORS rule for SharePoint, and uploads `sample-data/`.

```powershell
./deploy/setup-azure.ps1 -ResourceGroup rg-spfx-blob -StorageAccount <unique-lowercase-name> -SharePointOrigin https://<tenant>.sharepoint.com
```

**2. Give other people access.** Each person needs the **Storage Blob Data Reader** role on the storage account. The easiest way is an Entra group: pass `-ReaderGroupId <group-object-id>` to the script, or assign the role under **Access control (IAM)** in the Azure portal.

**3. Deploy the web part.**

1. `npm run build` creates `sharepoint/solution/azureblob.sppkg`.
2. Upload it to the tenant App Catalog and enable it.
3. Go to **SharePoint admin center > Advanced > API access** and approve the **Azure Storage** `user_impersonation` request.

**4. Add it to a page.** Edit the web part and enter your storage account and container names.

## Troubleshooting

| What you see | What to check |
| --- | --- |
| "Azure Storage refused access (403)" | The user needs **Storage Blob Data Reader**. Owner or Contributor on the account isn't enough to read blobs. New roles can take a few minutes to apply. |
| "Could not reach Azure Storage" | The API access request may not be approved, or the storage account's CORS rule may not match your exact `https://<tenant>.sharepoint.com` address. The browser console shows which one. |
| "The container was not found (404)" | Check the account and container names in the web part settings. |

## Limitations

This is a training sample:

- **It's read-only.** It doesn't upload or delete files.
- **The permission covers all of Azure Storage.** Once approved, any SPFx solution in the tenant can request a storage token for a user. Each user can still only reach what their Azure roles allow, so keep those roles narrow.
- **Previews stop at 5 MB.** Larger files can still be downloaded. CSV previews show the first 200 rows.
- **Lists stop at about 1,000 files,** and virtual folders appear as part of each file's name.
