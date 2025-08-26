use crate::{ModInfo, ModList};
use std::path::Path;
use tokio::fs;

/// Attempts to parse JSON with common fixes for malformed JSON files
fn parse_json_with_fixes(content: &str) -> Result<serde_json::Value, serde_json::Error> {
    // First, try parsing as-is
    match serde_json::from_str(content) {
        Ok(json) => return Ok(json),
        Err(_) => {} // Continue to try fixes
    }
    
    // Fix 1: Remove trailing commas
    let fixed_content = fix_trailing_commas(content);
    match serde_json::from_str(&fixed_content) {
        Ok(json) => return Ok(json),
        Err(_) => {} // Continue to try more fixes
    }
    
    // Fix 2: Fix unquoted keys (common issue)
    let fixed_content = fix_unquoted_keys(&fixed_content);
    match serde_json::from_str(&fixed_content) {
        Ok(json) => return Ok(json),
        Err(_) => {} // Continue to try more fixes
    }
    
    // Fix 3: Try with relaxed parsing (remove comments, fix encoding issues)
    let fixed_content = fix_json_comments(&fixed_content);
    match serde_json::from_str(&fixed_content) {
        Ok(json) => return Ok(json),
        Err(e) => return Err(e),
    }
}

/// Removes trailing commas from JSON
fn fix_trailing_commas(content: &str) -> String {
    let mut result = String::new();
    let mut chars = content.chars().peekable();
    let mut in_string = false;
    let mut escape_next = false;
    
    while let Some(ch) = chars.next() {
        if escape_next {
            result.push(ch);
            escape_next = false;
            continue;
        }
        
        match ch {
            '\\' if in_string => {
                result.push(ch);
                escape_next = true;
            }
            '"' => {
                result.push(ch);
                in_string = !in_string;
            }
            ',' if !in_string => {
                // Look ahead to see if this comma is followed by } or ]
                let mut peek_chars = chars.clone();
                let mut found_closing = false;
                
                while let Some(peek_ch) = peek_chars.next() {
                    match peek_ch {
                        ' ' | '\t' | '\n' | '\r' => continue,
                        '}' | ']' => {
                            found_closing = true;
                            break;
                        }
                        _ => break,
                    }
                }
                
                if !found_closing {
                    result.push(ch);
                }
                // If trailing comma found, skip it
            }
            _ => result.push(ch),
        }
    }
    
    result
}

/// Fixes common unquoted key issues
fn fix_unquoted_keys(content: &str) -> String {
    // Simple regex-like approach to fix unquoted keys
    let mut result = String::new();
    let mut chars = content.chars().peekable();
    let mut in_string = false;
    let mut escape_next = false;
    
    while let Some(ch) = chars.next() {
        if escape_next {
            result.push(ch);
            escape_next = false;
            continue;
        }
        
        match ch {
            '\\' if in_string => {
                result.push(ch);
                escape_next = true;
            }
            '"' => {
                result.push(ch);
                in_string = !in_string;
            }
            _ if !in_string => {
                // Look for potential unquoted keys
                if ch.is_alphabetic() || ch == '_' {
                    let mut key = String::new();
                    key.push(ch);
                    
                    // Collect the potential key
                    while let Some(&peek_ch) = chars.peek() {
                        if peek_ch.is_alphanumeric() || peek_ch == '_' {
                            key.push(chars.next().unwrap());
                        } else {
                            break;
                        }
                    }
                    
                    // Check if this is followed by a colon (indicating it's a key)
                    let mut peek_chars = chars.clone();
                    let mut found_colon = false;
                    
                    while let Some(peek_ch) = peek_chars.next() {
                        match peek_ch {
                            ' ' | '\t' | '\n' | '\r' => continue,
                            ':' => {
                                found_colon = true;
                                break;
                            }
                            _ => break,
                        }
                    }
                    
                    if found_colon {
                        result.push('"');
                        result.push_str(&key);
                        result.push('"');
                    } else {
                        result.push_str(&key);
                    }
                } else {
                    result.push(ch);
                }
            }
            _ => result.push(ch),
        }
    }
    
    result
}

