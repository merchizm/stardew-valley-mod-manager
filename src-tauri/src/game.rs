use crate::GameInfo;
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::{WebviewWindow, Emitter};
use tokio::fs;
use std::env;

fn expand_path(path: &str) -> PathBuf {
    if path.starts_with("~/") {
        if let Some(home) = env::var("HOME").ok() {
            PathBuf::from(home).join(&path[2..])
        } else {
            PathBuf::from(path)
        }
    } else {
        PathBuf::from(path)
    }
}

pub async fn find_steam_game_path() -> Result<GameInfo, Box<dyn std::error::Error>> {
    let possible_paths = if cfg!(target_os = "windows") {
        vec![
            "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Stardew Valley",
            "C:\\Program Files\\Steam\\steamapps\\common\\Stardew Valley",
            "D:\\SteamLibrary\\steamapps\\common\\Stardew Valley",
            "E:\\SteamLibrary\\steamapps\\common\\Stardew Valley",
            "F:\\SteamLibrary\\steamapps\\common\\Stardew Valley",
        ]
    } else if cfg!(target_os = "macos") {
        vec![
            "~/Library/Application Support/Steam/steamapps/common/Stardew Valley",
            "/Users/Shared/Steam/steamapps/common/Stardew Valley",
        ]
    } else if cfg!(target_os = "linux") {
        vec![
            "~/.steam/steam/steamapps/common/Stardew Valley",
            "~/.local/share/Steam/steamapps/common/Stardew Valley",
            "/home/steam/.steam/steam/steamapps/common/Stardew Valley",
        ]
    } else {
        vec![]
    };

    for game_path in possible_paths {
        let path = expand_path(game_path);
        if path.exists() {
            let smapi_executable = if cfg!(target_os = "windows") {
                "StardewModdingAPI.exe"
            } else {
                "StardewModdingAPI"
            };
            
            let smapi_path = path.join(smapi_executable);
            let has_smapi = smapi_path.exists();
            
            return Ok(GameInfo {
                game_path: path.to_string_lossy().to_string(),
                smapi_path: if has_smapi {
                    Some(smapi_path.to_string_lossy().to_string())
                } else {
                    None
                },
                has_smapi,
            });
        }
    }

    Err("Game path not found".into())
}

pub async fn start_game(game_info: &GameInfo, window: &WebviewWindow) -> Result<bool, Box<dyn std::error::Error>> {
    if !game_info.has_smapi {
        let _ = window.emit("game-start-result", serde_json::json!({
            "success": false,
            "message": "Game start error",
            "error": "SMAPI not found"
        }));
        return Ok(false);
    }

    let smapi_path = game_info.smapi_path.as_ref().unwrap();
    
    // Start the game using tauri process spawn
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        match Command::new(smapi_path)
            .current_dir(&game_info.game_path)
            .spawn()
        {
            Ok(_) => {
                // Emit success event
                let _ = window.emit("game-start-result", serde_json::json!({
                    "success": true,
                    "message": "Game started successfully"
                }));

                // Minimize window after 1.5 seconds
                let window_clone = window.clone();
                tokio::spawn(async move {
                    tokio::time::sleep(tokio::time::Duration::from_millis(1500)).await;
                    let _ = window_clone.minimize();
                });

                Ok(true)
            }
            Err(e) => {
                let _ = window.emit("game-start-result", serde_json::json!({
                    "success": false,
                    "message": "Game start error",
                    "error": format!("Failed to start game: {}", e)
                }));
                Ok(false)
            }
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        // For non-Windows platforms, use Command to spawn the process
        match Command::new(smapi_path)
            .current_dir(&game_info.game_path)
            .spawn()
        {
            Ok(_) => {
                let _ = window.emit("game-start-result", serde_json::json!({
                    "success": true,
                    "message": "Game started successfully"
                }));

                let window_clone = window.clone();
                tokio::spawn(async move {
                    tokio::time::sleep(tokio::time::Duration::from_millis(1500)).await;
                    let _ = window_clone.minimize();
                });

                Ok(true)
            }
            Err(e) => {
                let _ = window.emit("game-start-result", serde_json::json!({
                    "success": false,
                    "message": "Game start error",
                    "error": format!("Failed to start game: {}", e)
                }));
                Ok(false)
            }
        }
    }
}

pub async fn check_game_running() -> Result<bool, Box<dyn std::error::Error>> {
    #[cfg(target_os = "windows")]
    {
        let output = Command::new("tasklist")
            .args(&["/FI", "IMAGENAME eq StardewModdingAPI.exe", "/FO", "CSV", "/NH"])
            .output()?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        Ok(stdout.contains("StardewModdingAPI.exe"))
    }

    #[cfg(not(target_os = "windows"))]
    {
        let output = Command::new("pgrep")
            .args(&["-x", "StardewModdingAPI"])
            .output()?;

        Ok(!output.stdout.is_empty())
    }
}

pub async fn open_folder(folder_type: &str, game_path: &str) -> Result<bool, Box<dyn std::error::Error>> {
    let folder_path = match folder_type {
        "mods" => PathBuf::from(game_path).join("Mods"),
        "deactivated" => {
            let path = PathBuf::from(game_path).join("DeactivatedMods");
            // Create directory if it doesn't exist
            if !path.exists() {
                fs::create_dir_all(&path).await?;
            }
            path
        }
        _ => return Err("Invalid folder type".into()),
    };

    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(&["/C", "start", "", &folder_path.to_string_lossy()])
            .spawn()?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&folder_path)
            .spawn()?;
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&folder_path)
            .spawn()?;
    }

    Ok(true)
}