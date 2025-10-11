# Ollama Integration Test Playbook

> Updated 2025-10-10 – validates the local (Ollama) provider used by the Assistant and Chat modules.

## Prereqs
- Ollama running locally (`ollama serve`) on `http://127.0.0.1:11434`.
- At least one chat-capable model pulled (e.g., `ollama pull llama3:8b`).
- LibreOllama Desktop running in Tauri (`npm run tauri:dev` or `npm run tauri:dev:smart`).

## Checklist

### 1. Endpoint & Model Discovery
1. Open **Settings → Providers**.
2. Select **Ollama (Local)** and click **Test connection**.
3. Expect toasts `Connection successful` and `Found N local models`.
4. Verify the Model dropdown lists the models returned by `/api/tags`.

### 2. Assistant Routing
1. Ensure **Settings → Assistant → Model defaults** uses the Ollama provider + model.
2. Highlight text anywhere in the app, press `⌘/Ctrl+K`.
3. Run the **Proofread** writing tool:
   - Result should stream in the dialog.
   - `Replace` overwrites the original selection; `Insert` appends after it.
4. Submit natural-language capture (e.g., “dentist appointment on Friday 2pm”):
   - Toast should warn if confidence <60%; otherwise an event is created with parsed date/time.

### 3. Chat Streaming
1. In **Chat**, pick the Ollama model from the header dropdown.
2. Send a prompt; watch for token-by-token streaming.
3. Confirm conversation title auto-generates (or falls back cleanly).

### 4. Failure Handling
- Stop the Ollama server and re-run the connection test → expect warning toast.
- Try a model name that is not pulled locally → assistant/chat should surface the backend error gracefully.

## Debug Tips
```bash
# List local models
curl http://127.0.0.1:11434/api/tags | jq '.models[].name'

# Test chat endpoint directly
curl http://127.0.0.1:11434/api/chat -d '{
  "model": "llama3:8b",
  "messages": [{"role": "user", "content": "Give me a two sentence summary of LibreOllama Desktop."}],
  "stream": false
}'
```

If the Assistant or Chat UI fails to respond, open devtools and check for logs prefixed with `[OllamaProvider]` or `[OLLAMA]` for detailed errors.
