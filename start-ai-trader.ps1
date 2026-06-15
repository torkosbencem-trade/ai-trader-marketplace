param(
  [string]$BackendPort = "8003",
  [string]$FrontendPort = "3000",
  [switch]$OpenBrowser
)

$frontendDir = "C:\ai-trader-marketplace"
$backendDir = "C:\trading-bot"

$backendBase = "http://127.0.0.1:$BackendPort"
$frontendBase = "http://localhost:$FrontendPort"

Write-Host ""
Write-Host "AI Trader Marketplace startup" -ForegroundColor Cyan
Write-Host "Backend:  $backendBase"
Write-Host "Frontend: $frontendBase"
Write-Host ""

if (-not (Test-Path $frontendDir)) {
  Write-Host "Frontend folder not found: $frontendDir" -ForegroundColor Red
  exit 1
}

if (-not (Test-Path $backendDir)) {
  Write-Host "Backend folder not found: $backendDir" -ForegroundColor Red
  exit 1
}

$envLocal = @"
NEXT_PUBLIC_API_BASE_URL=$backendBase
NEXT_PUBLIC_ENABLE_DEMO_FALLBACK=false
"@

Set-Content -Path "$frontendDir\.env.local" -Value $envLocal -Encoding UTF8

Write-Host "Wrote frontend .env.local:" -ForegroundColor Green
Get-Content "$frontendDir\.env.local"

$backendCommand = @"
cd $backendDir
.\.venv\Scripts\Activate.ps1
python -m uvicorn main:app --app-dir $backendDir --host 127.0.0.1 --port $BackendPort
"@

$frontendCommand = @"
cd $frontendDir
npm run dev
"@

Write-Host ""
Write-Host "Starting backend window..." -ForegroundColor Green
Start-Process powershell.exe -ArgumentList @(
  "-NoExit",
  "-ExecutionPolicy", "Bypass",
  "-Command", $backendCommand
)

Start-Sleep -Seconds 3

Write-Host "Starting frontend window..." -ForegroundColor Green
Start-Process powershell.exe -ArgumentList @(
  "-NoExit",
  "-ExecutionPolicy", "Bypass",
  "-Command", $frontendCommand
)

if ($OpenBrowser) {
  Start-Sleep -Seconds 6

  Start-Process "$frontendBase"
  Start-Process "$frontendBase/execution"
  Start-Process "$frontendBase/execution-audit"
  Start-Process "$frontendBase/project-status"
  Start-Process "$frontendBase/system"
}

Write-Host ""
Write-Host "Startup launched." -ForegroundColor Green
Write-Host "Use these URLs:"
Write-Host "$frontendBase"
Write-Host "$frontendBase/execution"
Write-Host "$frontendBase/execution-audit"
Write-Host "$frontendBase/project-status"
Write-Host "$frontendBase/system"