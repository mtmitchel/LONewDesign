//! OAuth token management for Google Workspace integration

use keyring::Entry;
use crate::sync::types::{
    GoogleOAuthTokens, GoogleWorkspaceState, GOOGLE_WORKSPACE_SERVICE, GOOGLE_WORKSPACE_ACCOUNT,
};

/// Retrieves OAuth tokens from system keyring
///
/// Returns the access token and optional refresh token stored by the frontend
pub async fn get_oauth_tokens() -> Result<GoogleOAuthTokens, String> {
    let entry =
        Entry::new(GOOGLE_WORKSPACE_SERVICE, GOOGLE_WORKSPACE_ACCOUNT).map_err(|e| {
            eprintln!("[sync_service] Failed to create keyring entry: {}", e);
            format!("Failed to create keyring entry: {}", e)
        })?;

    let password = entry.get_password().map_err(|e| {
        eprintln!("[sync_service] No OAuth tokens in keyring: {}", e);
        format!("No OAuth tokens found in keyring: {}", e)
    })?;

    eprintln!(
        "[sync_service] Retrieved {} bytes from keyring",
        password.len()
    );

    // Parse the full GoogleWorkspaceState that's stored by the frontend
    let state: GoogleWorkspaceState = serde_json::from_str(&password).map_err(|e| {
        eprintln!(
            "[sync_service] Failed to parse GoogleWorkspaceState: {} | Data: {}",
            e,
            &password[..100.min(password.len())]
        );
        format!("Failed to parse GoogleWorkspaceState: {}", e)
    })?;

    // Extract the token from account
    let account = state.account.ok_or_else(|| {
        eprintln!("[sync_service] No account in GoogleWorkspaceState");
        "No account in GoogleWorkspaceState".to_string()
    })?;

    eprintln!("[sync_service] Found account for: {}", account.email);

    // Convert FrontendToken to GoogleOAuthTokens
    let access_token = account.token.access_token.ok_or_else(|| {
        eprintln!("[sync_service] No access_token in account.token");
        "No access token available".to_string()
    })?;

    eprintln!(
        "[sync_service] Successfully extracted OAuth tokens (access_token length: {})",
        access_token.len()
    );

    Ok(GoogleOAuthTokens {
        access_token,
        refresh_token: account.token.refresh_token,
        expires_in: None,
        token_type: Some("Bearer".to_string()),
    })
}
