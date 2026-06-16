param(
  [int[]]$Ports = @(3000, 8000),
  [switch]$DryRun
)

$ErrorActionPreference = "Continue"

function Write-Section {
  param([string]$Title)

  Write-Host ""
  Write-Host "================================================================" -ForegroundColor DarkGray
  Write-Host $Title -ForegroundColor Cyan
  Write-Host "================================================================" -ForegroundColor DarkGray
}

function Get-PortPids {
  param([int]$Port)

  $pids = @()

  $getNetTcpConnection = Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue

  if ($getNetTcpConnection) {
    try {
      $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue

      foreach ($connection in $connections) {
        if ($connection.OwningProcess -and $connection.OwningProcess -ne 0) {
          $pids += [int]$connection.OwningProcess
        }
      }
    } catch {
      $pids = @()
    }
  }

  if ($pids.Count -eq 0) {
    try {
      $netstatLines = netstat -ano | Select-String ":$Port"

      foreach ($line in $netstatLines) {
        $parts = ($line.ToString() -split "\s+") | Where-Object { $_ -ne "" }

        if ($parts.Count -ge 5) {
          $candidatePid = $parts[-1]

          if ($candidatePid -match "^\d+$" -and [int]$candidatePid -ne 0) {
            $pids += [int]$candidatePid
          }
        }
      }
    } catch {
      $pids = @()
    }
  }

  return $pids | Sort-Object -Unique
}

function Stop-Port {
  param([int]$Port)

  Write-Section "Checking port $Port"

  $pids = @(Get-PortPids -Port $Port)

  if ($pids.Count -eq 0) {
    Write-Host "[OK] No process found on port $Port." -ForegroundColor Green
    return
  }

  foreach ($pidValue in $pids) {
    try {
      $process = Get-Process -Id $pidValue -ErrorAction Stop

      Write-Host "[FOUND] Port $Port is used by PID $pidValue ($($process.ProcessName))." -ForegroundColor Yellow

      if ($DryRun) {
        Write-Host "[DRY RUN] Would stop PID $pidValue." -ForegroundColor Cyan
        continue
      }

      Stop-Process -Id $pidValue -Force -ErrorAction Stop

      Write-Host "[OK] Stopped PID $pidValue on port $Port." -ForegroundColor Green
    } catch {
      Write-Host "[WARN] Could not stop PID $pidValue on port $Port." -ForegroundColor Yellow
      Write-Host "       $($_.Exception.Message)" -ForegroundColor DarkYellow
    }
  }
}

Write-Host ""
Write-Host "AI Trader Full Stack Stop Script" -ForegroundColor Cyan
Write-Host ""

foreach ($port in $Ports) {
  Stop-Port -Port $port
}

Write-Section "Result"

if ($DryRun) {
  Write-Host "[OK] Dry run completed. No processes were stopped." -ForegroundColor Green
} else {
  Write-Host "[OK] Stop script completed." -ForegroundColor Green
}

Write-Host ""
Write-Host "Checked ports: $($Ports -join ', ')" -ForegroundColor Gray