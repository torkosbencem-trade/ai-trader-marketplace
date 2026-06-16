$ErrorActionPreference = "Stop"

$frontendRoot = "C:\ai-trader-marketplace"
$backendRoot = "C:\trading-bot"

$startScript = Join-Path $frontendRoot "start-full-stack.ps1"
$stopScript = Join-Path $frontendRoot "stop-full-stack.ps1"
$restartScript = Join-Path $frontendRoot "restart-full-stack.ps1"
$projectCheckScript = Join-Path $frontendRoot "check-project.ps1"
$smokeTestScript = Join-Path $frontendRoot "check-full-stack.ps1"
$gitStatusScript = Join-Path $frontendRoot "check-git-status.ps1"
$backendPython = Join-Path $backendRoot ".venv\Scripts\python.exe"

function Write-Header {
  Clear-Host
  Write-Host ""
  Write-Host "============================================================" -ForegroundColor DarkGray
  Write-Host "AI Trader Developer Console" -ForegroundColor Cyan
  Write-Host "============================================================" -ForegroundColor DarkGray
  Write-Host ""
  Write-Host "Frontend: $frontendRoot" -ForegroundColor Gray
  Write-Host "Backend : $backendRoot" -ForegroundColor Gray
  Write-Host ""
}

function Pause-Console {
  Write-Host ""
  Read-Host "Press Enter to continue"
}

function Run-Script {
  param(
    [string]$Label,
    [string]$Path,
    [string[]]$Args = @()
  )

  if (-not (Test-Path $Path)) {
    Write-Host "[FAIL] $Label script not found:" -ForegroundColor Red
    Write-Host $Path -ForegroundColor Yellow
    Pause-Console
    return
  }

  Write-Host ""
  Write-Host "Running: $Label" -ForegroundColor Cyan
  Write-Host $Path -ForegroundColor DarkGray
  Write-Host ""

  & powershell.exe -ExecutionPolicy Bypass -File $Path @Args

  Pause-Console
}

function Run-BackendSafetySuite {
  param([switch]$EnvOnly)

  if (-not (Test-Path $backendPython)) {
    Write-Host "[FAIL] Backend Python not found:" -ForegroundColor Red
    Write-Host $backendPython -ForegroundColor Yellow
    Pause-Console
    return
  }

  Push-Location $backendRoot

  try {
    if ($EnvOnly) {
      & $backendPython "run_safety_suite.py" "--env-only"
    } else {
      & $backendPython "run_safety_suite.py"
    }
  } finally {
    Pop-Location
  }

  Pause-Console
}

function Open-ProjectUrls {
  Write-Host ""
  Write-Host "Opening project URLs..." -ForegroundColor Cyan

  Start-Process "http://localhost:3000"
  Start-Process "http://localhost:3000/dashboard"
  Start-Process "http://localhost:3000/project-status"
  Start-Process "http://localhost:3000/execution"
  Start-Process "http://localhost:3000/execution-audit"
  Start-Process "http://localhost:3000/system"
  Start-Process "http://127.0.0.1:8000/health"

  Pause-Console
}

function Show-Menu {
  Write-Host "Choose an action:" -ForegroundColor White
  Write-Host ""
  Write-Host "  1. Start full stack" -ForegroundColor Green
  Write-Host "  2. Stop full stack" -ForegroundColor Yellow
  Write-Host "  3. Restart full stack" -ForegroundColor Cyan
  Write-Host "  4. Restart full stack + project check" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "  5. Run project check" -ForegroundColor Green
  Write-Host "  6. Run project check env-only" -ForegroundColor Green
  Write-Host "  7. Run frontend/backend smoke test only" -ForegroundColor Green
  Write-Host ""
  Write-Host "  8. Run backend safety suite" -ForegroundColor Magenta
  Write-Host "  9. Run backend safety suite env-only" -ForegroundColor Magenta
  Write-Host ""
  Write-Host "  10. Open project URLs" -ForegroundColor Blue
  Write-Host "  11. Check frontend/backend Git status" -ForegroundColor DarkCyan
  Write-Host "  0. Exit" -ForegroundColor DarkGray
  Write-Host ""
}

while ($true) {
  Write-Header
  Show-Menu

  $choice = Read-Host "Enter choice"

  switch ($choice) {
    "1" {
      Run-Script -Label "Start full stack" -Path $startScript
    }
    "2" {
      Run-Script -Label "Stop full stack" -Path $stopScript
    }
    "3" {
      Run-Script -Label "Restart full stack" -Path $restartScript
    }
    "4" {
      Run-Script -Label "Restart full stack with project check" -Path $restartScript -Args @("-Check", "-WaitSeconds", "20")
    }
    "5" {
      Run-Script -Label "Project check" -Path $projectCheckScript
    }
    "6" {
      Run-Script -Label "Project check env-only" -Path $projectCheckScript -Args @("-EnvOnly")
    }
    "7" {
      Run-Script -Label "Full-stack smoke test" -Path $smokeTestScript
    }
    "8" {
      Run-BackendSafetySuite
    }
    "9" {
      Run-BackendSafetySuite -EnvOnly
    }
    "10" {
  Open-ProjectUrls
}
"11" {
  Run-Script -Label "Project Git status" -Path $gitStatusScript
}
"0" {
      Write-Host ""
      Write-Host "Exiting AI Trader Developer Console." -ForegroundColor Gray
      exit 0
    }
    default {
      Write-Host ""
      Write-Host "[WARN] Unknown choice: $choice" -ForegroundColor Yellow
      Pause-Console
    }
  }
}