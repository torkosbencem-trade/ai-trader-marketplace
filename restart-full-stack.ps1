param(
  [switch]$SkipStop,
  [switch]$Check,
  [int]$WaitSeconds = 12
)

$ErrorActionPreference = "Stop"

$frontendRoot = "C:\ai-trader-marketplace"

$stopScript = Join-Path $frontendRoot "stop-full-stack.ps1"
$startScript = Join-Path $frontendRoot "start-full-stack.ps1"
$checkScript = Join-Path $frontendRoot "check-project.ps1"

function Write-Section {
  param([string]$Title)

  Write-Host ""
  Write-Host "================================================================" -ForegroundColor DarkGray
  Write-Host $Title -ForegroundColor Cyan
  Write-Host "================================================================" -ForegroundColor DarkGray
}

function Assert-FileExists {
  param(
    [string]$Label,
    [string]$Path
  )

  if (-not (Test-Path $Path)) {
    Write-Host "[FAIL] $Label not found: $Path" -ForegroundColor Red
    exit 1
  }

  Write-Host "[OK] $Label found." -ForegroundColor Green
  Write-Host "     $Path" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "AI Trader Full Stack Restart" -ForegroundColor Cyan
Write-Host ""

Write-Section "Validating scripts"

Assert-FileExists -Label "Stop script" -Path $stopScript
Assert-FileExists -Label "Start script" -Path $startScript

if ($Check) {
  Assert-FileExists -Label "Project check script" -Path $checkScript
}

if (-not $SkipStop) {
  Write-Section "Stopping existing full-stack processes"

  Push-Location $frontendRoot
  & powershell.exe -ExecutionPolicy Bypass -File $stopScript
  Pop-Location
} else {
  Write-Section "Stopping existing full-stack processes"
  Write-Host "[SKIP] SkipStop enabled. Existing processes will not be stopped." -ForegroundColor Yellow
}

Write-Section "Starting full-stack system"

Push-Location $frontendRoot
& powershell.exe -ExecutionPolicy Bypass -File $startScript
Pop-Location

Write-Host ""
Write-Host "[OK] Start command executed." -ForegroundColor Green

Write-Section "Waiting for services"

Write-Host "Waiting $WaitSeconds seconds for backend and frontend startup..." -ForegroundColor Gray
Start-Sleep -Seconds $WaitSeconds

if ($Check) {
  Write-Section "Running project check"

  Push-Location $frontendRoot
  & powershell.exe -ExecutionPolicy Bypass -File $checkScript
  $checkExitCode = $LASTEXITCODE
  Pop-Location

  if ($checkExitCode -ne 0) {
    Write-Host ""
    Write-Host "[FAIL] Project check failed after restart." -ForegroundColor Red
    exit $checkExitCode
  }

  Write-Host ""
  Write-Host "[OK] Project check passed after restart." -ForegroundColor Green
}

Write-Section "Result"

Write-Host "[OK] Full-stack restart completed." -ForegroundColor Green
Write-Host ""
Write-Host "Frontend:" -ForegroundColor Gray
Write-Host "http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:" -ForegroundColor Gray
Write-Host "http://127.0.0.1:8000/health" -ForegroundColor Cyan