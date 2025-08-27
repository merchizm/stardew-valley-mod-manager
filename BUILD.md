# Build Instructions

This document explains how to build the Stardew Valley Mod Manager for different platforms.

## Prerequisites

### Required Tools
- **Node.js** (v16 or higher)
- **Rust** (latest stable)
- **Tauri CLI** (installed via npm)

### Platform-Specific Requirements

#### Windows
- **Visual Studio Build Tools** or **Visual Studio** with C++ support
- **Windows SDK**
- **WiX Toolset 3.x**: Download from [wixtoolset.org](https://wixtoolset.org/releases/) and install as administrator

#### macOS
- **Xcode Command Line Tools**: `xcode-select --install`
- **macOS SDK** (comes with Xcode)

#### Linux
- **Build essentials**: `sudo apt-get install build-essential`
- **WebKit dependencies**: `sudo apt-get install libwebkit2gtk-4.0-dev`
- **Additional libraries**: `sudo apt-get install libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev`

## Build Commands

### Quick Start
```bash
# Install dependencies
npm install

# Development mode
npm run tauri:dev

# Build for current platform
npm run tauri:build
```

### Cross-Platform Building

#### Individual Platforms
```bash
# Windows (MSI installer)
npm run build:windows

# macOS (DMG with custom background)
npm run build:macos

# Linux (AppImage, deb, rpm)
npm run build:linux

# All platforms (if supported)
npm run build:all
```

#### Using Build Scripts
```bash
# Unix/Linux/macOS
chmod +x scripts/build.sh
./scripts/build.sh [windows|macos|linux|all]

# Windows
scripts\build.bat [windows|macos|linux|all]
```

## Output Files

Built applications will be located in `src-tauri/target/release/bundle/`:

### Windows
- `msi/` - Windows installer (.msi)
- `nsis/` - NSIS installer (.exe) (if configured)

### macOS
- `dmg/` - macOS disk image (.dmg) with custom Stardew Valley background
- `macos/` - Application bundle (.app)

### Linux
- `appimage/` - Portable AppImage (.AppImage)
- `deb/` - Debian package (.deb)
- `rpm/` - RPM package (.rpm)

## Configuration

### Bundle Settings
Platform-specific settings are configured in `src-tauri/tauri.conf.json`:

- **Windows**: MSI installer with WiX toolset
- **macOS**: DMG with custom background image and app positioning
- **Linux**: AppImage, deb, and rpm packages for broad distribution support

### Custom Background
The macOS DMG uses `background.jpg` as the background image, positioned for optimal user experience.

## Troubleshooting

### Common Issues

1. **Missing Rust targets**: Add required targets with `rustup target add <target>`
2. **Build dependencies**: Ensure all platform-specific dependencies are installed
3. **Code signing**: For distribution, you'll need proper certificates (not included in this setup)

### Target Architectures
- **Windows**: `x86_64-pc-windows-msvc`
- **macOS**: `x86_64-apple-darwin`, `aarch64-apple-darwin` (Apple Silicon)
- **Linux**: `x86_64-unknown-linux-gnu`

## GitHub Actions (Recommended)

For cross-platform builds, use GitHub Actions which automatically builds for all platforms:

### Automatic Builds
- **On every push** to `main` or `tauri-version` branches
- **On pull requests** to `main`
- **Manual trigger** via GitHub UI

### Release Builds
- **Tag-based releases**: Push a tag like `v1.0.0` to trigger a release build
- **Manual releases**: Use GitHub Actions UI to trigger release workflow

### Workflow Files
- `.github/workflows/build.yml` - Builds on every push/PR
- `.github/workflows/release.yml` - Creates GitHub releases with binaries

## Distribution

The built applications are ready for distribution without app store submission:
- Windows: Share the .msi installer
- macOS: Share the .dmg file (users may need to allow unsigned apps)
- Linux: Share AppImage for universal compatibility, or deb/rpm for specific distros

## Development Notes

- **Hot reload** is available in development mode (`npm run tauri:dev`)
- **Frontend changes** are handled by Vite
- **Backend changes** require Rust recompilation
- **Cross-compilation** is handled by GitHub Actions for best results
- **Local builds** work best on the target platform (Windows builds on Windows, etc.)