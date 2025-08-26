use crate::{AppSettings, AppState};
use std::path::PathBuf;
use tauri::{AppHandle};
use tauri::path::BaseDirectory;
use tauri::Manager;
use tokio::fs;

pub async fn get_settings_path(app_handle: &AppHandle) -> Result<PathBuf, Box<dyn std::error::Error>> {
    // AppLocalData/stardew_mod_manager_settings.json
    let path = app_handle
        .path()
        .resolve("stardew_mod_manager_settings.json", BaseDirectory::AppLocalData)?;

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).await?;
    }
    Ok(path)
}

pub async fn load_app_settings(app_handle: &AppHandle) -> Result<AppSettings, Box<dyn std::error::Error>> {
    let settings_path = get_settings_path(app_handle).await?;

    if fs::try_exists(&settings_path).await? {
        let content = fs::read_to_string(&settings_path).await?;
        let settings: AppSettings = serde_json::from_str(&content)?;
        Ok(settings)
    } else {
        let default_settings = AppSettings::default();
        save_settings_to_file(app_handle, &default_settings).await?;
        Ok(default_settings)
    }
}

pub async fn save_app_settings(
    app_handle: &AppHandle,
    state: &tauri::State<'_, AppState>,
) -> Result<(), Box<dyn std::error::Error>> {
    let settings = state.settings.lock().await;
    save_settings_to_file(app_handle, &*settings).await
}

async fn save_settings_to_file(
    app_handle: &AppHandle,
    settings: &AppSettings,
) -> Result<(), Box<dyn std::error::Error>> {
    let settings_path = get_settings_path(app_handle).await?;
    let content = serde_json::to_string_pretty(settings)?;
    fs::write(&settings_path, content).await?;
    Ok(())
}
