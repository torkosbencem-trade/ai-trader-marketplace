param(
  [string]$BackendBase = "http://127.0.0.1:8000",
  [string]$FrontendBase = "http://localhost:3000"
)

$backendBase = $BackendBase.TrimEnd("/")
$frontendBase = $FrontendBase.TrimEnd("/")

$ErrorActionPreference = "Stop"

$failed = 0
$passed = 0

function Write-Section {
  param([string]$Title)

  Write-Host ""
  Write-Host "================================================================" -ForegroundColor DarkGray
  Write-Host $Title -ForegroundColor Cyan
  Write-Host "================================================================" -ForegroundColor DarkGray
}

function Test-Url {
  param(
    [string]$Label,
    [string]$Url
  )

  try {
    $response = Invoke-WebRequest -Uri $Url -Method GET -UseBasicParsing -TimeoutSec 10

    if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
      Write-Host "[OK] $Label [$($response.StatusCode)]" -ForegroundColor Green
      Write-Host "     $Url" -ForegroundColor DarkGray
      $script:passed += 1
    } else {
      Write-Host "[FAIL] $Label [$($response.StatusCode)]" -ForegroundColor Red
      Write-Host "       $Url" -ForegroundColor DarkGray
      $script:failed += 1
    }
  } catch {
    Write-Host "[FAIL] $Label" -ForegroundColor Red
    Write-Host "       $Url" -ForegroundColor DarkGray
    Write-Host "       $($_.Exception.Message)" -ForegroundColor Yellow
    $script:failed += 1
  }
}

function Test-JsonEndpoint {
  param(
    [string]$Label,
    [string]$Url
  )

  try {
    $response = Invoke-WebRequest -Uri $Url -Method GET -UseBasicParsing -TimeoutSec 10

    if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 400) {
      Write-Host "[FAIL] $Label [$($response.StatusCode)]" -ForegroundColor Red
      Write-Host "       $Url" -ForegroundColor DarkGray
      $script:failed += 1
      return
    }

    $json = $null

    try {
      $json = $response.Content | ConvertFrom-Json
    } catch {
      Write-Host "[WARN] $Label [$($response.StatusCode)] - response is not JSON" -ForegroundColor Yellow
      Write-Host "       $Url" -ForegroundColor DarkGray
      $script:failed += 1
      return
    }

    $summary = ""

    if ($json -is [System.Array]) {
      $summary = "items: $($json.Count)"
    } elseif ($null -ne $json.strategies) {
      $summary = "strategies: $($json.strategies.Count)"
    } elseif ($null -ne $json.signals) {
      $summary = "signals: $($json.signals.Count)"
    } elseif ($null -ne $json.test_runs) {
      $summary = "test_runs: $($json.test_runs.Count)"
    } elseif ($null -ne $json.testRuns) {
      $summary = "testRuns: $($json.testRuns.Count)"
    } elseif ($null -ne $json.runs) {
      $summary = "runs: $($json.runs.Count)"
    } elseif ($null -ne $json.trades) {
      $summary = "trades: $($json.trades.Count)"
    } elseif ($null -ne $json.logs) {
      $summary = "logs: $($json.logs.Count)"
    } elseif ($null -ne $json.items) {
      $summary = "items: $($json.items.Count)"
    } elseif ($null -ne $json.data -and $json.data -is [System.Array]) {
      $summary = "data: $($json.data.Count)"
    } else {
      $summary = "json ok"
    }

    Write-Host "[OK] $Label [$($response.StatusCode)] - $summary" -ForegroundColor Green
    Write-Host "     $Url" -ForegroundColor DarkGray
    $script:passed += 1
  } catch {
    Write-Host "[FAIL] $Label" -ForegroundColor Red
    Write-Host "       $Url" -ForegroundColor DarkGray
    Write-Host "       $($_.Exception.Message)" -ForegroundColor Yellow
    $script:failed += 1
  }
}

Write-Host ""
Write-Host "AI Trader Full Stack Smoke Test" -ForegroundColor Cyan
Write-Host ""

Write-Section "Backend JSON endpoints"

$backendEndpoints = @(
  @{ Label = "Backend health"; Url = "$backendBase/health" },
  @{ Label = "Marketplace strategies"; Url = "$backendBase/marketplace/strategies" },
  @{ Label = "Marketplace signals"; Url = "$backendBase/marketplace/signals" },
  @{ Label = "Marketplace performance"; Url = "$backendBase/marketplace/performance" },
  @{ Label = "Test runs"; Url = "$backendBase/test-runs" },
  @{ Label = "Test run performance"; Url = "$backendBase/test-runs/performance" },
  @{ Label = "Shadow Live trades"; Url = "$backendBase/shadow-live/trades" },
  @{ Label = "Shadow Live logs"; Url = "$backendBase/shadow-live/logs" },
  @{ Label = "Shadow Live performance"; Url = "$backendBase/shadow-live/performance" },
  @{ Label = "Shadow Live config"; Url = "$backendBase/shadow-live/config" },
  @{ Label = "Execution status"; Url = "$backendBase/execution/status" }
  @{ Label = "Execution audit"; Url = "$backendBase/execution/audit?limit=10" }
  @{ Label = "Execution gateway status"; Url = "$backendBase/execution/gateway-status" }
)

foreach ($endpoint in $backendEndpoints) {
  Test-JsonEndpoint -Label $endpoint.Label -Url $endpoint.Url
}

Write-Section "Frontend routes"

$frontendRoutes = @(
  @{ Label = "Marketplace"; Url = "$frontendBase/" },
  @{ Label = "Dashboard"; Url = "$frontendBase/dashboard" },
  @{ Label = "Signals"; Url = "$frontendBase/signals" },
  @{ Label = "Performance"; Url = "$frontendBase/performance" },
  @{ Label = "Test Runs"; Url = "$frontendBase/test-runs" },
  @{ Label = "Shadow Live"; Url = "$frontendBase/shadow-live" },
  @{ Label = "Execution"; Url = "$frontendBase/execution" },
  @{ Label = "Execution Audit"; Url = "$frontendBase/execution-audit" },
  @{ Label = "Project Status"; Url = "$frontendBase/project-status" },
  @{ Label = "System"; Url = "$frontendBase/system" },
  @{ Label = "Subscription"; Url = "$frontendBase/subscription" },
  @{ Label = "Strategy Detail"; Url = "$frontendBase/strategies/test-strategy" },
  @{ Label = "Live Signals Alias"; Url = "$frontendBase/live-signals" }
)
foreach ($route in $frontendRoutes) {
  Test-Url -Label $route.Label -Url $route.Url
}

Write-Section "Result"

Write-Host "Passed: $passed" -ForegroundColor Green

if ($failed -eq 0) {
  Write-Host "Failed: $failed" -ForegroundColor Green
  Write-Host ""
  Write-Host "[OK] Full-stack smoke test passed." -ForegroundColor Green
  Write-Host "     Frontend and backend are responding correctly." -ForegroundColor Gray
  exit 0
}

Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host ""
Write-Host "[WARN] Full-stack smoke test found issues." -ForegroundColor Yellow
Write-Host "       Check that both backend and frontend are running." -ForegroundColor Gray
exit 1