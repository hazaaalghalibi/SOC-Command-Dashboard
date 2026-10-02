# Starts the SOC dashboard. If npm is missing (common when only Cursor's Node is on PATH),
# downloads a portable Node.js LTS into .tools\ and uses it for this project only.
$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot
Set-Location $ProjectRoot

$PortableVersion = "v20.18.1"
$PortableDirName = "node-$PortableVersion-win-x64"
$PortableHome = Join-Path $ProjectRoot ".tools\$PortableDirName"
$PortableZipUrl = "https://nodejs.org/dist/$PortableVersion/$PortableDirName.zip"

function Test-UsableNodeHome([string]$Dir) {
  $npm = Join-Path $Dir "npm.cmd"
  $node = Join-Path $Dir "node.exe"
  return (Test-Path $npm) -and (Test-Path $node)
}

function Get-BundledNodeHome {
  $candidates = New-Object System.Collections.Generic.List[string]
  if ($env:ProgramFiles) { $candidates.Add((Join-Path $env:ProgramFiles "nodejs")) }
  $pf86 = ${env:ProgramFiles(x86)}
  if ($pf86) { $candidates.Add((Join-Path $pf86 "nodejs")) }
  if ($env:LOCALAPPDATA) { $candidates.Add((Join-Path $env:LOCALAPPDATA "Programs\nodejs")) }

  foreach ($d in $candidates) {
    if ($d -and (Test-UsableNodeHome $d)) { return $d }
  }
  return $null
}

function Download-Zip([string]$Uri, [string]$OutFile) {
  $curl = Get-Command curl.exe -ErrorAction SilentlyContinue
  if ($curl) {
    Write-Host "Downloading with curl.exe..." -ForegroundColor Gray
    & curl.exe -fsSL --retry 3 --connect-timeout 30 --max-time 600 -o $OutFile $Uri
    if ($LASTEXITCODE -ne 0) { throw "curl.exe failed (exit $LASTEXITCODE)" }
    return
  }

  Write-Host "Downloading with Invoke-WebRequest..." -ForegroundColor Gray
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  Invoke-WebRequest -Uri $Uri -OutFile $OutFile -UseBasicParsing
}

function Ensure-PortableNode {
  if (Test-UsableNodeHome $PortableHome) { return $PortableHome }

  Write-Host ""
  Write-Host "No full Node.js install found on this PC (npm missing)." -ForegroundColor Yellow
  Write-Host "Downloading portable Node.js $PortableVersion (~30 MB) into:" -ForegroundColor Cyan
  Write-Host "  $PortableHome" -ForegroundColor Gray
  Write-Host ""

  $toolsDir = Join-Path $ProjectRoot ".tools"
  New-Item -ItemType Directory -Force -Path $toolsDir | Out-Null

  # Use a unique filename so this never collides with an in-progress download in %TEMP%
  $zipPath = Join-Path $env:TEMP ("soc-dashboard-node-" + [Guid]::NewGuid().ToString("n") + ".zip")
  Download-Zip -Uri $PortableZipUrl -OutFile $zipPath

  if (Test-Path $PortableHome) {
    Remove-Item -Recurse -Force $PortableHome
  }

  Expand-Archive -Path $zipPath -DestinationPath $toolsDir -Force
  Remove-Item -Force $zipPath -ErrorAction SilentlyContinue

  if (-not (Test-UsableNodeHome $PortableHome)) {
    throw "Portable Node install failed. Expected at: $PortableHome"
  }

  return $PortableHome
}

$nodeHome = Get-BundledNodeHome
if (-not $nodeHome) {
  $nodeHome = Ensure-PortableNode
}

$env:Path = "$nodeHome;$env:Path"

Write-Host "Using Node:" -ForegroundColor Green
& (Join-Path $nodeHome "node.exe") -v
& (Join-Path $nodeHome "npm.cmd") -v
Write-Host ""

# Always run install: if node_modules already exists from an older clone, new deps (e.g. react-router-dom) would otherwise stay missing.
Write-Host "Syncing frontend npm dependencies..." -ForegroundColor Cyan
& (Join-Path $nodeHome "npm.cmd") install --no-fund
if ($LASTEXITCODE -ne 0) { throw "npm install failed in project root." }
Write-Host ""

if (-not (Test-Path (Join-Path $ProjectRoot "server\node_modules"))) {
  Write-Host "Installing API server dependencies..." -ForegroundColor Cyan
  $serverDir = Join-Path $ProjectRoot "server"
  & (Join-Path $nodeHome "npm.cmd") @("install", "--prefix", $serverDir)
  Write-Host ""
}

$dbFile = Join-Path $ProjectRoot "server\prisma\dev.db"
$serverPrefix = Join-Path $ProjectRoot "server"
if (-not (Test-Path $dbFile)) {
  Write-Host "Creating SQLite database and seed data..." -ForegroundColor Cyan
  & (Join-Path $nodeHome "npm.cmd") @("run", "db:setup", "--prefix", $serverPrefix)
  Write-Host ""
} else {
  # Existing DB: apply schema changes from Prisma (new columns/tables after git pull) without re-seeding.
  Write-Host "Syncing database schema with Prisma..." -ForegroundColor Gray
  & (Join-Path $nodeHome "npm.cmd") @("run", "db:push", "--prefix", $serverPrefix)
  if ($LASTEXITCODE -ne 0) {
    throw "prisma db push failed. If the database is corrupted, delete server\prisma\dev.db and run this script again."
  }
  Write-Host ""
}

Write-Host "Starting web UI + SOC API (Vite + Express)..." -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT:" -ForegroundColor Yellow
Write-Host "  - Keep THIS WINDOW OPEN while you use the dashboard." -ForegroundColor Gray
Write-Host "  - If you close it (or press Ctrl+C), the site will show ERR_CONNECTION_REFUSED." -ForegroundColor Gray
Write-Host "  - Your internet connection is not involved; this runs on your PC only." -ForegroundColor Gray
Write-Host ""
Write-Host "Try these URLs if the browser does not open automatically:" -ForegroundColor Cyan
Write-Host "  http://localhost:5173/" -ForegroundColor White
Write-Host "  http://127.0.0.1:5173/" -ForegroundColor White
Write-Host ""

& (Join-Path $nodeHome "npm.cmd") run dev:full
