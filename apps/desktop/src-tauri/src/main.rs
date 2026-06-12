// Prevents additional console window on Windows in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

// Health check command for desktop runtime detection
#[tauri::command]
async fn sqlite_health() -> Result<String, String> {
    Ok("Data lokal desktop siap".to_string())
}

// Placeholder for future print command
#[tauri::command]
async fn print_receipt(html_content: String) -> Result<String, String> {
    // TODO: Implement native print dialog
    // For now, return not implemented message
    Err(format!("Print not yet implemented. Content length: {}", html_content.len()))
}

// Placeholder for future file operations
#[tauri::command]
async fn export_to_file(filename: String, content: String) -> Result<String, String> {
    // TODO: Implement native file save dialog
    // For now, return not implemented message
    Err(format!("Export not yet implemented. File: {}, Size: {}", filename, content.len()))
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .plugin(
            tauri_plugin_sql::Builder::new()
                .add_migrations(
                    "sqlite:vitpos.db",
                    vec![
                        // Initial schema will be added when SQLite adapter is implemented
                    ],
                )
                .build(),
        )
        .setup(|app| {
            #[cfg(desktop)]
            app.handle().plugin(tauri_plugin_updater::Builder::new().build())?;

            #[cfg(debug_assertions)]
            {
                let window = app.handle().get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            sqlite_health,
            print_receipt,
            export_to_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
