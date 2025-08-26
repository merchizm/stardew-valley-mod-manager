use crate::{AppState, GameInfo, ModList, AppSettings};
use tauri::{AppHandle, State, WebviewWindow, Emitter};

#[tauri::command]
pub async fn get_game_path(
    state: State<'_, AppState>,
) -> Result<Option<GameInfo>, String> {
    let game_info = state.game_info.lock().await;
    Ok(game_info.clone())
}

#[tauri::command]
pub async fn scan_mods(
    state: State<'_, AppState>,
) -> Result<Option<ModList>, String> {
    let game_info = state.game_info.lock().await;
    if let Some(ref game_info) = *game_info {
        eprintln!("Scanning mods in: {}", game_info.game_path);
        match crate::mods::scan_mods(&game_info.game_path).await {
            Ok(mods) => {
                eprintln!("Found {} active, {} deactivated, {} invalid mods", 
                    mods.active.len(), mods.deactivated.len(), mods.invalid.len());
                Ok(Some(mods))
            },
            Err(e) => {
                eprintln!("Failed to scan mods: {}", e);
                Err(format!("Failed to scan mods: {}", e))
            },
        }
    } else {
        eprintln!("No game info available for mod scanning");
        Ok(None)
    }
}

#[tauri::command]
pub async fn toggle_mod(
    mod_path: String,
    is_active: bool,
    game_path: String,
    _state: State<'_, AppState>,
) -> Result<bool, String> {
    if is_active {
        crate::mods::move_mod_to_deactivated(&mod_path, &game_path).await
    } else {
        crate::mods::move_mod_to_active(&mod_path, &game_path).await
    }
    .map_err(|e| format!("Failed to toggle mod: {}", e))
}

#[tauri::command]
pub async fn delete_mod(
    mod_path: String,
) -> Result<bool, String> {
    crate::mods::delete_mod(&mod_path).await
        .map_err(|e| format!("Failed to delete mod: {}", e))
}

#[tauri::command]
pub async fn start_game(
    state: State<'_, AppState>,
    window: WebviewWindow,
) -> Result<bool, String> {
    let game_info = state.game_info.lock().await;
    if let Some(ref game_info) = *game_info {
        crate::game::start_game(game_info, &window).await
            .map_err(|e| format!("Failed to start game: {}", e))
    } else {
        Err("Game path not found".to_string())
    }
}

#[tauri::command]
pub async fn open_folder(
    folder_type: String,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let game_info = state.game_info.lock().await;
    if let Some(ref game_info) = *game_info {
        crate::game::open_folder(&folder_type, &game_info.game_path).await
            .map_err(|e| format!("Failed to open folder: {}", e))
    } else {
        Err("Game path not found".to_string())
    }
}

#[tauri::command]
pub async fn check_game_status() -> Result<bool, String> {
    crate::game::check_game_running().await
        .map_err(|e| format!("Failed to check game status: {}", e))
}

#[tauri::command]
pub async fn change_language(
    language: String,
    app_handle: AppHandle,
    state: State<'_, AppState>,
    window: WebviewWindow,
) -> Result<bool, String> {
    // Load translations
    if let Err(e) = crate::translations::load_translations_for_language(&language, &app_handle, &state).await {
        return Err(format!("Failed to load translations: {}", e));
    }
    
    // Update settings
    {
        let mut settings = state.settings.lock().await;
        settings.language = language.clone();
    }
    
    // Save settings
    if let Err(e) = crate::settings::save_app_settings(&app_handle, &state).await {
        eprintln!("Failed to save settings: {}", e);
    }
    
    // Emit language changed event
    let translations = state.translations.lock().await;
    let _ = window.emit("language-changed", serde_json::json!({
        "language": language,
        "translations": translations.clone()
    }));
    
    Ok(true)
}

#[tauri::command]
pub async fn get_language(
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    let settings = state.settings.lock().await;
    let translations = state.translations.lock().await;
    
    let current_translations = translations.clone();
    
    Ok(serde_json::json!({
        "language": settings.language,
        "translations": current_translations
    }))
}

#[tauri::command]
pub async fn change_theme(
    theme: String,
    app_handle: AppHandle,
    state: State<'_, AppState>,
    window: WebviewWindow,
) -> Result<bool, String> {
    // Update settings
    {
        let mut settings = state.settings.lock().await;
        settings.theme = theme.clone();
    }
    
    // Save settings
    if let Err(e) = crate::settings::save_app_settings(&app_handle, &state).await {
        eprintln!("Failed to save settings: {}", e);
        return Err(format!("Failed to save theme settings: {}", e));
    }
    
    // Emit theme changed event
    let _ = window.emit("theme-changed", serde_json::json!({
        "theme": theme
    }));
    
    Ok(true)
}

#[tauri::command]
pub async fn get_theme(
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    let settings = state.settings.lock().await;
    Ok(serde_json::json!({
        "theme": settings.theme
    }))
}

#[tauri::command]
pub async fn load_settings(
    app_handle: AppHandle,
    _state: State<'_, AppState>,
) -> Result<AppSettings, String> {
    crate::settings::load_app_settings(&app_handle).await
        .map_err(|e| format!("Failed to load settings: {}", e))
}

#[tauri::command]
pub async fn save_settings(
    app_handle: AppHandle,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    crate::settings::save_app_settings(&app_handle, &state).await
        .map_err(|e| format!("Failed to save settings: {}", e))
        .map(|_| true)
}