/// Removes comments and fixes other common issues
fn fix_json_comments(content: &str) -> String {
    let mut result = String::new();
    let mut lines = content.lines();
    
    while let Some(line) = lines.next() {
        let trimmed = line.trim();
        
        // Skip comment lines
        if trimmed.starts_with("//") || trimmed.starts_with("/*") {
            continue;
        }
        
        // Remove inline comments
        let mut clean_line = String::new();
        let mut chars = line.chars().peekable();
        let mut in_string = false;
        let mut escape_next = false;
        
        while let Some(ch) = chars.next() {
            if escape_next {
                clean_line.push(ch);
                escape_next = false;
                continue;
            }
            
            match ch {
                '\\' if in_string => {
                    clean_line.push(ch);
                    escape_next = true;
                }
                '"' => {
                    clean_line.push(ch);
                    in_string = !in_string;
                }
                '/' if !in_string => {
                    if chars.peek() == Some(&'/') {
                        // Rest of line is a comment
                        break;
                    } else {
                        clean_line.push(ch);
                    }
                }
                _ => clean_line.push(ch),
            }
        }
        
        result.push_str(&clean_line);
        result.push('\n');
    }
    
    result
}

pub async fn scan_mods(game_path: &str) -> Result<ModList, Box<dyn std::error::Error>> {
    let mods_path = Path::new(game_path).join("Mods");
    let deactivated_mods_path = Path::new(game_path).join("DeactivatedMods");

    let mut mod_list = ModList {
        active: Vec::new(),
        deactivated: Vec::new(),
        invalid: Vec::new(),
    };

    // Scan active mods
    if mods_path.exists() {
        let mut entries = fs::read_dir(&mods_path).await?;
        while let Some(entry) = entries.next_entry().await? {
            if entry.file_type().await?.is_dir() {
                let folder_name = entry.file_name().to_string_lossy().to_string();
                let mod_path = entry.path();
                
                match read_mod_info(&mod_path).await {
                    Ok(Some(mod_info)) => {
                        eprintln!("✅ Successfully loaded mod: {}", folder_name);
                        mod_list.active.push(mod_info);
                    }
                    Ok(None) => {
                        // Invalid mod - no manifest
                        eprintln!("❌ No manifest found for mod: {}", folder_name);
                        mod_list.invalid.push(ModInfo {
                            name: folder_name.clone(),
                            version: None,
                            author: None,
                            description: Some("No manifest.json found".to_string()),
                            path: mod_path.to_string_lossy().to_string(),
                            folder_name,
                            has_manifest: false,
                            manifest_data: None,
                        });
                    }
                    Err(e) => {
                        // Invalid mod - corrupted manifest
                        eprintln!("🔥 Error reading mod {}: {}", folder_name, e);
                        let manifest_path = mod_path.join("manifest.json");
                        eprintln!("   Manifest path: {}", manifest_path.display());
                        eprintln!("   Manifest exists: {}", manifest_path.exists());
                        
                        mod_list.invalid.push(ModInfo {
                            name: folder_name.clone(),
                            version: None,
                            author: None,
                            description: Some(format!("Error reading manifest: {}", e)),
                            path: mod_path.to_string_lossy().to_string(),
                            folder_name,
                            has_manifest: false,
                            manifest_data: None,
                        });
                    }
                }
            }
        }
    }

    // Scan deactivated mods
    if deactivated_mods_path.exists() {
        let mut entries = fs::read_dir(&deactivated_mods_path).await?;
        while let Some(entry) = entries.next_entry().await? {
            if entry.file_type().await?.is_dir() {
                let folder_name = entry.file_name().to_string_lossy().to_string();
                let mod_path = entry.path();
                
                match read_mod_info(&mod_path).await {
                    Ok(Some(mod_info)) => {
                        mod_list.deactivated.push(mod_info);
                    }
                    Ok(None) => {
                        // Invalid mod - no manifest
                        mod_list.invalid.push(ModInfo {
                            name: folder_name.clone(),
                            version: None,
                            author: None,
                            description: Some("No manifest.json found".to_string()),
                            path: mod_path.to_string_lossy().to_string(),
                            folder_name,
                            has_manifest: false,
                            manifest_data: None,
                        });
                    }
                    Err(_) => {
                        // Invalid mod - corrupted manifest
                        mod_list.invalid.push(ModInfo {
                            name: folder_name.clone(),
                            version: None,
                            author: None,
                            description: Some("Corrupted manifest.json".to_string()),
                            path: mod_path.to_string_lossy().to_string(),
                            folder_name,
                            has_manifest: false,
                            manifest_data: None,
                        });
                    }
                }
            }
        }
    }

    Ok(mod_list)
}

