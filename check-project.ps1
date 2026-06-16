param(
  [switch]$EnvOnly,
  [string]$BackendBase = "http://127.0.0.1:8000"
)

$ErrorActionPreference = "Stop"

$frontendRoot = "C:\ai-trader-marketplace"
$backendRoot = "C:\trading-bot"

$backendPython = Join-Path $backendRoot ".venv\Scripts\python.exe"
$backendSafetySuite = Join-Path $backendRoot "run_safety_suite.py"
$frontendSmokeTest = Join-Path $frontendRoot "check-full-stack.ps1"

$passed = 0
$failed = 0

function Write-Section {
  param([string]$Title)

  Write-Host ""
  Write-Host "================================================================" -ForegroundColor DarkGray
  Write-Host $Title -ForegroundColor Cyan
  Write-Host "================================================================" -ForegroundColor DarkGray
}

function Run-Step {
  param(
    [string]$Label,
    [scriptblock]$Command
  )

  Write-Section $Label

  try {
    & $Command

    if ($LASTEXITCODE -ne $null -and $LASTEXITCODE -ne 0) {
      throw "Command exited with code $LASTEXITCODE"
    }

    Write-Host ""
    Write-Host "[OK] $Label passed." -ForegroundColor Green
    $script:passed += 1
  } catch {
    Write-Host ""
    Write-Host "[FAIL] $Label failed." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Yellow
    $script:failed += 1
  }
}

Write-Host ""
Write-Host "AI Trader Project Check" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $frontendRoot)) {
  Write-Host "[FAIL] Frontend folder not found: $frontendRoot" -ForegroundColor Red
  exit 1
}

if (-not (Test-Path $backendRoot)) {
  Write-Host "[FAIL] Backend folder not found: $backendRoot" -ForegroundColor Red
  exit 1
}

if (-not (Test-Path $backendPython)) {
  Write-Host "[FAIL] Backend Python not found: $backendPython" -ForegroundColor Red
  Write-Host "Activate or recreate the backend virtual environment first." -ForegroundColor Yellow
  exit 1
}

if (-not (Test-Path $backendSafetySuite)) {
  Write-Host "[FAIL] Backend safety suite not found: $backendSafetySuite" -ForegroundColor Red
  exit 1
}

if (-not (Test-Path $frontendSmokeTest)) {
  Write-Host "[FAIL] Frontend smoke test not found: $frontendSmokeTest" -ForegroundColor Red
  exit 1
}

Run-Step "Backend safety suite" {
  Push-Location $backendRoot

  if ($EnvOnly) {
    & $backendPython "run_safety_suite.py" "--env-only"
  } else {
    & $backendPython "run_safety_suite.py" "--base-url" $BackendBase
  }

  Pop-Location
}

if (-not $EnvOnly) {
  Run-Step "Full-stack smoke test" {
    Push-Location $frontendRoot
    & powershell.exe -ExecutionPolicy Bypass -File $frontendSmokeTest -BackendBase $BackendBase
    Pop-Location
  }
} else {
  Write-Section "Full-stack smoke test"
  Write-Host "[SKIP] EnvOnly mode enabled, skipping backend/frontend HTTP smoke test." -ForegroundColor Yellow
}

Write-Section "Project Check Result"

Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })

if ($failed -eq 0) {
  Write-Host ""
  Write-Host "[OK] AI Trader project check passed." -ForegroundColor Green
  Write-Host "Safety suite and full-stack checks are clean." -ForegroundColor Gray
  exit 0
}

Write-Host ""
Write-Host "[FAIL] AI Trader project check found issues." -ForegroundColor Red
Write-Host "Fix the failing section before continuing." -ForegroundColor Gray
exit 1