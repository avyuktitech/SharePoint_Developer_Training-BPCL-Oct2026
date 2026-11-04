<#
.SYNOPSIS
Creates a storage account and container, allows your SharePoint site to call it, and uploads the sample files.

.EXAMPLE
./deploy/setup-azure.ps1 -ResourceGroup rg-spfx-blob -StorageAccount contosofiles01 -SharePointOrigin https://contoso.sharepoint.com -ReaderGroupId <entra-group-object-id>

.NOTES
This creates Azure resources that may cost a small amount. It needs the Azure CLI, "az login", and the
Owner or User Access Administrator role, because it assigns roles.
#>
param(
  [Parameter(Mandatory)][string]$ResourceGroup,
  [Parameter(Mandatory)][ValidatePattern('^[a-z0-9]{3,24}$')][string]$StorageAccount,
  [Parameter(Mandatory)][ValidatePattern('^https://[a-zA-Z0-9-]+\.sharepoint\.com$')][string]$SharePointOrigin,
  [string]$Location = 'centralindia',
  [string]$Container = 'samples',
  # Optional: an Entra group whose members can read the files. You always get access yourself.
  [string]$ReaderGroupId = ''
)

$ErrorActionPreference = 'Stop'

function Invoke-Az {
  $output = & az @args
  if ($LASTEXITCODE -ne 0) { throw "This command failed: az $($args -join ' ')" }
  return $output
}

Write-Host 'Creating the resource group and storage account...'
Invoke-Az group create --name $ResourceGroup --location $Location --output none
Invoke-Az storage account create --name $StorageAccount --resource-group $ResourceGroup --location $Location `
  --sku Standard_LRS --kind StorageV2 --min-tls-version TLS1_2 --allow-blob-public-access false --output none
$scope = Invoke-Az storage account show --name $StorageAccount --resource-group $ResourceGroup --query id --output tsv

Write-Host 'Assigning roles...'
$me = Invoke-Az ad signed-in-user show --query id --output tsv
Invoke-Az role assignment create --assignee-object-id $me --assignee-principal-type User --role 'Storage Blob Data Contributor' --scope $scope --output none
if ($ReaderGroupId) {
  Invoke-Az role assignment create --assignee-object-id $ReaderGroupId --assignee-principal-type Group --role 'Storage Blob Data Reader' --scope $scope --output none
}

Write-Host 'Allowing your SharePoint site to call the storage account (CORS)...'
Invoke-Az storage account blob-service-properties cors-rule add --account-name $StorageAccount --resource-group $ResourceGroup `
  --allowed-origins $SharePointOrigin --allowed-methods GET HEAD OPTIONS --allowed-headers '*' --exposed-headers '*' --max-age 3600 --output none

# New roles can take a few minutes to apply, so the first upload may need several tries.
Write-Host 'Uploading the sample files...'
$source = Join-Path $PSScriptRoot '..\sample-data'
$uploaded = $false
$previousPreference = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
for ($try = 1; $try -le 10 -and -not $uploaded; $try++) {
  az storage container create --name $Container --account-name $StorageAccount --auth-mode login --output none 2>$null
  if ($LASTEXITCODE -eq 0) {
    az storage blob upload-batch --destination $Container --source $source --account-name $StorageAccount --auth-mode login --overwrite --output none 2>$null
    $uploaded = $LASTEXITCODE -eq 0
  }
  if (-not $uploaded) {
    Write-Host "  Waiting for the role to apply (try $try of 10)..."
    Start-Sleep -Seconds 30
  }
}
$ErrorActionPreference = $previousPreference
if (-not $uploaded) { throw 'The upload did not succeed after 5 minutes. Wait a few minutes and run this script again.' }

Write-Host ''
Write-Host 'Done. Web part settings:'
Write-Host "  Storage account name: $StorageAccount"
Write-Host "  Container name:       $Container"
