# Stardew Valley Mod Manager

A modern, pixel-art styled desktop application for managing Stardew Valley mods, built with Tauri and TypeScript.

[🇹🇷 Türkçe README](README.tr.md)

## ✨ Features

- **🎮 Game Integration**: Auto-detects Stardew Valley installation
- **📦 Mod Management**: Install, activate, deactivate, and delete mods
- **🔍 SMAPI Support**: Automatically detects and works with SMAPI
- **🎨 Multiple Themes**: Choose from 4 pixel-art themes (Default, Barbie, Dark, Minecraft)
- **🌍 Multilingual**: Support for English and Turkish
- **⚡ Fast & Secure**: Built with Rust backend for performance and security
- **🖥️ Cross-Platform**: Works on Windows, macOS, and Linux

## 🚀 Installation

### Prerequisites

- **Stardew Valley** installed via Steam
- **SMAPI** (required for mods) - [Download from official site](https://smapi.io/)

### Download

1. Go to the [Releases](../../releases) page
2. Download the installer for your operating system:
   - **Windows**: `stardew-valley-mod-manager_x.x.x_x64-setup.exe`
   - **macOS**: `stardew-valley-mod-manager_x.x.x_x64.dmg`
   - **Linux**: `stardew-valley-mod-manager_x.x.x_amd64.AppImage`
3. Install and run the application

## 📖 How to Use

### First Launch

1. **Game Detection**: The app automatically detects your Stardew Valley installation
2. **SMAPI Check**: Verifies if SMAPI is installed and properly configured
3. **Mod Scanning**: Automatically scans for existing mods in your Mods folder

### Managing Mods

#### 📥 Installing Mods

1. Download mod files (`.zip` or folders) from [Nexus Mods](https://www.nexusmods.com/stardewvalley)
2. Extract mod folders to your `Stardew Valley/Mods/` directory
3. Click **Refresh** button in the app to scan for new mods
4. Mods will appear in the **Active Mods** section if valid

#### ✅ Activating/Deactivating Mods

- **Active Mods**: Located in `Mods/` folder - these run in-game
- **Deactivated Mods**: Located in `DeactivatedMods/` folder - these are disabled
- Click **Deactivate** or **Activate** buttons to move mods between states
- Changes take effect the next time you start the game

#### 🗑️ Deleting Mods

- Click **Delete** button on any mod
- Mods are moved to a temporary folder (recoverable)
- Confirm the deletion in the popup dialog

#### 📋 Mod Details

- Click **Details** button to view mod information
- See version, author, description, and file details
- View dependencies and changelog (when available)

### Navigation

#### 🏠 Dashboard
- Overview of your mod setup
- SMAPI status indicator
- Quick stats (mod count, conflicts)
- Quick launch buttons

#### 📦 Mods
- Complete mod management interface
- Filter mods by status: All, Enabled, Disabled
- Sort and search functionality
- Bulk operations

#### ⚠️ Conflicts
- Detect mod conflicts and compatibility issues
- Resolution suggestions
- Load order management

#### ⚙️ Settings
- Change language (English/Turkish)
- Switch themes
- Configure game paths
- **Profile management** (🚧 Work in Progress)

### Game Launch

- **Play with Mods**: Launches game through SMAPI with all active mods
- **Play Vanilla**: Launches the base game without mods
- **Open Folders**: Quick access to Mods and game directories

## 🎨 Themes

Choose from 4 beautiful pixel-art themes:

- **🌿 Default**: Classic Stardew Valley green theme
- **💖 Barbie**: Pink and purple color scheme
- **🌙 Dark**: Modern dark theme for night gaming
- **🟫 Minecraft**: Earthy tones inspired by Minecraft

## 🌍 Language Support

- **English** (EN)
- **Turkish** (TR)

Language can be changed in Settings. The interface updates immediately without restart.

## 🛠️ For Developers

### Building from Source

```bash
# Prerequisites
# - Node.js 16+
# - Rust
# - Tauri CLI

# Clone repository
git clone https://github.com/your-username/stardew-valley-mod-manager
cd stardew-valley-mod-manager

# Install dependencies
npm install

# Development mode
npm run tauri dev

# Build for production
npm run tauri build
```

### Tech Stack

- **Frontend**: TypeScript, Vite, HTML5, CSS3
- **Backend**: Rust, Tauri
- **UI**: Custom pixel-art CSS framework
- **Icons**: Custom pixel-art icon set

## 🚧 Known Issues & Roadmap

### Work in Progress
- **👤 Profile System**: Save and switch between different mod configurations

### Maybe in the Feature
- **🔄 Auto-Updates**: Automatic mod updates from Nexus Mods
- **🔗 Mod Store Integration**: Browse and install mods directly from the app

## 📋 System Requirements

- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 100MB for application + mod storage space
- **Stardew Valley**: Steam version recommended

## 🆘 Support

### Getting Help

1. **Check Documentation**: Review this README and in-app help
2. **Search Issues**: Look through [existing issues](../../issues)
3. **Create Issue**: Report bugs or request features
4. **Community**: Join discussions in [Discussions](../../discussions)

### Reporting Bugs

When reporting issues, please include:
- Your operating system
- App version
- Steps to reproduce
- Screenshots if applicable
- Error messages (check console logs)

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Credits

- **Stardew Valley**: ConcernedApe
- **SMAPI**: Pathoschild and contributors
- **Icons**: Custom pixel-art designs
- **Community**: Mod authors and testers

## 🔗 Links

- **Stardew Valley**: [Official Website](https://stardewvalley.net/)
- **SMAPI**: [Official Website](https://smapi.io/)
- **Nexus Mods**: [Stardew Valley Mods](https://www.nexusmods.com/stardewvalley)
- **Discord**: [Stardew Valley Community](https://discord.gg/stardewvalley)

---

Made with ❤️ for the Stardew Valley community