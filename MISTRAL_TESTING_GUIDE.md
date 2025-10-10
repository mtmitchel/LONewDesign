# Mistral Integration Testing Guide

## Testing the Complete Flow

### Step 1: Add Mistral API Key
1. Open the app: `npm run tauri:dev`
2. Navigate to **Settings** → **Providers**
3. Click on **Mistral AI** card
4. Enter your Mistral API key
5. Click **Test** button

**Expected Result:**
- Toast message: "Connection successful"
- Toast message: "Found X Mistral models"
- Console log: "Fetched Mistral models: [array of model IDs]"

### Step 2: Select Models
After successful API key test, you should see:
- A new section: **"Available Models"**
- Checkboxes for each available model (e.g., mistral-small-latest, mistral-large-latest, etc.)
- All models are **enabled by default**

**Actions:**
- Uncheck any models you don't want to use
- Check the models you want available in the chat dropdown
- Click **Done** to save

### Step 3: Use Models in Chat
1. Navigate to **Chat** module
2. Click on the **Model dropdown** in the header
3. You should see your enabled Mistral models listed (e.g., "Mistral Small Latest", "Mistral Large Latest")

**Expected:**
- Only checked/enabled models appear in the dropdown
- Model names are formatted nicely (e.g., "Mistral Small Latest" instead of "mistral-small-latest")

### Step 4: Test Streaming
1. Select a Mistral model from the dropdown
2. Type a message and send it
3. Watch the response stream in real-time

**Expected:**
- Assistant message appears with empty text
- Text fills in token-by-token as the stream arrives
- No errors in console
- Smooth streaming experience

## Troubleshooting

### Models Not Appearing After Test
**Symptoms:** API test succeeds but no "Available Models" section appears

**Debug Steps:**
1. Open browser console (F12)
2. Look for the log: `Fetched Mistral models: [...]`
3. Check if models array is empty
4. Check localStorage: `localStorage.getItem('provider-settings-v1')`

**Possible Causes:**
- API key lacks model list permissions
- Network timeout during model fetch
- Mistral API endpoint changed

### Models Not in Chat Dropdown
**Symptoms:** Models show in Settings but not in Chat

**Debug Steps:**
1. Open Settings → Providers → Mistral AI
2. Verify models are **checked** (enabled)
3. Check localStorage: should have `enabledModels: ["model-id-1", ...]`
4. Refresh the app

**Fix:**
- Re-enable models in Settings
- Click Done to save
- Refresh browser

### Streaming Not Working
**Symptoms:** Message sends but no response or errors

**Debug Steps:**
1. Open browser console
2. Look for errors mentioning "mistral_chat_stream"
3. Check Tauri console for Rust errors
4. Verify API key has chat permissions

**Possible Causes:**
- Invalid API key for chat endpoint
- Network issues
- Model ID mismatch

## Testing Checklist

- [ ] API key test succeeds
- [ ] Models fetched and displayed
- [ ] Can enable/disable individual models
- [ ] Settings persist after refresh
- [ ] Enabled models appear in Chat dropdown
- [ ] Can select Mistral model in Chat
- [ ] Message streaming works
- [ ] Multiple messages in conversation work
- [ ] Error handling works (try invalid API key)

## Console Commands for Debugging

```javascript
// Check store state
JSON.parse(localStorage.getItem('provider-settings-v1'))

// Check Mistral config
const state = JSON.parse(localStorage.getItem('provider-settings-v1'))
console.log(state.state.providers.mistral)

// Clear and reset
localStorage.removeItem('provider-settings-v1')
location.reload()
```

## Known Limitations

1. **Models must be fetched each time** - They're not cached, so you need to test the API key each session
2. **No model refresh button** - To update the model list, re-test the API key
3. **All models enabled by default** - First time setup enables all models
4. **No model metadata** - Only model IDs are shown, not descriptions or capabilities

## Next Steps

After successful testing, consider:
- Adding model descriptions/tooltips
- Caching available models
- Adding a "Refresh Models" button
- Supporting other providers (OpenAI, Anthropic, etc.)
- Adding model-specific settings (temperature, max_tokens)
