@echo off
REM ══════════════════════════════════════════════════════════
REM  Trippie Launcher — Kidopedia
REM  Double-click to connect this machine to the hub.
REM  Verify the two paths below are correct, then save and run.
REM ══════════════════════════════════════════════════════════

REM ── Hub connection (pre-filled, do not edit) ────────────────
SET TRIPPIE_HUB_URL=http://localhost:3001
SET TRIPPIE_HUB_API_KEY=trippie_9c44764a85456f5404354834459c0401fe9c0d5e5a27e9ab
SET TRIPPIE_PROJECT_ID=proj-1772518318488

REM ── Local paths (verify these match this machine) ──────────
REM  TRIPPIE_PROJECT_ROOT: root folder of your project source code.
REM  This path was set when the project was created in the hub.
SET TRIPPIE_PROJECT_ROOT=D:/Kidopedia

REM  TRIPPIE_DATA_DIR: the .trippie folder inside the project root.
REM  Automatically derived as {PROJECT_ROOT}\.trippie — usually correct.
SET TRIPPIE_DATA_DIR=D:\Kidopedia\.trippie

REM ── Runtime (do not edit below this line) ──────────────────
SET LAUNCHER=%TRIPPIE_DATA_DIR%\agent\launcher.ts
SET BOOTSTRAP=%TRIPPIE_DATA_DIR%\launcher-bootstrap.ts
SET TSX=%TRIPPIE_DATA_DIR%\agent\node_modules\tsx\dist\cli.mjs

REM ── First run: bootstrap to deploy the full agent bundle ────
IF NOT EXIST "%LAUNCHER%" (
  REM Always re-download bootstrap so we get the latest version from the hub
  echo [Bootstrap] Downloading bootstrap from hub...
  if not exist "%TRIPPIE_DATA_DIR%" mkdir "%TRIPPIE_DATA_DIR%"
  curl -s -f -L -o "%BOOTSTRAP%" "%TRIPPIE_HUB_URL%/api/trippie/launcher-bootstrap" -H "Authorization: Bearer %TRIPPIE_HUB_API_KEY%"
  IF ERRORLEVEL 1 (
    echo [ERROR] Could not download bootstrap. Check TRIPPIE_HUB_URL and TRIPPIE_HUB_API_KEY.
    pause
    exit /b 1
  )
  echo [Bootstrap] Connecting to hub — waiting for Deploy command in the dashboard...
  npx tsx "%BOOTSTRAP%"
  IF ERRORLEVEL 1 (
    echo [ERROR] Bootstrap failed.
    pause
    exit /b 1
  )
  echo.
  echo [Bootstrap] Agent deployed. Re-run this script to start the full launcher.
  pause
  exit /b 0
)

REM ── Agent deployed: start the full launcher ─────────────────
IF EXIST "%TSX%" (
  echo Starting Trippie Launcher for Kidopedia...
  node "%TSX%" "%LAUNCHER%"
) ELSE (
  echo Starting Trippie Launcher for Kidopedia via npx...
  npx tsx "%LAUNCHER%"
)
pause