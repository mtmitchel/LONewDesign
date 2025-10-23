import * as React from "react";
import { Button } from "../../../ui/button";
import { WritingToolsGrid, WritingTool } from "../WritingToolsGrid";

interface WritingToolsSectionProps {
  storedSelectedText: string;
  canEditSelection: boolean;
  onReplace?: (text: string) => void;
  onInsert?: (text: string) => void;
  onOpenChange: (open: boolean) => void;
}

export function WritingToolsSection({
  storedSelectedText,
  canEditSelection,
  onReplace,
  onInsert,
  onOpenChange,
}: WritingToolsSectionProps) {
  const [isToolRunning, setIsToolRunning] = React.useState(false);
  const [translationLanguage, setTranslationLanguage] = React.useState("es");

  const handleToolSelect = async (tool: WritingTool) => {
    setIsToolRunning(true);
    
    try {
      // Simulate API call - in real implementation this would call the assistant service
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, just apply a simple transformation based on the tool
      let result = storedSelectedText;
      
      switch (tool) {
        case "professional":
          result = `Professional version: ${storedSelectedText}`;
          break;
        case "friendly":
          result = `Friendly version: ${storedSelectedText}`;
          break;
        case "concise":
          result = `Concise version: ${storedSelectedText}`;
          break;
        case "expand":
          result = `Expanded version: ${storedSelectedText}`;
          break;
        case "proofread":
          result = `Proofread: ${storedSelectedText}`;
          break;
        case "summarize":
          result = `Summary: ${storedSelectedText}`;
          break;
        case "translate":
          result = `Translated to ${translationLanguage}: ${storedSelectedText}`;
          break;
        case "explain":
          result = `Explanation: ${storedSelectedText}`;
          break;
        case "list":
          result = `• ${storedSelectedText}`;
          break;
        case "extract":
          result = `Key points: ${storedSelectedText}`;
          break;
      }
      
      if (canEditSelection && onReplace) {
        onReplace(result);
      } else if (onInsert) {
        onInsert(result);
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Tool execution failed:", error);
    } finally {
      setIsToolRunning(false);
    }
  };

  const executeTranslation = () => {
    handleToolSelect("translate");
  };

  return (
    <div className="px-[var(--space-6)] py-[var(--space-4)]">
      <div className="mb-[var(--space-4)]">
        <h3 className="text-sm font-medium text-[color:var(--text-primary)] mb-[var(--space-2)]">
          Selected Text
        </h3>
        <div className="rounded-[var(--radius-md)] bg-[var(--bg-surface-elevated)] p-[var(--space-3)] text-sm text-[color:var(--text-secondary)]">
          {storedSelectedText}
        </div>
      </div>

      {translationLanguage === "translate" ? (
        <div className="space-y-[var(--space-4)]">
          <div>
            <label className="block text-sm font-medium text-[color:var(--text-primary)] mb-[var(--space-2)]">
              Translate to
            </label>
            <select
              value={translationLanguage}
              onChange={(e) => setTranslationLanguage(e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-[var(--space-3)] py-[var(--space-2)] text-sm text-[color:var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="ja">Japanese</option>
              <option value="zh">Chinese</option>
            </select>
          </div>
          <div className="flex gap-[var(--space-2)]">
            <Button
              variant="outline"
              onClick={() => setTranslationLanguage("es")}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={executeTranslation}
              className="flex-1"
            >
              Translate
            </Button>
          </div>
        </div>
      ) : (
        <WritingToolsGrid
          onToolSelect={handleToolSelect}
          disabled={isToolRunning}
        />
      )}
    </div>
  );
}