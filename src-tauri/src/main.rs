// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::{AppHandle, Manager, State, Emitter, menu::{Menu, MenuItem, Submenu}};
use tokio::sync::Mutex;

mod commands;
mod game;
mod mods;
mod settings;
mod translations;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub language: String,
    pub theme: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            language: "tr".to_string(),
            theme: "default".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameInfo {
    pub game_path: String,
    pub smapi_path: Option<String>,
    pub has_smapi: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModInfo {
    pub name: String,
    pub version: Option<String>,
    pub author: Option<String>,
    pub description: Option<String>,
    pub path: String,
    pub folder_name: String,
    pub has_manifest: bool,
    pub manifest_data: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModList {
    pub active: Vec<ModInfo>,
    pub deactivated: Vec<ModInfo>,
    pub invalid: Vec<ModInfo>,
}

pub struct AppState {
    pub settings: Mutex<AppSettings>,
    pub translations: Mutex<HashMap<String, serde_json::Value>>,
    pub game_info: Mutex<Option<GameInfo>>,
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            settings: Mutex::new(AppSettings::default()),
            translations: Mutex::new(HashMap::new()),
            game_info: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_game_path,
            commands::scan_mods,
            commands::toggle_mod,
            commands::delete_mod,
            commands::start_game,
            commands::open_folder,
            commands::check_game_status,
            commands::change_language,
            commands::get_language,
            commands::change_theme,
            commands::get_theme,
            commands::load_settings,
            commands::save_settings
        ])
        .setup(|app| {
            let handle = app.handle();
            
            // Create and set menu
            if let Ok(menu) = create_menu(&handle) {
                let _ = app.set_menu(menu);
            }
            
            // Initialize settings synchronously
            tauri::async_runtime::block_on(async {
                if let Err(e) = initialize_app(&handle).await {
                    eprintln!("Failed to initialize app: {}", e);
                }
            });

            Ok(())
        })
        .on_menu_event(|app, event| {
            match event.id.as_ref() {
                "lang_tr" => {
                    let handle = app.app_handle().clone();
                    let window = app.get_webview_window("main");
                    tauri::async_runtime::spawn(async move {
                        let state: State<AppState> = handle.state();
                        if let Some(window) = window {
                            let _ = commands::change_language("tr".to_string(), handle.clone(), state, window).await;
                        }
                    });
                }
                "lang_en" => {
                    let handle = app.app_handle().clone();
                    let window = app.get_webview_window("main");
                    tauri::async_runtime::spawn(async move {
                        let state: State<AppState> = handle.state();
                        if let Some(window) = window {
                            let _ = commands::change_language("en".to_string(), handle.clone(), state, window).await;
                        }
                    });
                }
                "theme_default" => {
                    let handle = app.app_handle().clone();
                    let window = app.get_webview_window("main");
                    tauri::async_runtime::spawn(async move {
                        let state: State<AppState> = handle.state();
                        if let Some(window) = window {
                            let _ = commands::change_theme("default".to_string(), handle.clone(), state, window).await;
                        }
                    });
                }
                "theme_barbie" => {
                    let handle = app.app_handle().clone();
                    let window = app.get_webview_window("main");
                    tauri::async_runtime::spawn(async move {
                        let state: State<AppState> = handle.state();
                        if let Some(window) = window {
                            let _ = commands::change_theme("barbie".to_string(), handle.clone(), state, window).await;
                        }
                    });
                }
                "theme_dark" => {
                    let handle = app.app_handle().clone();
                    let window = app.get_webview_window("main");
                    tauri::async_runtime::spawn(async move {
                        let state: State<AppState> = handle.state();
                        if let Some(window) = window {
                            let _ = commands::change_theme("dark".to_string(), handle.clone(), state, window).await;
                        }
                    });
                }
                "theme_minecraft" => {
                    let handle = app.app_handle().clone();
                    let window = app.get_webview_window("main");
                    tauri::async_runtime::spawn(async move {
                        let state: State<AppState> = handle.state();
                        if let Some(window) = window {
                            let _ = commands::change_theme("minecraft".to_string(), handle.clone(), state, window).await;
                        }
                    });
                }
                "smapi_site" => {
                    use tauri_plugin_opener::OpenerExt;
                    let _ = app.app_handle().opener().open_url("https://smapi.io/", None::<&str>);
                }
                "stardew_wiki" => {
                    use tauri_plugin_opener::OpenerExt;
                    let _ = app.app_handle().opener().open_url("https://stardewvalleywiki.com/", None::<&str>);
                }
                "nexus_mods" => {
                    use tauri_plugin_opener::OpenerExt;
                    let _ = app.app_handle().opener().open_url("https://www.nexusmods.com/stardewvalley", None::<&str>);
                }
                "about" => {
                    // Emit event to show about dialog in frontend
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.emit("show-about-dialog", ());
                    }
                }
                _ => {}
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn create_menu(app_handle: &AppHandle) -> Result<Menu<tauri::Wry>, Box<dyn std::error::Error>> {
    let languages_menu = Submenu::with_items(app_handle, "Language", true, &[
        &MenuItem::with_id(app_handle, "lang_tr", "Türkçe", true, None::<&str>)?,
        &MenuItem::with_id(app_handle, "lang_en", "English", true, None::<&str>)?,
    ])?;
    
    let themes_menu = Submenu::with_items(app_handle, "Themes", true, &[
        &MenuItem::with_id(app_handle, "theme_default", "Default", true, None::<&str>)?,
        &MenuItem::with_id(app_handle, "theme_barbie", "Barbie", true, None::<&str>)?,
        &MenuItem::with_id(app_handle, "theme_dark", "Dark", true, None::<&str>)?,
        &MenuItem::with_id(app_handle, "theme_minecraft", "Minecraft", true, None::<&str>)?,
    ])?;
    
    let help_menu = Submenu::with_items(app_handle, "Help", true, &[
        &MenuItem::with_id(app_handle, "smapi_site", "SMAPI Official Site", true, None::<&str>)?,
        &MenuItem::with_id(app_handle, "stardew_wiki", "Stardew Valley Wiki", true, None::<&str>)?,
        &MenuItem::with_id(app_handle, "nexus_mods", "Nexus Mods", true, None::<&str>)?,
        &MenuItem::with_id(app_handle, "about", "About", true, None::<&str>)?,
    ])?;
    
    let menu = Menu::with_items(app_handle, &[
        &languages_menu,
        &themes_menu,
        &help_menu,
    ])?;
    
    Ok(menu)
}

async fn initialize_app(app_handle: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let state: State<AppState> = app_handle.state();
    
    // Load settings
    let settings = settings::load_app_settings(app_handle).await?;
    *state.settings.lock().await = settings.clone();
    
    // Load translations
    translations::load_translations_for_language(&settings.language, app_handle, &state).await?;
    
    // Find game path
    match game::find_steam_game_path().await {
        Ok(game_info) => {
            eprintln!("Found game at: {}", game_info.game_path);
            eprintln!("SMAPI installed: {}", game_info.has_smapi);
            *state.game_info.lock().await = Some(game_info);
        }
        Err(e) => {
            eprintln!("Failed to find game path: {}", e);
        }
    }
    
    Ok(())
}