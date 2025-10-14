/**
 * Shared metadata normalization and hash calculation for task metadata
 * This module ensures consistent metadata handling between frontend and backend
 */
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::str::FromStr;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Priority {
    High,
    Medium,
    Low,
    None,
}

impl FromStr for Priority {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "high" => Ok(Priority::High),
            "medium" => Ok(Priority::Medium),
            "low" => Ok(Priority::Low),
            "none" | "" => Ok(Priority::None),
            _ => Ok(Priority::None), // Fallback to None for invalid values
        }
    }
}

impl ToString for Priority {
    fn to_string(&self) -> String {
        match self {
            Priority::High => "high".to_string(),
            Priority::Medium => "medium".to_string(),
            Priority::Low => "low".to_string(),
            Priority::None => "none".to_string(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Label {
    pub name: String,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TaskMetadata {
    pub title: String,
    pub priority: Priority,
    pub labels: Vec<Label>,
    pub due_date: Option<String>, // YYYY-MM-DD format
    pub status: String,           // 'needsAction' or 'completed'
    pub notes: Option<String>,
    pub time_block: Option<String>,
}

/// Normalize priority - validate and provide fallback
pub fn normalize_priority(priority: &str) -> Priority {
    Priority::from_str(priority).unwrap_or(Priority::None)
}

/// Normalize labels - deduplicate, sort by name, validate
pub fn normalize_labels(labels: Vec<Label>) -> Vec<Label> {
    let mut seen = std::collections::HashSet::new();
    let mut valid_labels = Vec::new();

    for label in labels {
        let name_lower = label.name.trim().to_lowercase();
        if !name_lower.is_empty() && !seen.contains(&name_lower) {
            seen.insert(name_lower);
            valid_labels.push(Label {
                name: label.name.trim().to_string(),
                color: label.color,
            });
        }
    }

    // Sort by name for deterministic ordering
    valid_labels.sort_by(|a, b| a.name.cmp(&b.name));
    valid_labels
}

/// Normalize due date - validate YYYY-MM-DD format
pub fn normalize_due_date(due_date: Option<&str>) -> Option<String> {
    let due_str = due_date?;

    if due_str.is_empty() {
        return None;
    }

    // Validate YYYY-MM-DD format
    if due_str.len() != 10 {
        return None;
    }

    let parts: Vec<&str> = due_str.split('-').collect();
    if parts.len() != 3 {
        return None;
    }

    // Validate each part is numeric
    if parts[0].len() != 4 || parts[1].len() != 2 || parts[2].len() != 2 {
        return None;
    }

    // Validate it's a real date using chrono
    use chrono::NaiveDate;
    if NaiveDate::parse_from_str(due_str, "%Y-%m-%d").is_err() {
        return None;
    }

    Some(due_str.to_string())
}

/// Calculate metadata hash for change detection
/// Uses SHA-256 with deterministic JSON serialization
pub fn calculate_metadata_hash(metadata: &TaskMetadata) -> String {
    // Create ordered JSON to ensure deterministic hash
    let ordered = serde_json::json!({
        "title": metadata.title,
        "priority": metadata.priority.to_string(),
        "labels": metadata.labels,
        "due_date": metadata.due_date,
        "status": metadata.status,
        "notes": metadata.notes,
        "time_block": metadata.time_block,
    });

    let json_string = ordered.to_string();
    let mut hasher = Sha256::new();
    hasher.update(json_string.as_bytes());
    let result = hasher.finalize();

    format!("{:x}", result)
}

#[derive(Debug, Serialize, Deserialize)]
struct GoogleTaskNotes {
    meta: GoogleTaskMeta,
    body: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct GoogleTaskMeta {
    #[serde(skip_serializing_if = "Option::is_none")]
    priority: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    labels: Option<Vec<Label>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    time_block: Option<String>,
}

/// Serialize metadata for Google Tasks API
/// Encodes custom fields (priority, labels, time_block) into notes field as JSON
pub fn serialize_for_google(metadata: &TaskMetadata) -> serde_json::Value {
    let mut google_task = serde_json::json!({
        "title": metadata.title,
        "status": metadata.status,
    });

    // Convert due_date to RFC3339 format for Google
    if let Some(due_date) = &metadata.due_date {
        google_task["due"] = serde_json::json!(format!("{}T00:00:00.000Z", due_date));
    }

    // Encode custom metadata in notes
    let custom_meta = GoogleTaskMeta {
        priority: if metadata.priority != Priority::None {
            Some(metadata.priority.to_string())
        } else {
            None
        },
        labels: if !metadata.labels.is_empty() {
            Some(metadata.labels.clone())
        } else {
            None
        },
        time_block: metadata.time_block.clone(),
    };

    let notes_payload = GoogleTaskNotes {
        meta: custom_meta,
        body: metadata.notes.clone().unwrap_or_default(),
    };

    if let Ok(notes_json) = serde_json::to_string(&notes_payload) {
        google_task["notes"] = serde_json::json!(notes_json);
    }

    google_task
}

/// Deserialize metadata from Google Tasks API
/// Extracts custom fields from notes JSON
pub fn deserialize_from_google(google_task: &serde_json::Value) -> TaskMetadata {
    let title = google_task["title"]
        .as_str()
        .unwrap_or("Untitled")
        .to_string();

    let status = google_task["status"]
        .as_str()
        .map(|s| {
            if s == "completed" {
                "completed"
            } else {
                "needsAction"
            }
        })
        .unwrap_or("needsAction")
        .to_string();

    // Parse due date from RFC3339 to YYYY-MM-DD
    let due_date = google_task["due"].as_str().and_then(|due_str| {
        if let Ok(dt) = chrono::DateTime::parse_from_rfc3339(due_str) {
            Some(dt.format("%Y-%m-%d").to_string())
        } else {
            None
        }
    });

    let mut metadata = TaskMetadata {
        title,
        priority: Priority::None,
        labels: Vec::new(),
        due_date,
        status,
        notes: None,
        time_block: None,
    };

    // Parse custom metadata from notes
    if let Some(notes_str) = google_task["notes"].as_str() {
        if let Ok(notes_payload) = serde_json::from_str::<GoogleTaskNotes>(notes_str) {
            if let Some(priority) = notes_payload.meta.priority {
                metadata.priority = normalize_priority(&priority);
            }
            if let Some(labels) = notes_payload.meta.labels {
                metadata.labels = normalize_labels(labels);
            }
            metadata.time_block = notes_payload.meta.time_block;
            if !notes_payload.body.is_empty() {
                metadata.notes = Some(notes_payload.body);
            }
        } else {
            // If notes aren't JSON, treat as plain text
            metadata.notes = Some(notes_str.to_string());
        }
    }

    metadata
}

#[cfg(test)]
mod tests {
    use super::*;
    use proptest::prelude::*;
    use std::collections::HashSet;

    fn arb_nonempty_ascii_string(max_len: usize) -> impl Strategy<Value = String> {
        prop::collection::vec(prop::char::range('a', 'z'), 1..=max_len)
            .prop_map(|chars| chars.into_iter().collect::<String>())
    }

    fn arb_priority() -> impl Strategy<Value = Priority> {
        prop_oneof![
            Just(Priority::High),
            Just(Priority::Medium),
            Just(Priority::Low),
            Just(Priority::None),
        ]
    }

    fn arb_label_color() -> impl Strategy<Value = String> {
        prop_oneof![
            Just("#FF0000".to_string()),
            Just("#00FF00".to_string()),
            Just("#0000FF".to_string()),
            Just("#FFA500".to_string()),
            Just("#800080".to_string()),
        ]
    }

    fn arb_label() -> impl Strategy<Value = Label> {
        (arb_nonempty_ascii_string(12), arb_label_color())
            .prop_map(|(name, color)| Label { name, color })
    }

    fn arb_labels() -> impl Strategy<Value = Vec<Label>> {
        prop::collection::vec(arb_label(), 0..=4).prop_map(|candidates| {
            let mut seen = HashSet::new();
            let mut labels: Vec<Label> = Vec::new();

            for label in candidates {
                let key = label.name.to_lowercase();
                if seen.insert(key) {
                    labels.push(label);
                }
            }

            labels.sort_by(|a, b| a.name.cmp(&b.name));
            labels
        })
    }

    fn arb_due_date() -> impl Strategy<Value = Option<String>> {
        prop::option::of(
            (2020i32..=2035, 1u32..=12, 1u32..=28)
                .prop_map(|(y, m, d)| format!("{y:04}-{m:02}-{d:02}")),
        )
    }

    fn arb_status() -> impl Strategy<Value = String> {
        prop_oneof![
            Just("needsAction".to_string()),
            Just("completed".to_string()),
        ]
    }

    fn arb_optional_notes() -> impl Strategy<Value = Option<String>> {
        prop::option::of(arb_nonempty_ascii_string(32))
    }

    fn arb_optional_time_block() -> impl Strategy<Value = Option<String>> {
        prop::option::of(prop_oneof![
            Just("morning".to_string()),
            Just("afternoon".to_string()),
            Just("evening".to_string()),
            Just("focus".to_string()),
            Just("deep-work".to_string()),
        ])
    }

    fn arb_task_metadata() -> impl Strategy<Value = TaskMetadata> {
        (
            arb_nonempty_ascii_string(24),
            arb_priority(),
            arb_labels(),
            arb_due_date(),
            arb_status(),
            arb_optional_notes(),
            arb_optional_time_block(),
        )
            .prop_map(
                |(title, priority, labels, due_date, status, notes, time_block)| TaskMetadata {
                    title,
                    priority,
                    labels,
                    due_date,
                    status,
                    notes,
                    time_block,
                },
            )
    }

    #[test]
    fn test_normalize_priority() {
        assert_eq!(normalize_priority("high"), Priority::High);
        assert_eq!(normalize_priority("HIGH"), Priority::High);
        assert_eq!(normalize_priority("medium"), Priority::Medium);
        assert_eq!(normalize_priority("low"), Priority::Low);
        assert_eq!(normalize_priority("none"), Priority::None);
        assert_eq!(normalize_priority(""), Priority::None);
        assert_eq!(normalize_priority("invalid"), Priority::None);
    }

    #[test]
    fn test_normalize_labels() {
        let labels = vec![
            Label {
                name: "  Design  ".to_string(),
                color: "#FF0000".to_string(),
            },
            Label {
                name: "Bug".to_string(),
                color: "#00FF00".to_string(),
            },
            Label {
                name: "design".to_string(), // Duplicate (case-insensitive)
                color: "#0000FF".to_string(),
            },
        ];

        let normalized = normalize_labels(labels);
        assert_eq!(normalized.len(), 2);
        assert_eq!(normalized[0].name, "Bug"); // Sorted
        assert_eq!(normalized[1].name, "Design"); // Deduplicated and sorted
    }

    #[test]
    fn test_normalize_due_date() {
        assert_eq!(
            normalize_due_date(Some("2025-01-15")),
            Some("2025-01-15".to_string())
        );
        assert_eq!(normalize_due_date(Some("invalid")), None);
        assert_eq!(normalize_due_date(Some("2025-13-01")), None); // Invalid month
        assert_eq!(normalize_due_date(Some("")), None);
        assert_eq!(normalize_due_date(None), None);
    }

    #[test]
    fn test_calculate_metadata_hash_deterministic() {
        let metadata = TaskMetadata {
            title: "Test Task".to_string(),
            priority: Priority::High,
            labels: vec![Label {
                name: "Bug".to_string(),
                color: "#FF0000".to_string(),
            }],
            due_date: Some("2025-01-15".to_string()),
            status: "needsAction".to_string(),
            notes: Some("Test notes".to_string()),
            time_block: Some("morning".to_string()),
        };

        let hash1 = calculate_metadata_hash(&metadata);
        let hash2 = calculate_metadata_hash(&metadata);

        assert_eq!(hash1, hash2);
        assert_eq!(hash1.len(), 64); // SHA-256 produces 64 hex chars
    }

    #[test]
    fn test_serialize_deserialize_round_trip() {
        let original = TaskMetadata {
            title: "Test Task".to_string(),
            priority: Priority::High,
            labels: vec![
                Label {
                    name: "Bug".to_string(),
                    color: "#FF0000".to_string(),
                },
                Label {
                    name: "Urgent".to_string(),
                    color: "#00FF00".to_string(),
                },
            ],
            due_date: Some("2025-01-15".to_string()),
            status: "needsAction".to_string(),
            notes: Some("Test notes".to_string()),
            time_block: Some("morning".to_string()),
        };

        let serialized = serialize_for_google(&original);
        let deserialized = deserialize_from_google(&serialized);

        assert_eq!(original.title, deserialized.title);
        assert_eq!(original.priority, deserialized.priority);
        assert_eq!(original.labels, deserialized.labels);
        assert_eq!(original.due_date, deserialized.due_date);
        assert_eq!(original.status, deserialized.status);
        assert_eq!(original.notes, deserialized.notes);
        assert_eq!(original.time_block, deserialized.time_block);
    }

    proptest! {
        #[test]
        fn metadata_round_trip_preserves_fields(metadata in arb_task_metadata()) {
            let serialized = serialize_for_google(&metadata);
            let deserialized = deserialize_from_google(&serialized);

            prop_assert_eq!(metadata, deserialized);
        }

        #[test]
        fn metadata_hash_stable_on_round_trip(metadata in arb_task_metadata()) {
            let initial_hash = calculate_metadata_hash(&metadata);
            let round_tripped = deserialize_from_google(&serialize_for_google(&metadata));
            let round_trip_hash = calculate_metadata_hash(&round_tripped);

            prop_assert_eq!(initial_hash, round_trip_hash);
        }
    }
}
