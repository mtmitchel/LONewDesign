// ============================================================================
// COMMAND REGISTRY
// ============================================================================

export type ParsedCommand =
  | { kind: "empty" }
  | { kind: "task"; payload: string }
  | { kind: "event"; payload: string }
  | { kind: "note"; title?: string; body: string }
  | { kind: "ai"; action: string; payload: string }
  | { kind: "unknown"; raw: string };

export function parseCommand(raw: string): ParsedCommand {
  const value = raw.trim();
  if (!value) return { kind: "empty" };

  if (value.startsWith("/")) {
    const spaceIndex = value.indexOf(" ");
    const command =
      spaceIndex === -1
        ? value.slice(1).toLowerCase()
        : value.slice(1, spaceIndex).toLowerCase();
    const rest = spaceIndex === -1 ? "" : value.slice(spaceIndex + 1).trim();

    switch (command) {
      case "task":
        return { kind: "task", payload: rest };
      case "note":
        return { kind: "note", body: rest };
      case "event":
        return { kind: "event", payload: rest };
      case "email":
      case "summarize":
      case "link":
      case "focus":
      case "ask":
        return { kind: "ai", action: command, payload: rest };
      default:
        return { kind: "unknown", raw: value };
    }
  }

  const [firstLine, ...rest] = value.split("\n");
  if (rest.length > 0) {
    return {
      kind: "note",
      title: firstLine.trim() || undefined,
      body: rest.join("\n").trim(),
    };
  }

  return { kind: "note", body: value };
}

export function buildNoteFromBody(input: { title?: string; body: string }) {
  const title = input.title ?? input.body.slice(0, 80);
  const body = input.body;
  return {
    title: title.trim() || "Quick capture",
    body,
  };
}