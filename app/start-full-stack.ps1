$backendPath = "C:\trading-bot"
$frontendPath = "C:\ai-trader-marketplace"

Write-Host ""
Write-Host "Starting AI Trader full stack..." -ForegroundColor Cyan
Write-Host ""

if (!(Test-Path $backendPath)) {
  Write-Host "Backend folder not found: $backendPath" -ForegroundColor Red
  exit 1
}

if (!(Test-Path $frontendPath)) {
  Write-Host "Frontend folder not found: $frontendPath" -ForegroundColor Red
  exit 1
}

$backendVenv = Join-Path $backendPath ".venv\Scripts\Activate.ps1"

if (!(Test-Path $backendVenv)) {
  Write-Host "Backend virtual environment not found: $backendVenv" -ForegroundColor Red
  Write-Host "Create it first or adjust the path in this script." -ForegroundColor Yellow
  exit 1
}

Write-Host "Opening backend terminal..." -ForegroundColor Green

Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-ExecutionPolicy", "Bypass",
  "-Command",
  "cd '$backendPath'; .\.venv\Scripts\Activate.ps1; uvicorn main:app --reload"
)

Start-Sleep -Seconds 3

Write-Host "Opening frontend terminal..." -ForegroundColor Green

Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-ExecutionPolicy", "Bypass",
  "-Command",
  "cd '$frontendPath'; npm run dev"
)

Write-Host ""
Write-Host "AI Trader is starting." -ForegroundColor Cyan
Write-Host "Backend:  http://127.0.0.1:8000" -ForegroundColor Gray
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Gray
Write-Host ""