# Export local Strapi SQLite data for production PostgreSQL import.
# Usage:
#   .\export-local-data.ps1                  # content only (recommended)
#   .\export-local-data.ps1 -IncludeFiles    # content + uploads in one archive
param(
    [switch]$IncludeFiles,
    [string]$OutputDir = "D:\dbsource\data\exports"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CmsDir = Resolve-Path (Join-Path $ScriptDir "..\..\cms")
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BaseName = "dbsource-$Timestamp"
$ExportPath = Join-Path $OutputDir $BaseName

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

Write-Host "[export] CMS directory: $CmsDir"
Write-Host "[export] Output base:    $ExportPath (.tar.gz)"

$envFile = Join-Path $CmsDir ".env"
if (-not (Test-Path $envFile)) {
    Write-Error "[export] Missing cms/.env — ensure DATABASE_FILENAME points to data/cms/data.db"
}

$dbLine = Select-String -Path $envFile -Pattern "^DATABASE_FILENAME=" | Select-Object -First 1
if ($dbLine) {
    Write-Host "[export] $($dbLine.Line)"
}

Push-Location $CmsDir
try {
    $strapiProc = Get-NetTCPConnection -LocalPort 1337 -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique
    if ($strapiProc) {
        Write-Host "[export] Warning: port 1337 is in use (Strapi may be running)."
        Write-Host "[export] For a consistent snapshot, run: D:\dbsource\stop.ps1"
        Start-Sleep -Seconds 3
    }

    $args = @("strapi", "export", "--no-encrypt", "-f", $ExportPath)
    if (-not $IncludeFiles) {
        $args += @("--only", "content")
        Write-Host "[export] Mode: content only (uploads via scp + import-uploads.sh)"
    } else {
        Write-Host "[export] Mode: content + files (large archive, may take 10+ min)"
    }

    Write-Host "[export] Running: npx $($args -join ' ')"
    & npx @args
    if ($LASTEXITCODE -ne 0) { throw "strapi export exited with code $LASTEXITCODE" }

    $artifact = Get-ChildItem -Path $OutputDir -Filter "$BaseName.tar.gz" | Select-Object -First 1
    if (-not $artifact) {
        throw "Export file not found: $BaseName.tar.gz"
    }

    $sizeMb = [math]::Round($artifact.Length / 1MB, 2)
    Write-Host ""
    Write-Host "[export] Done: $($artifact.FullName) ($sizeMb MB)"
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "  1. scp $($artifact.FullName) root@ECS_IP:/root/"
    if (-not $IncludeFiles) {
        Write-Host "  2. scp -r D:\dbsource\data\cms\uploads root@ECS_IP:/root/uploads"
        Write-Host "  3. On ECS: ./scripts/import-strapi-data.sh /root/$($artifact.Name)"
        Write-Host "  4. On ECS: ./scripts/import-uploads.sh /root/uploads"
    } else {
        Write-Host "  2. On ECS: ./scripts/import-strapi-data.sh /root/$($artifact.Name)"
    }
}
finally {
    Pop-Location
}
