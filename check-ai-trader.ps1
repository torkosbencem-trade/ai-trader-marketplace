param(
  [string]$BackendBase = "http://127.0.0.1:8003",
  [string]$FrontendBase = "http://localhost:3000"
)

$BackendBase = $BackendBase.TrimEnd("/")
$FrontendBase = $FrontendBase.TrimEnd("/")

Write-Host ""
Write-Host "AI Trader Marketplace health check" -ForegroundColor Cyan
Write-Host "Backend:  $BackendBase"
Write-Host "Frontend: $FrontendBase"
Write-Host ""

$failed = 0

function Test-JsonEndpoint {
  param(
    [string]$Label,
    [string]$Url
  )

  try {
    $response = Invoke-RestMethod -Uri $Url -Method GET -TimeoutSec 10

    Write-Host "[OK]   $Label" -ForegroundColor Green
    return $response
  } catch {
    Write-Host "[FAIL] $Label" -ForegroundColor Red
    Write-Host "       $Url" -ForegroundColor DarkGray
    Write-Host "       $($_.Exception.Message)" -ForegroundColor Red
    $script:failed += 1
    return $null
  }
}

function Test-Page {
  param(
    [string]$Label,
    [string]$Url
  )

  try {
    $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 10 -UseBasicParsing

    if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
      Write-Host "[OK]   $Label" -ForegroundColor Green
    } else {
      Write-Host "[FAIL] $Label HTTP $($response.StatusCode)" -ForegroundColor Red
      $script:failed += 1
    }
  } catch {
    Write-Host "[FAIL] $Label" -ForegroundColor Red
    Write-Host "       $Url" -ForegroundColor DarkGray
    Write-Host "       $($_.Exception.Message)" -ForegroundColor Red
    $script:failed += 1
  }
}

Write-Host "Backend endpoints" -ForegroundColor Yellow

$health = Test-JsonEndpoint "Backend health" "$BackendBase/health"
$executionStatus = Test-JsonEndpoint "Execution status" "$BackendBase/execution/status"
$gatewayStatus = Test-JsonEndpoint "Execution gateway status" "$BackendBase/execution/gateway-status"
$audit = Test-JsonEndpoint "Execution audit" "$BackendBase/execution/audit?limit=10"

Write-Host ""
Write-Host "Gateway safety assertions" -ForegroundColor Yellow

if ($gatewayStatus) {
  $checks = @(
    @{ Label = "gateway == DRY_RUN_EXCHANGE_GATEWAY"; Ok = ($gatewayStatus.gateway -eq "DRY_RUN_EXCHANGE_GATEWAY") },
    @{ Label = "execution_engine == dry_run_only"; Ok = ($gatewayStatus.execution_engine -eq "dry_run_only") },
    @{ Label = "dry_run_only == true"; Ok = ($gatewayStatus.dry_run_only -eq $true) },
    @{ Label = "real_order_sent == false"; Ok = ($gatewayStatus.real_order_sent -eq $false) },
    @{ Label = "network_request_sent == false"; Ok = ($gatewayStatus.network_request_sent -eq $false) },
    @{ Label = "binance_order_sent == false"; Ok = ($gatewayStatus.binance_order_sent -eq $false) },
    @{ Label = "audit_logging == true"; Ok = ($gatewayStatus.audit_logging -eq $true) }
  )

  foreach ($check in $checks) {
    if ($check.Ok) {
      Write-Host "[OK]   $($check.Label)" -ForegroundColor Green
    } else {
      Write-Host "[FAIL] $($check.Label)" -ForegroundColor Red
      $failed += 1
    }
  }
}

Write-Host ""
Write-Host "Frontend pages" -ForegroundColor Yellow

Test-Page "Marketplace" "$FrontendBase/"
Test-Page "Execution" "$FrontendBase/execution"
Test-Page "Execution audit" "$FrontendBase/execution-audit"
Test-Page "Project status" "$FrontendBase/project-status"
Test-Page "System" "$FrontendBase/system"

Write-Host ""
Write-Host "Result" -ForegroundColor Cyan

if ($failed -eq 0) {
  Write-Host "[OK] AI Trader is healthy." -ForegroundColor Green
  exit 0
}

Write-Host "[FAIL] AI Trader health check failed. Failed checks: $failed" -ForegroundColor Red
exit 1