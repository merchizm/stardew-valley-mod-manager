#!/bin/bash

# Cross-platform build script for Stardew Valley Mod Manager
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if target is provided
if [ $# -eq 0 ]; then
    print_error "No target specified. Usage: ./build.sh [windows|macos|linux|all]"
    exit 1
fi

TARGET=$1

print_status "Starting build for target: $TARGET"

# Install required Rust targets
print_status "Ensuring required Rust targets are installed..."
case $TARGET in
    "windows")
        rustup target add x86_64-pc-windows-msvc
        ;;
    "macos")
        rustup target add x86_64-apple-darwin
        rustup target add aarch64-apple-darwin
        ;;
    "linux")
        rustup target add x86_64-unknown-linux-gnu
        ;;
    "all")
        rustup target add x86_64-pc-windows-msvc
        rustup target add x86_64-apple-darwin
        rustup target add aarch64-apple-darwin
        rustup target add x86_64-unknown-linux-gnu
        ;;
esac

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing Node.js dependencies..."
    npm install
fi

# Build frontend
print_status "Building frontend..."
npm run build

# Function to build for specific target
build_target() {
    local target=$1
    print_status "Building for $target..."
    
    case $target in
        "windows")
            npm run tauri build -- --target x86_64-pc-windows-msvc
            ;;
        "macos")
            npm run tauri build -- --target x86_64-apple-darwin
            npm run tauri build -- --target aarch64-apple-darwin
            ;;
        "linux")
            npm run tauri build -- --target x86_64-unknown-linux-gnu
            ;;
        *)
            print_error "Unknown target: $target"
            return 1
            ;;
    esac
    
    print_success "Build completed for $target"
}

# Build based on target
case $TARGET in
    "windows")
        build_target "windows"
        ;;
    "macos")
        build_target "macos"
        ;;
    "linux")
        build_target "linux"
        ;;
    "all")
        print_status "Building for all platforms..."
        build_target "windows"
        build_target "macos"
        build_target "linux"
        ;;
    *)
        print_error "Invalid target: $TARGET. Valid targets: windows, macos, linux, all"
        exit 1
        ;;
esac

print_success "Build process completed!"
print_status "Built files are located in src-tauri/target/release/bundle/"