async fn read_mod_info(mod_path: &Path) -> Result<Option<ModInfo>, Box<dyn std::error::Error>> {
    let manifest_path = mod_path.join("manifest.json");
    let mod_name = mod_path.file_name().and_then(|n| n.to_str()).unwrap_or("Unknown");
    
    eprintln!("🔍 Checking mod: {}", mod_name);
    eprintln!("   Path: {}", mod_path.display());
    eprintln!("   Manifest path: {}", manifest_path.display());
    
    if !manifest_path.exists() {
        eprintln!("   ❌ Manifest file does not exist");
        return Ok(None);
    }

    eprintln!("   📄 Reading manifest file...");
    let content = match fs::read_to_string(&manifest_path).await {
        Ok(mut content) => {
            eprintln!("   ✅ File read successfully ({} bytes)", content.len());
            
            if content.is_empty() {
                eprintln!("   🔥 File is empty!");
                return Err("Manifest file is empty".into());
            }
            
            // Check for BOM and remove it
            if content.starts_with('\u{FEFF}') {
                eprintln!("   🔧 Removing UTF-8 BOM");
                content = content.trim_start_matches('\u{FEFF}').to_string();
            }
            
            // Check for other invisible characters at the start
            let original_len = content.len();
            content = content.trim_start().to_string();
            if content.len() != original_len {
                eprintln!("   🔧 Removed {} leading whitespace/invisible characters", original_len - content.len());
            }
            
            // Show hex dump of first few bytes for debugging
            let first_bytes: Vec<u8> = content.bytes().take(20).collect();
            eprintln!("   🔍 First 20 bytes (hex): {:02x?}", first_bytes);
            eprintln!("   📝 First 200 chars: {}", &content.chars().take(200).collect::<String>());
            
            content
        }
        Err(e) => {
            eprintln!("   🔥 Failed to read file: {}", e);
            return Err(format!("Failed to read manifest file: {}", e).into());
        }
    };
    
    eprintln!("   🔄 Parsing JSON...");
    let manifest: serde_json::Value = match parse_json_with_fixes(&content) {
        Ok(json) => {
            eprintln!("   ✅ JSON parsed successfully");
            json
        }
        Err(e) => {
            eprintln!("   🔥 JSON parsing failed: {}", e);
            eprintln!("   📝 Content that failed to parse (length: {}): '{}'", content.len(), content);
            
            // Try alternative parsing approaches
            eprintln!("   🔧 Trying alternative parsing methods...");
            
            // Try reading raw bytes and converting differently
            let bytes = match tokio::fs::read(&manifest_path).await {
                Ok(bytes) => bytes,
                Err(e) => {
                    eprintln!("   🔥 Failed to read raw bytes: {}", e);
                    return Err(format!("Invalid JSON in manifest: {}", e).into());
                }
            };
            
            eprintln!("   📊 Raw file info:");
            eprintln!("      File size: {} bytes", bytes.len());
            eprintln!("      First 20 bytes: {:02x?}", &bytes[..std::cmp::min(20, bytes.len())]);
            
            // Try different encodings with fixes
            let content_utf8 = String::from_utf8_lossy(&bytes).to_string();
            if content_utf8 != content {
                eprintln!("   🔧 UTF-8 conversion differs from read_to_string");
                eprintln!("   📝 UTF-8 content: '{}'", content_utf8);
                
                match parse_json_with_fixes(&content_utf8) {
                    Ok(json) => {
                        eprintln!("   ✅ JSON parsed successfully with UTF-8 conversion and fixes!");
                        return Ok(Some(create_mod_info_from_manifest(json, mod_path)));
                    }
                    Err(e2) => {
                        eprintln!("   🔥 UTF-8 conversion with fixes also failed: {}", e2);
                    }
                }
            }
            
            return Err(format!("Invalid JSON in manifest: {}", e).into());
        }
    };

    Ok(Some(create_mod_info_from_manifest(manifest, mod_path)))
}

