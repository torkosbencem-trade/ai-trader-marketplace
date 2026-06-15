param(
  [string[]]$Ports = @("3000", "8003"),
  [switch]$DryRun
)

Write-Host ""
Write-Host "AI Trader Marketplace stop script" -ForegroundColor Cyan
Write-Host "Ports: $($Ports -join ', ')"
Write-Host ""

foreach ($port in $Ports) {
  Write-Host "Checking port $port..." -ForegroundColor Yellow

  $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
    Where-Object { $_.State -eq "Listen" }

  if (-not $connections) {
    Write-Host "No LISTENING process on port $port." -ForegroundColor DarkGray
    continue
  }

  $pids = $connections |
    Select-Object -ExpandProperty OwningProcess -Unique

  foreach ($processId in $pids) {
    $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId=$processId" -ErrorAction SilentlyContinue

    Write-Host ""
    Write-Host "Port $port is used by PID $processId" -ForegroundColor Yellow

    if ($processInfo) {
      Write-Host $processInfo.CommandLine -ForegroundColor DarkGray
    }

    if ($DryRun) {
      Write-Host "Dry run: would stop PID $processId" -ForegroundColor Cyan
    } else {
      Write-Host "Stopping PID $processId..." -ForegroundColor Red
      taskkill /PID $processId /T /F
    }
  }
}

Write-Host ""
Write-Host "Final port status:" -ForegroundColor Cyan

foreach ($port in $Ports) {
  netstat -ano | findstr ":$port"
}

Write-Host ""
Write-Host "Stop script finished." -ForegroundColor Green