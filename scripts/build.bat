@echo off
setlocal enabledelayedexpansion

REM Cross-platform build script for Stardew Valley Mod Manager (Windows)

if "%1"=="" (
    echo [ERROR] No target specified. Usage: build.bat [windows^|macos^|linux^|all]
    exit /b 1
)

set TARGET=%1

echo [INFO] Starting build for target: %TARGET%

REM Install required Rust targets
echo [INFO] Ensuring required Rust targets are installed...
if "%TARGET%"=="windows" (
    rustup target add x86_64-pc-windows-msvc
) else if "%TARGET%"=="macos" (
    rustup target add x86_64-apple-darwin
    rustup target add aarch64-apple-darwin
) else if "%TARGET%"=="linux" (
    rustup target add x86_64-unknown-linux-gnu
) else if "%TARGET%"=="all" (
    rustup target add x86_64-pc-windows-msvc
    rustup target add x86_64-apple-darwin
    rustup target add aarch64-apple-darwin
    rustup target add x86_64-unknown-linux-gnu
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo [INFO] Installing Node.js dependencies...
    call npm install
)

REM Build frontend
echo [INFO] Building frontend...
call npm run build

REM Build based on target
if "%TARGET%"=="windows" (
    call :build_windows
) else if "%TARGET%"=="macos" (
    call :build_macos
) else if "%TARGET%"=="linux" (
    call :build_linux
) else if "%TARGET%"=="all" (
    echo [INFO] Building for all platforms...
    call :build_windows
    call :build_macos
    call :build_linux
) else (
    echo [ERROR] Invalid target: %TARGET%. Valid targets: windows, macos, linux, all
    exit /b 1
)

echo [SUCCESS] Build process completed!
echo [INFO] Built files are located in src-tauri\target\release\bundle\
goto :eof

:build_windows
echo [INFO] Building for Windows...
call npm run tauri build -- --target x86_64-pc-windows-msvc
echo [SUCCESS] Build completed for Windows
goto :eof

:build_macos
echo [INFO] Building for macOS...
call npm run tauri build -- --target x86_64-apple-darwin
call npm run tauri build -- --target aarch64-apple-darwin
echo [SUCCESS] Build completed for macOS
goto :eof

:build_linux
echo [INFO] Building for Linux...
call npm run tauri build -- --target x86_64-unknown-linux-gnu
echo [SUCCESS] Build completed for Linux
goto :eof