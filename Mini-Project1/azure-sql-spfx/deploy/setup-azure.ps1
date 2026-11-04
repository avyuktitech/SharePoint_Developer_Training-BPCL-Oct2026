<#
.SYNOPSIS
Creates the Azure SQL database, the Function App and the API's Entra ID app registration, and connects them securely.

.EXAMPLE
./deploy/setup-azure.ps1 -ResourceGroup rg-spfx-sql -SqlServer contoso-spfx-sql -FunctionApp contoso-spfx-api -FunctionStorage contosospfxapi01 -SharePointOrigin https://contoso.sharepoint.com

.NOTES
This creates Azure resources that may cost money. The database uses the Azure SQL free offer where your
subscription still has it available. It needs the Azure CLI, "az login", the Owner role on the subscription
and permission to create app registrations.
#>
param(
  [Parameter(Mandatory)][string]$ResourceGroup,
  [Parameter(Mandatory)][string]$SqlServer,
  [Parameter(Mandatory)][string]$FunctionApp,
  [Parameter(Mandatory)][ValidatePattern('^[a-z0-9]{3,24}$')][string]$FunctionStorage,
  [Parameter(Mandatory)][ValidatePattern('^https://[a-zA-Z0-9-]+\.sharepoint\.com$')][string]$SharePointOrigin,
  [string]$Location = 'centralindia',
  [string]$Database = 'SampleDb',
  # Must match "resource" under webApiPermissionRequests in config/package-solution.json.
  [string]$ApiDisplayName = 'SPFx Azure SQL Sample API'
)

$ErrorActionPreference = 'Stop'

function Invoke-Az {
  $output = & az @args
  if ($LASTEXITCODE -ne 0) { throw "This command failed: az $($args -join ' ')" }
  return $output
}

$tenantId = Invoke-Az account show --query tenantId --output tsv
$myId = Invoke-Az ad signed-in-user show --query id --output tsv
$myName = Invoke-Az ad signed-in-user show --query userPrincipalName --output tsv

Write-Host 'Creating the resource group, SQL server and database...'
Invoke-Az group create --name $ResourceGroup --location $Location --output none
# Entra-only sign-in: this server has no SQL passwords. You become its admin.
Invoke-Az sql server create --name $SqlServer --resource-group $ResourceGroup --location $Location `
  --enable-ad-only-auth --external-admin-principal-type User --external-admin-name $myName --external-admin-sid $myId --output none
# Lets Azure services, including the Function App, reach the server. They still have to sign in.
Invoke-Az sql server firewall-rule create --server $SqlServer --resource-group $ResourceGroup --name AllowAzureServices `
  --start-ip-address 0.0.0.0 --end-ip-address 0.0.0.0 --output none
Invoke-Az sql db create --server $SqlServer --resource-group $ResourceGroup --name $Database --edition GeneralPurpose `
  --compute-model Serverless --family Gen5 --capacity 2 --use-free-limit --free-limit-exhaustion-behavior AutoPause --output none

Write-Host 'Creating the Function App...'
Invoke-Az storage account create --name $FunctionStorage --resource-group $ResourceGroup --location $Location --sku Standard_LRS --output none
Invoke-Az functionapp create --name $FunctionApp --resource-group $ResourceGroup --storage-account $FunctionStorage `
  --flexconsumption-location $Location --runtime node --runtime-version 22 --output none
Invoke-Az functionapp identity assign --name $FunctionApp --resource-group $ResourceGroup --output none
Invoke-Az functionapp config appsettings set --name $FunctionApp --resource-group $ResourceGroup `
  --settings "SQL_SERVER=$SqlServer.database.windows.net" "SQL_DATABASE=$Database" --output none
Invoke-Az functionapp cors add --name $FunctionApp --resource-group $ResourceGroup --allowed-origins $SharePointOrigin --output none

Write-Host 'Registering the API in Microsoft Entra ID...'
$appId = Invoke-Az ad app create --display-name $ApiDisplayName --sign-in-audience AzureADMyOrg --query appId --output tsv
$appObjectId = Invoke-Az ad app show --id $appId --query id --output tsv
Invoke-Az ad app update --id $appId --identifier-uris "api://$appId"
$scope = @{
  api = @{
    oauth2PermissionScopes = @(@{
      id = [guid]::NewGuid().ToString()
      value = 'user_impersonation'
      type = 'User'
      isEnabled = $true
      adminConsentDisplayName = 'Read sample data'
      adminConsentDescription = 'Allows the app to read the sample SQL data as the signed-in user.'
      userConsentDisplayName = 'Read sample data'
      userConsentDescription = 'Allows the app to read the sample SQL data for you.'
    })
  }
} | ConvertTo-Json -Depth 5
$scopeFile = New-TemporaryFile
try {
  # Written without a byte order mark, which az rest can't read.
  [System.IO.File]::WriteAllText($scopeFile.FullName, $scope, (New-Object System.Text.UTF8Encoding $false))
  Invoke-Az rest --method PATCH --uri "https://graph.microsoft.com/v1.0/applications/$appObjectId" `
    --headers 'Content-Type=application/json' --body "@$($scopeFile.FullName)" --output none
} finally {
  Remove-Item $scopeFile.FullName -Force
}
Invoke-Az ad sp create --id $appId --output none

Write-Host 'Requiring a valid Entra ID token on every API call...'
Invoke-Az webapp auth microsoft update --name $FunctionApp --resource-group $ResourceGroup --client-id $appId `
  --issuer "https://sts.windows.net/$tenantId/" --allowed-audiences "api://$appId" $appId --yes --output none
Invoke-Az webapp auth update --name $FunctionApp --resource-group $ResourceGroup --enabled true --action Return401 --output none

Write-Host ''
Write-Host 'Azure resources are ready. Next steps (see the README):'
Write-Host "  1. In the Azure portal, open database '$Database' > Query editor and run database/seed.sql."
Write-Host "  2. Run database/grant-api-access.sql there, using '$FunctionApp' as the name."
Write-Host "  3. From the api folder, run: npm install; func azure functionapp publish $FunctionApp"
Write-Host ''
Write-Host 'Web part settings:'
Write-Host "  API address:                 https://$FunctionApp.azurewebsites.net/api"
Write-Host "  API application (client) ID: $appId"
