use tauri_plugin_sql::{DbPool, DbPoolConnection};
use serde_json::Value as JsonValue;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_sql::Builder::default().build())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      
      // Initialize the database
      let app_handle = app.handle();
      tauri::async_runtime::spawn(async move {
        if let Err(e) = initialize_database(&app_handle).await {
          eprintln!("Failed to initialize database: {}", e);
        }
      });
      
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      sqlite_health,
      sqlite_list,
      sqlite_get,
      sqlite_put,
      sqlite_delete,
      sqlite_enqueue_outbox
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

async fn initialize_database(app_handle: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let db = DbPool::connect(app_handle, "sqlite:kotacom-business-suite.db").await?;
    
    // Create tables if they don't exist
    db.execute(
        "CREATE TABLE IF NOT EXISTS outbox (
            id TEXT PRIMARY KEY,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            mutation_type TEXT NOT NULL,
            payload TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT,
            synced_at TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            tenant_id TEXT NOT NULL
        )", 
        []
    ).await?;
    
    // Create other tables as needed
    db.execute(
        "CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            name TEXT NOT NULL,
            category TEXT,
            type TEXT,
            status TEXT NOT NULL,
            sync_status TEXT,
            updated_at TEXT
        )", 
        []
    ).await?;
    
    db.execute(
        "CREATE TABLE IF NOT EXISTS customers (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            name TEXT NOT NULL,
            phone TEXT,
            city TEXT,
            status TEXT NOT NULL,
            sync_status TEXT,
            updated_at TEXT
        )", 
        []
    ).await?;
    
    db.execute(
        "CREATE TABLE IF NOT EXISTS sales_orders (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            code TEXT NOT NULL,
            customer_name TEXT,
            date TEXT NOT NULL,
            status TEXT NOT NULL,
            sync_status TEXT,
            updated_at TEXT
        )", 
        []
    ).await?;
    
    Ok(())
}

#[tauri::command]
async fn sqlite_health() -> Result<String, String> {
    Ok("Data lokal desktop siap".to_string())
}

#[tauri::command]
async fn sqlite_list(app_handle: tauri::AppHandle, table: &str) -> Result<Vec<JsonValue>, String> {
    let db = DbPool::connect(&app_handle, "sqlite:kotacom-business-suite.db")
        .await
        .map_err(|e| format!("Failed to connect to database: {}", e))?;
    
    let query = format!("SELECT * FROM {}", table);
    let rows = db
        .select(query, [])
        .await
        .map_err(|e| format!("Failed to query table {}: {}", table, e))?;
    
    let mut result = Vec::new();
    for row in rows {
        let json_value = serde_json::to_value(row)
            .map_err(|e| format!("Failed to convert row to JSON: {}", e))?;
        result.push(json_value);
    }
    
    Ok(result)
}

#[tauri::command]
async fn sqlite_get(app_handle: tauri::AppHandle, table: &str, id: &str) -> Result<Option<JsonValue>, String> {
    let db = DbPool::connect(&app_handle, "sqlite:kotacom-business-suite.db")
        .await
        .map_err(|e| format!("Failed to connect to database: {}", e))?;
    
    let query = format!("SELECT * FROM {} WHERE id = $1", table);
    let rows = db
        .select(query, &[id])
        .await
        .map_err(|e| format!("Failed to query table {}: {}", table, e))?;
    
    if let Some(row) = rows.into_iter().next() {
        let json_value = serde_json::to_value(row)
            .map_err(|e| format!("Failed to convert row to JSON: {}", e))?;
        Ok(Some(json_value))
    } else {
        Ok(None)
    }
}

#[tauri::command]
async fn sqlite_put(app_handle: tauri::AppHandle, table: &str, record: JsonValue) -> Result<(), String> {
    let db = DbPool::connect(&app_handle, "sqlite:kotacom-business-suite.db")
        .await
        .map_err(|e| format!("Failed to connect to database: {}", e))?;
    
    // For simplicity, we're assuming the record is a JSON object with an "id" field
    // In a real implementation, you'd want to handle this more robustly
    let id = record.get("id")
        .and_then(|v| v.as_str())
        .ok_or("Record must contain an 'id' field")?;
    
    // Convert the record to a format suitable for insertion
    // This is a simplified approach - a real implementation would need to handle
    // the conversion more carefully
    let record_str = serde_json::to_string(&record)
        .map_err(|e| format!("Failed to serialize record: {}", e))?;
    
    let query = format!("INSERT OR REPLACE INTO {} (id, data) VALUES ($1, $2)", table);
    db.execute(query, &[id, &record_str])
        .await
        .map_err(|e| format!("Failed to insert record into table {}: {}", table, e))?;
    
    Ok(())
}

#[tauri::command]
async fn sqlite_delete(app_handle: tauri::AppHandle, table: &str, id: &str) -> Result<(), String> {
    let db = DbPool::connect(&app_handle, "sqlite:kotacom-business-suite.db")
        .await
        .map_err(|e| format!("Failed to connect to database: {}", e))?;
    
    let query = format!("DELETE FROM {} WHERE id = $1", table);
    db.execute(query, &[id])
        .await
        .map_err(|e| format!("Failed to delete record from table {}: {}", table, e))?;
    
    Ok(())
}

#[tauri::command]
async fn sqlite_enqueue_outbox(app_handle: tauri::AppHandle, item: JsonValue) -> Result<(), String> {
    let db = DbPool::connect(&app_handle, "sqlite:kotacom-business-suite.db")
        .await
        .map_err(|e| format!("Failed to connect to database: {}", e))?;
    
    // Extract fields from the JSON item
    let id = item.get("id").and_then(|v| v.as_str()).ok_or("Missing 'id' field")?;
    let entity_type = item.get("entityType").and_then(|v| v.as_str()).ok_or("Missing 'entityType' field")?;
    let entity_id = item.get("entityId").and_then(|v| v.as_str()).ok_or("Missing 'entityId' field")?;
    let mutation_type = item.get("mutationType").and_then(|v| v.as_str()).ok_or("Missing 'mutation_type' field")?;
    let payload = serde_json::to_string(item.get("payload").unwrap_or(&serde_json::Value::Null))
        .map_err(|e| format!("Failed to serialize payload: {}", e))?;
    let created_at = item.get("createdAt").and_then(|v| v.as_str()).ok_or("Missing 'createdAt' field")?;
    let tenant_id = item.get("tenantId").and_then(|v| v.as_str()).ok_or("Missing 'tenantId' field")?;
    
    let query = "
        INSERT OR REPLACE INTO outbox 
        (id, entity_type, entity_id, mutation_type, payload, created_at, tenant_id) 
        VALUES ($1, $2, $3, $4, $5, $6, $7)
    ";
    
    db.execute(query, &[id, entity_type, entity_id, mutation_type, &payload, created_at, tenant_id])
        .await
        .map_err(|e| format!("Failed to enqueue outbox item: {}", e))?;
    
    Ok(())
}