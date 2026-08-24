#Requires -Version 5.1
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

function Assert-Command([string]$Name, [string]$Hint) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] $Name not found. $Hint" -ForegroundColor Red
    exit 1
  }
}

Assert-Command 'node' 'Please install Node.js first.'
Assert-Command 'pnpm' 'Run: npm install -g pnpm'

if (-not (Test-Path 'node_modules\concurrently')) {
  Write-Host 'Installing root dependencies...' -ForegroundColor Yellow
  npm install
}

Write-Host ''
Write-Host 'Starting backstage-management...' -ForegroundColor Green
Write-Host '  API:   http://localhost:3001/api'
Write-Host '  Admin: http://localhost:8848'
Write-Host ''

npm run dev