fn create_mod_info_from_manifest(manifest: serde_json::Value, mod_path: &Path) -> ModInfo {
    eprintln!("   📊 Extracting fields...");
    
    let name = manifest.get("Name")
        .and_then(|v| {
            eprintln!("   📌 Name field: {:?}", v);
            v.as_str()
        })
        .unwrap_or_else(|| {
            eprintln!("   ⚠️ No Name field found, using folder name");
            mod_path.file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("Unknown Mod")
        })
        .to_string();

    let version = manifest.get("Version")
        .and_then(|v| {
            eprintln!("   📌 Version field: {:?}", v);
            v.as_str()
        })
        .map(|s| s.to_string());

    let author = manifest.get("Author")
        .and_then(|v| {
            eprintln!("   📌 Author field: {:?}", v);
            v.as_str()
        })
        .map(|s| s.to_string());

    let description = manifest.get("Description")
        .and_then(|v| {
            eprintln!("   📌 Description field: {:?}", v);
            v.as_str()
        })
        .map(|s| s.to_string());
        
    eprintln!("   ✅ Mod info extracted: name='{}', version={:?}, author={:?}", 
        name, version, author);

    ModInfo {
        name,
        version,
        author,
        description,
        path: mod_path.to_string_lossy().to_string(),
        folder_name: mod_path.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("Unknown")
            .to_string(),
        has_manifest: true,
        manifest_data: Some(manifest),
    }
}

pub async fn move_mod_to_deactivated(mod_path: &str, game_path: &str) -> Result<bool, Box<dyn std::error::Error>> {
    let source = Path::new(mod_path);
    let mod_name = source.file_name()
        .ok_or("Invalid mod path")?
        .to_string_lossy();

    let deactivated_path = Path::new(game_path).join("DeactivatedMods");
    
    // Create DeactivatedMods directory if it doesn't exist
    if !deactivated_path.exists() {
        fs::create_dir_all(&deactivated_path).await?;
    }

    let mut target = deactivated_path.join(&*mod_name);
    let mut counter = 1;

    // Handle name conflicts
    while target.exists() {
        target = deactivated_path.join(format!("{}_{}", mod_name, counter));
        counter += 1;
    }

    fs::rename(source, target).await?;
    Ok(true)
}

pub async fn move_mod_to_active(mod_path: &str, game_path: &str) -> Result<bool, Box<dyn std::error::Error>> {
    let source = Path::new(mod_path);
    let mod_name = source.file_name()
        .ok_or("Invalid mod path")?
        .to_string_lossy();

    let active_path = Path::new(game_path).join("Mods");
    let mut target = active_path.join(&*mod_name);
    let mut counter = 1;

    // Handle name conflicts
    while target.exists() {
        target = active_path.join(format!("{}_{}", mod_name, counter));
        counter += 1;
    }

    fs::rename(source, target).await?;
    Ok(true)
}

pub async fn delete_mod(mod_path: &str) -> Result<bool, Box<dyn std::error::Error>> {
    let source = Path::new(mod_path);
    let mod_name = source.file_name()
        .ok_or("Invalid mod path")?
        .to_string_lossy();

    // Create trash directory in temp folder
    let trash_path = std::env::temp_dir().join("StardewModManager_Trash");
    if !trash_path.exists() {
        fs::create_dir_all(&trash_path).await?;
    }

    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)?
        .as_secs();
    
    let target = trash_path.join(format!("{}_{}", mod_name, timestamp));
    fs::rename(source, target).await?;
    
    Ok(true)
}