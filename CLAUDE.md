# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Tauri-based desktop application for managing Stardew Valley mods. The application was migrated from Electron to Tauri, combining a Rust backend with a TypeScript frontend built using Vite. It provides a pixel-art styled interface for managing SMAPI mods with support for Turkish and English languages.

Tauri version is 2.8.4.

## Development Commands

- **Start in development mode**: `npm run dev` (starts Vite dev server on port 1422)
- **Start Tauri development**: `npm run tauri dev` (starts both Vite and Tauri in dev mode)
- **Build the application**: `npm run build` (compiles TypeScript and creates Tauri distributables)
- **Preview production build**: `npm run preview` (preview the built app via Vite)
- **Install JavaScript dependencies**: `npm install`
- **Install Rust dependencies**: Handled automatically by `cargo`

### Prerequisites

- **Rust**: Install from [rustup.rs](https://rustup.rs/)
- **Node.js**: Required for frontend development
- **Tauri CLI**: Installed as dev dependency via `@tauri-apps/cli`

## Architecture

### Core Files Structure

#### Frontend (TypeScript + Vite)
- `index.html` - Main UI with extensive pixel-art styling
- `src/main.ts` - Main frontend application logic using Tauri APIs
- `src/styles.css` - Global stylesheet for pixel-art styling
- `vite.config.ts` - Vite configuration for Tauri development
- `tsconfig.json` - TypeScript configuration
- `package.json` - JavaScript/TypeScript dependencies and npm scripts

#### Backend (Rust)
- `src-tauri/src/main.rs` - Main Tauri application entry point
- `src-tauri/src/commands.rs` - Tauri command handlers (API endpoints)
- `src-tauri/src/game.rs` - Game detection and launching logic
- `src-tauri/src/mods.rs` - Mod scanning and management
- `src-tauri/src/settings.rs` - Settings persistence
- `src-tauri/src/translations.rs` - Translation loading
- `src-tauri/Cargo.toml` - Rust dependencies and configuration
- `src-tauri/tauri.conf.json` - Tauri application configuration

### Key Directories
- `locales/` - Internationalization files (tr.json, en.json)
- `themes/` - CSS themes (default, barbie, dark, minecraft)
- `src-tauri/icons/` - Application icons for different platforms

### Tauri Backend Architecture

The Rust backend provides these core modules:

#### Commands (`commands.rs`)
Tauri command handlers that act as API endpoints:
- `get_game_path` - Returns Steam game installation info
- `scan_mods` - Scans and categorizes all mods
- `toggle_mod` - Moves mods between active/deactivated folders
- `delete_mod` - Moves mods to trash
- `start_game` - Launches Stardew Valley through SMAPI
- `open_folder` - Opens mod directories in file explorer
- `check_game_status` - Monitors if game is running
- Language and theme management commands

#### Game Module (`game.rs`)
- `find_steam_game_path()` - Auto-detects Stardew Valley installation
- `start_game()` - Cross-platform game launching via SMAPI
- `check_game_running()` - Process monitoring for game state
- `open_folder()` - Cross-platform folder opening

#### Mods Module (`mods.rs`)
- `scan_mods()` - Recursively scans mod directories
- `read_mod_info()` - Parses manifest.json files
- `move_mod_to_active/deactivated()` - Handles mod activation
- `delete_mod()` - Safe mod deletion to temp directory

#### Settings Module (`settings.rs`)
- Persistent storage in Tauri app data directory
- JSON serialization of user preferences
- Automatic settings file creation and migration

### Frontend Integration

The TypeScript frontend uses Tauri's JavaScript API via `@tauri-apps/api`:
- `invoke()` - Call Rust backend commands with TypeScript interfaces
- `listen()` - Subscribe to backend events for real-time updates
- Strong typing for all command parameters and responses

Key integration points:
- Dynamic mod list updates via `scan_mods` command
- Real-time game status monitoring through polling
- Theme and language switching with immediate UI updates
- Type-safe communication between frontend and backend

## Security Model

Tauri provides enhanced security compared to Electron:
- **Rust Backend**: Memory-safe backend with no Node.js runtime
- **API Allowlist**: Explicit permission system for system access
- **CSP**: Content Security Policy enforcement
- **Command Validation**: Type-safe command parameters

Configured permissions:
- File system access (scoped to necessary directories)
- Process spawning (for game launching)
- Shell operations (for folder opening)

## Internationalization

The app supports Turkish (default) and English through:
- JSON translation files in `locales/` directory
- Dynamic language switching via Tauri commands
- UI text updates without restart
- Translation function `t(key)` with dot notation support

## Theme System

Four pixel-art themes available:
- **default**: Stardew Valley green theme
- **barbie**: Pink/purple theme  
- **dark**: Modern dark theme
- **minecraft**: Earth tones theme

Themes are implemented as CSS files with CSS custom properties for easy customization.

## Mod Management Features

The application handles three types of mods:
- **Active Mods**: Located in `{gamePath}/Mods/` with valid manifest.json
- **Deactivated Mods**: Located in `{gamePath}/DeactivatedMods/` 
- **Invalid Mods**: Folders without proper manifest.json files

Mod operations:
- **Activate/Deactivate**: Moves mods between folders
- **Delete**: Moves to temporary trash folder (recoverable)
- **Folder Access**: Opens mod directories in system file manager

## Development Notes

### Rust Development
- Uses `tokio` for async operations
- `serde` for JSON serialization
- Cross-platform path handling with `std::path`
- Error handling with `Result<T, E>` pattern

### Frontend Development  
- TypeScript with strict typing for better development experience
- Vite for fast development and hot module replacement
- Pixel-perfect styling with CSS animations and custom properties
- Event-driven architecture with Tauri events
- Responsive design with theme support
- Modern DOM manipulation and async/await patterns

### Cross-Platform Support
- Primary target: Windows (where Stardew Valley is most commonly modded)
- macOS and Linux support through Tauri
- Platform-specific game launching and folder operations

### Performance Benefits over Electron
- Smaller bundle size (no Node.js runtime)
- Lower memory usage (Rust backend)
- Better startup performance
- Enhanced security model