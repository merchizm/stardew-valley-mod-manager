use crate::{AppSettings, AppState};
use serde_json::Value;
use std::collections::HashMap;
use std::path::PathBuf;
use tauri::path::BaseDirectory;
use tauri::AppHandle;
use tauri::Manager;
use tokio::fs;

fn flatten_json(value: &Value, prefix: &str, out: &mut HashMap<String, Value>) {
    match value {
        Value::Object(map) => {
            for (k, v) in map {
                let key = if prefix.is_empty() {
                    k.clone()
                } else {
                    format!("{prefix}.{k}")
                };
                flatten_json(v, &key, out);
            }
        }
        Value::Array(arr) => {
            for (i, v) in arr.iter().enumerate() {
                let key = format!("{prefix}[{i}]");
                flatten_json(v, &key, out);
            }
        }
        // String, Number, Bool, Null -> store as Value
        _ => {
            out.insert(prefix.to_string(), value.clone());
        }
    }
}

pub async fn load_translations_for_language(
    language: &str,
    app_handle: &AppHandle,
    state: &tauri::State<'_, AppState>,
) -> anyhow::Result<()> {
    // resources/translations/<lang>.json
    let mut p: PathBuf = app_handle
        .path()
        .resolve("translations", BaseDirectory::Resource)?;
    p.push(format!("{language}.json"));

    eprintln!("Attempting to load translations from: {}", p.display());

    let json_str = fs::read_to_string(&p).await?;
    let root: Value = serde_json::from_str(&json_str)?;

    // Dot-notation ile düzleştir
    let mut flat: HashMap<String, Value> = HashMap::new();
    flatten_json(&root, "", &mut flat);

    eprintln!("Loaded {} translation keys", flat.len());
    
    // Debug: print first 10 keys
    let first_keys: Vec<&String> = flat.keys().take(10).collect();
    eprintln!("First 10 keys: {:?}", first_keys);
    
    // Check specific keys
    eprintln!("app.header exists: {}", flat.contains_key("app.header"));
    eprintln!("mods.refresh exists: {}", flat.contains_key("mods.refresh"));

    // AppState içindeki HashMap<String, Value>'ya yaz
    {
        let mut guard = state.translations.lock().await;
        *guard = flat;
    }

    Ok(())
}

