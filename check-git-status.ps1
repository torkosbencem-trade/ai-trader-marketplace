$ErrorActionPreference = "Continue"

$frontendRoot = "C:\ai-trader-marketplace"
$backendRoot = "C:\trading-bot"

$script:GitExe = $null

function Write-Section {
  param([string]$Title)

  Write-Host ""
  Write-Host "================================================================" -ForegroundColor DarkGray
  Write-Host $Title -ForegroundColor Cyan
  Write-Host "================================================================" -ForegroundColor DarkGray
}

function Resolve-GitExe {
  $git = Get-Command git -ErrorAction SilentlyContinue

  if ($git) {
    return $git.Source
  }

  $candidates = @(
    "C:\Program Files\Git\cmd\git.exe",
    "C:\Program Files\Git\bin\git.exe",
    "C:\Program Files (x86)\Git\cmd\git.exe",
    "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe",
    "$env:LOCALAPPDATA\Programs\Git\bin\git.exe"
  )

  foreach ($candidate in $candidates) {
    if (Test-Path $candidate) {
      return $candidate
    }
  }

  return $null
}

function Invoke-Git {
  param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
  )

  & $script:GitExe @Args
}

function Test-GitAvailable {
  $script:GitExe = Resolve-GitExe

  if (-not $script:GitExe) {
    Write-Host "[FAIL] Git executable was not found." -ForegroundColor Red
    Write-Host ""
    Write-Host "Try one of these:" -ForegroundColor Yellow
    Write-Host "1. Close and reopen PowerShell after installing Git." -ForegroundColor Gray
    Write-Host "2. Install Git:" -ForegroundColor Gray
    Write-Host "   winget install --id Git.Git -e --source winget" -ForegroundColor Gray
    Write-Host "3. Check this file exists:" -ForegroundColor Gray
    Write-Host "   C:\Program Files\Git\cmd\git.exe" -ForegroundColor Gray
    exit 1
  }

  Write-Host "[OK] Git found: $script:GitExe" -ForegroundColor Green
}

function Show-RepoStatus {
  param(
    [string]$Label,
    [string]$Path
  )

  Write-Section $Label

  if (-not (Test-Path $Path)) {
    Write-Host "[FAIL] Folder not found: $Path" -ForegroundColor Red
    return
  }

  Push-Location $Path

  try {
    $insideRepo = Invoke-Git rev-parse --is-inside-work-tree 2>$null

    if ($insideRepo -ne "true") {
      Write-Host "[WARN] Not a git repository: $Path" -ForegroundColor Yellow
      Write-Host ""
      Write-Host "Initialize it with:" -ForegroundColor Cyan
      Write-Host "cd $Path" -ForegroundColor Gray
      Write-Host "git init" -ForegroundColor Gray
      return
    }

    $branch = Invoke-Git branch --show-current
    $lastCommit = Invoke-Git log -1 --pretty=format:"%h - %s (%cr)" 2>$null
    $status = Invoke-Git status --short

    Write-Host "Path: $Path" -ForegroundColor Gray
    Write-Host "Branch: $branch" -ForegroundColor Gray

    if ($lastCommit) {
      Write-Host "Last commit: $lastCommit" -ForegroundColor Gray
    } else {
      Write-Host "Last commit: none" -ForegroundColor Yellow
    }

    Write-Host ""

    if (-not $status) {
      Write-Host "[OK] Working tree clean." -ForegroundColor Green
    } else {
      Write-Host "[WARN] Uncommitted changes found:" -ForegroundColor Yellow
      Write-Host ""
      Invoke-Git status --short
      Write-Host ""
      Write-Host "Suggested commit flow:" -ForegroundColor Cyan
      Write-Host "git add ." -ForegroundColor Gray
      Write-Host 'git commit -m "Describe your change"' -ForegroundColor Gray
    }
  } finally {
    Pop-Location
  }
}

Write-Host ""
Write-Host "AI Trader Project Git Status" -ForegroundColor Cyan
Write-Host ""

Test-GitAvailable

Show-RepoStatus -Label "Frontend repository" -Path $frontendRoot
Show-RepoStatus -Label "Backend repository" -Path $backendRoot

Write-Section "Result"

Write-Host "[OK] Git status check completed." -ForegroundColor Green