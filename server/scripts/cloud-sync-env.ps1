# Orbix Platform: AWS SSM Sync Utility
# Reads .env.prod and uploads all secrets to AWS Parameter Store

$EnvFile = ".env.prod"
$Prefix = "/orbix/prod"

if (-not (Test-Path $EnvFile)) {
    Write-Error "Error: $EnvFile not found!"
    exit 1
}

Write-Host "Starting AWS SSM Secret Sync..." -ForegroundColor Cyan

$Lines = Get-Content $EnvFile

foreach ($Line in $Lines) {
    # Skip comments and blank lines
    if ($Line -match "^\s*#" -or $Line -match "^\s*$") {
        continue
    }

    # Split on first = only
    $EqPos = $Line.IndexOf("=")
    if ($EqPos -lt 0) { continue }

    $Key   = $Line.Substring(0, $EqPos).Trim()
    $Value = $Line.Substring($EqPos + 1).Trim()

    # Strip surrounding quotes
    $Value = $Value -replace '^"(.*)"$', '$1'
    $Value = $Value -replace "^'(.*)'$", '$1'

    if (-not $Key -or -not $Value) { continue }

    # Convert KEY_NAME to /orbix/prod/key-name
    $ParamName = "$Prefix/$($Key.ToLower().Replace('_','-'))"

    Write-Host "Uploading: $ParamName" -ForegroundColor Yellow

    aws ssm put-parameter `
        --name $ParamName `
        --value $Value `
        --type "SecureString" `
        --overwrite | Out-Null

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK" -ForegroundColor Green
    } else {
        Write-Host "  FAILED - check aws permissions" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Sync complete! Secrets are now in AWS SSM." -ForegroundColor Green
