use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

const META_SENTINEL_PREFIX: &str = "\u{2063}\u{2063}\u{2063}";
const META_SENTINEL_SUFFIX: &str = "\u{2063}\u{2060}\u{2063}";
const ZERO_WIDTH_ZERO: char = '\u{200B}';
const ZERO_WIDTH_ONE: char = '\u{200C}';
const LEGACY_META_MARKER: &str = "__META__";

fn encode_zero_width_metadata(meta_json: &str) -> String {
    let mut encoded = String::with_capacity(
        META_SENTINEL_PREFIX.len() + meta_json.len() * 8 + META_SENTINEL_SUFFIX.len(),
    );
    encoded.push_str(META_SENTINEL_PREFIX);
    for byte in meta_json.as_bytes() {
        for bit in (0..8).rev() {
            let mask = 1 << bit;
            let ch = if (byte & mask) != 0 {
                ZERO_WIDTH_ONE
            } else {
                ZERO_WIDTH_ZERO
            };
            encoded.push(ch);
        }
    }
    encoded.push_str(META_SENTINEL_SUFFIX);
    encoded
}

fn decode_zero_width_metadata(encoded: &str) -> Option<String> {
    let mut bytes = Vec::with_capacity(encoded.len() / 8);
    let mut current: u8 = 0;
    let mut bit_count = 0;

    for ch in encoded.chars() {
        let bit = match ch {
            ZERO_WIDTH_ZERO => 0,
            ZERO_WIDTH_ONE => 1,
            _ => return None,
        };

        current = (current << 1) | bit;
        bit_count += 1;

        if bit_count == 8 {
            bytes.push(current);
            current = 0;
            bit_count = 0;
        }
    }

    if bit_count != 0 {
        return None;
    }

    String::from_utf8(bytes).ok()
}

fn extract_zero_width_metadata(notes: &str) -> Option<(Option<String>, serde_json::Value)> {
    let start = notes.rfind(META_SENTINEL_PREFIX)?;
    let after_prefix = &notes[start + META_SENTINEL_PREFIX.len()..];
    let end_offset = after_prefix.find(META_SENTINEL_SUFFIX)?;
    let encoded_segment = &after_prefix[..end_offset];
    let decoded = decode_zero_width_metadata(encoded_segment)?;
    let meta: serde_json::Value = serde_json::from_str(&decoded).ok()?;

    let body = notes[..start].trim_end();
    let body = if body.is_empty() {
        None
    } else {
        Some(body.to_string())
    };

    Some((body, meta))
}

fn extract_legacy_metadata(notes: &str) -> Option<(Option<String>, serde_json::Value)> {
    let marker_index = notes.rfind(LEGACY_META_MARKER)?;
    let body = notes[..marker_index].trim_end();
    let meta_str = notes[marker_index + LEGACY_META_MARKER.len()..].trim();
    if meta_str.is_empty() {
        return None;
    }

    let meta: serde_json::Value = serde_json::from_str(meta_str).ok()?;
    let body = if body.is_empty() {
        None
    } else {
        Some(body.to_string())
    };

    Some((body, meta))
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct TaskMetadata {
    pub title: String,            // CRUD Plan §6.3: Maps to Google title
    pub notes: Option<String>,    // CRUD Plan §6.g3: Body text in metadata JSON
    pub due_date: Option<String>, // CRUD Plan §6.1: UTC date YYYY-MM-DD
    pub priority: String,         // CRUD Plan §6.1: Enum 'high'|'medium'|'low'|'none'
    pub labels: String,           // CRUD Plan §6.1: JSON array sorted alphabetically
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

        let mut body = String::new();
        if let Some(notes) = &self.notes {
            let trimmed = notes.trim_end();
            if !trimmed.is_empty() {
                body.push_str(trimmed);
            }
        }

        let meta_encoded = serde_json::to_string(&meta_json).unwrap();
        let suffix = encode_zero_width_metadata(&meta_encoded);
        body.push_str(&suffix);

        let due_for_google = self.due_date.as_ref().map(|date| {
            if date.contains('T') {
                date.clone()
            } else {
                format!("{}T00:00:00.000Z", date)
            }
        });

        GoogleTaskPayload {
            title: self.title.clone(),
            notes: Some(body),
            due: due_for_google,
            status: self.status.clone(),
        }
    }

    /// Deserialize from Google Tasks API (parse meta JSON from notes)
    pub fn deserialize_from_google(payload: &GoogleTaskPayload) -> Self {
        let (notes, meta) = if let Some(notes_str) = &payload.notes {
            if let Some((body, meta)) = extract_zero_width_metadata(notes_str) {
                (body, meta)
            } else if let Some((body, meta)) = extract_legacy_metadata(notes_str) {
                (body, meta)
            } else {
                (Some(notes_str.clone()), serde_json::json!({}))
            }
        } else {
            (None, serde_json::json!({}))
        };

        let labels: Vec<String> = meta
            .get("labels")
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str())
                    .map(String::from)
                    .collect()
            })
            .unwrap_or_default();

        let due_date = payload.due.as_ref().map(|s| {
            if let Ok(dt) = chrono::DateTime::parse_from_rfc3339(s) {
                dt.date_naive().to_string()
            } else if s.len() >= 10 {
                s[..10].to_string()
            } else {
                s.clone()
            }
        });

        let status = if payload.status.trim().is_empty() {
            "needsAction".to_string()
        } else {
            payload.status.clone()
        };

        Self {
            title: payload.title.clone(),
            notes,
            due_date,
            priority: meta
                .get("priority")
                .and_then(|v| v.as_str())
                .unwrap_or("none")
                .to_string(),
            labels: serde_json::to_string(&labels).unwrap(),
            status,
            time_block: meta
                .get("time_block")
                .and_then(|v| v.as_str())
                .map(String::from),
        }
    }

    /// Compare fields and return dirty field names
    pub fn diff_fields(&self, other: &TaskMetadata) -> Vec<String> {
        let mut dirty = Vec::new();

        if self.title != other.title {
            dirty.push("title".to_string());
        }
        if self.notes != other.notes {
            dirty.push("notes".to_string());
        }
        if self.due_date != other.due_date {
            dirty.push("due_date".to_string());
        }
        if self.priority != other.priority {
            dirty.push("priority".to_string());
        }

        let self_labels: Vec<String> = serde_json::from_str(&self.labels).unwrap_or_default();
        let other_labels: Vec<String> = serde_json::from_str(&other.labels).unwrap_or_default();
        if self_labels != other_labels {
            dirty.push("labels".to_string());
        }

        if self.status != other.status {
            dirty.push("status".to_string());
        }
        if self.time_block != other.time_block {
            dirty.push("time_block".to_string());
        }

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
