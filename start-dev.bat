@echo off
REM Contingency POS Development Server Startup Script for Windows
REM This script starts both the Angular development server and the backend server

echo.
echo ==========================================
echo   Contingency POS Development Environment
echo ==========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed. Please install npm first.
    pause
    exit /b 1
)

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] package.json not found. Please run this script from the project root directory.
    pause
    exit /b 1
)

if not exist "server.js" (
    echo [ERROR] server.js not found. Please run this script from the project root directory.
    pause
    exit /b 1
)

echo [INFO] Prerequisites check passed

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo [SUCCESS] Dependencies installed
)

echo.
echo [INFO] Available development modes:
echo   1) Development mode (Angular dev + Backend)
echo   2) Production mode (Angular dist + Backend)
echo   3) All modes (Angular dev + Angular dist + Backend)
echo.
set /p mode="Select mode (1-3) [default: 1]: "
if "%mode%"=="" set mode=1

if "%mode%"=="1" (
    echo.
    echo [INFO] Starting development servers...
    echo.
    echo [INFO] Angular Dev Server: http://localhost:4200
    echo [INFO] Backend API Server: http://localhost:3001
    echo [INFO] Backend Health Check: http://localhost:3001/health
    echo.
    echo [WARNING] Press Ctrl+C to stop both servers
    echo.
    npm run dev
) else if "%mode%"=="2" (
    echo.
    echo [INFO] Building Angular app for production...
    npm run build:prod
    if errorlevel 1 (
        echo [ERROR] Build failed. Exiting.
        pause
        exit /b 1
    )
    echo.
    echo [INFO] Starting production servers...
    echo.
    echo [INFO] Angular Dist Server: http://localhost:4201
    echo [INFO] Backend API Server: http://localhost:3001
    echo [INFO] Backend Health Check: http://localhost:3001/health
    echo.
    echo [WARNING] Press Ctrl+C to stop both servers
    echo.
    npm run dev:dist
) else if "%mode%"=="3" (
    echo.
    echo [INFO] Building Angular app for production...
    npm run build:prod
    if errorlevel 1 (
        echo [ERROR] Build failed. Exiting.
        pause
        exit /b 1
    )
    echo.
    echo [INFO] Starting all servers...
    echo.
    echo [INFO] Angular Dev Server: http://localhost:4200
    echo [INFO] Angular Dist Server: http://localhost:4201
    echo [INFO] Backend API Server: http://localhost:3001
    echo [INFO] Backend Health Check: http://localhost:3001/health
    echo.
    echo [WARNING] Press Ctrl+C to stop all servers
    echo.
    npm run dev:all
) else (
    echo [ERROR] Invalid selection. Exiting.
    pause
    exit /b 1
)

if errorlevel 1 (
    echo [ERROR] Development servers stopped unexpectedly
    pause
    exit /b 1
)
