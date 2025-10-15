use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct TaskMetadata {
    pub title: String,           // CRUD Plan §6.3: Maps to Google title
    pub notes: Option<String>,   // CRUD Plan §6.g3: Body text in metadata JSON
    pub due_date: Option<String>, // CRUD Plan §6.1: UTC date YYYY-MM-DD
    pub priority: String,         // CRUD Plan §6.1: Enum 'high'|'medium'|'low'|'none'
    pub labels: String,      // CRUD Plan §6.1: JSON array sorted alphabetically
    pub status: String,           // CRUD Plan §6.1: 'needsAction'|'completed'
    pub time_block: Option<String>,
}

impl TaskMetadata {
    /// Normalize metadata for consistent hashing
    pub fn normalize(&self) -> Self {
        let mut labels: Vec<String> = serde_json::from_str(&self.labels).unwrap_or_default();
        labels.sort();
        labels.dedup();

        Self {
            title: self.title.trim().to_string(),
            notes: self.notes.as_ref().map(|n| n.trim().to_string()),
            due_date: self.due_date.clone(),
            priority: self.priority.clone(),
            labels: serde_json::to_string(&labels).unwrap(),
            status: self.status.clone(),
            time_block: self.time_block.clone(),
        }
    }
    
    /// Compute deterministic SHA-256 hash
    pub fn compute_hash(&self) -> String {
        let normalized = self.normalize();
        let json = serde_json::to_string(&normalized).unwrap();
        let mut hasher = Sha256::new();
        hasher.update(json.as_bytes());
        format!("{:x}", hasher.finalize())
    }
    
    /// Serialize for Google Tasks API (encode metadata in notes JSON)
    /// CRUD Plan §6.3: Encode priority/labels/time_block into Google notes field
    pub fn serialize_for_google(&self) -> GoogleTaskPayload {
        let labels: Vec<String> = serde_json::from_str(&self.labels).unwrap_or_default();
        let meta_json = serde_json::json!({
            "priority": self.priority,
            "labels": labels,
            "time_block": self.time_block,
        });
        
        GoogleTaskPayload {
            title: self.title.clone(),
            notes: Some(serde_json::to_string(&meta_json).unwrap()),
            due: self.due_date.clone(),
            status: self.status.clone(),
        }
    }
    
    /// Deserialize from Google Tasks API (parse meta JSON from notes)
    pub fn deserialize_from_google(payload: &GoogleTaskPayload) -> Self {
        let (notes, meta) = if let Some(notes_str) = &payload.notes {
            if let Some(meta_start) = notes_str.find("__META__") {
                let body = notes_str[..meta_start].trim();
                let meta_json = &notes_str[meta_start + 8..].trim();
                
                let meta: serde_json::Value = serde_json::from_str(meta_json)
                    .unwrap_or(serde_json::json!({}));
                
                (Some(body.to_string()), meta)
            } else {
                (Some(notes_str.clone()), serde_json::json!({}))
            }
        } else {
            (None, serde_json::json!({}))
        };
        
        let labels: Vec<String> = meta.get("labels")
            .and_then(|v| v.as_array())
            .map(|arr| arr.iter()
                .filter_map(|v| v.as_str())
                .map(String::from)
                .collect())
            .unwrap_or_default();

        Self {
            title: payload.title.clone(),
            notes,
            due_date: payload.due.clone(),
            priority: meta.get("priority")
                .and_then(|v| v.as_str())
                .unwrap_or("none")
                .to_string(),
            labels: serde_json::to_string(&labels).unwrap(),
            status: payload.status.clone(),
            time_block: meta.get("time_block")
                .and_then(|v| v.as_str())
                .map(String::from),
        }
    }
    
    /// Compare fields and return dirty field names
    pub fn diff_fields(&self, other: &TaskMetadata) -> Vec<String> {
        let mut dirty = Vec::new();

        if self.title != other.title { dirty.push("title".to_string()); }
        if self.notes != other.notes { dirty.push("notes".to_string()); }
        if self.due_date != other.due_date { dirty.push("due_date".to_string()); }
        if self.priority != other.priority { dirty.push("priority".to_string()); }

        let self_labels: Vec<String> = serde_json::from_str(&self.labels).unwrap_or_default();
        let other_labels: Vec<String> = serde_json::from_str(&other.labels).unwrap_or_default();
        if self_labels != other_labels { dirty.push("labels".to_string()); }

        if self.status != other.status { dirty.push("status".to_string()); }
        if self.time_block != other.time_block { dirty.push("time_block".to_string()); }
        
        dirty
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GoogleTaskPayload {
    pub title: String,
    pub notes: Option<String>,
    pub due: Option<String>,
    pub status: String,
}