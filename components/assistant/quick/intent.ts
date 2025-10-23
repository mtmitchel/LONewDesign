// ============================================================================
// INTENT CLASSIFICATION MODULE
// ============================================================================

import { useCallback } from "react";
import { toast } from "sonner";
import { createProviderFromSettings } from "../services/openaiProvider";
import { useProviderSettings } from "../../modules/settings/state/providerSettings";
import { parseNaturalDate } from "./commands/helpers";
import { dispatchAssistantEvent, QUICK_ASSISTANT_EVENTS } from "./telemetry";

const CONFIDENCE_THRESHOLD = 0.6;

export interface UseIntentClassificationProps {
  scopeRef: React.MutableRefObject<any>;
  handleTaskCreate: (payload: any) => void;
  emitCreateNote: (payload: any) => void;
  emitCreateEvent: (payload: any) => void;
  resetAssistant: () => void;
}

export function useIntentClassification({
  scopeRef,
  handleTaskCreate,
  emitCreateNote,
  emitCreateEvent,
  resetAssistant,
}: UseIntentClassificationProps) {
  const classifyAndRouteIntent = useCallback(
    async (text: string) => {
      console.log('[QuickAssistant] No slash command, attempting intent classification');
      
      // Check if assistant provider is configured
      const assistantProvider = useProviderSettings.getState().assistantProvider;
      
      if (!assistantProvider) {
        console.warn('[QuickAssistant] No assistant provider configured, falling back to note');
        toast.info('Configure an assistant provider in Settings to use AI classification');
        emitCreateNote({ body: text });
        return;
      }

      // Attempt intent classification
      try {
        console.log(`[QuickAssistant] Creating ${assistantProvider} provider`);
        const provider = createProviderFromSettings();
        
        console.log('[QuickAssistant] 🔍 Classifying intent for input:', text);
        const intent = await provider.classifyIntent(text);
        
        console.log('[QuickAssistant] 📊 Classification result:', {
          type: intent.type,
          confidence: intent.confidence,
          extracted: intent.extracted
        });
        
        dispatchAssistantEvent("assistant.intent_resolved", {
          intent: intent.type,
          confidence: intent.confidence,
          provider: assistantProvider,
          scope: scopeRef.current ?? undefined,
        });

        if (intent.confidence < CONFIDENCE_THRESHOLD) {
          toast.warning(
            `Assistant is only ${(intent.confidence * 100).toFixed(0)}% confident. Add /task, /note, or /event to confirm.`,
          );
          return;
        }

        // Route based on classified intent
        switch (intent.type) {
          case 'task': {
            const title = intent.extracted.title || text;
            console.log('[QuickAssistant] Creating task with extracted data:', intent.extracted);
            
            // handleTaskCreate already shows toast and closes dialog
            handleTaskCreate({
              title,
              description: intent.extracted.notes || title,
              date: intent.extracted.dueDate, // Pass the extracted due date
              priority: intent.extracted.priority,
            });
            return;
          }
          case 'note': {
            const noteTitle = intent.extracted.title;
            const noteBody = intent.extracted.body || text;
            console.log('[QuickAssistant] Creating note with extracted data:', intent.extracted);
            emitCreateNote({
              title: noteTitle,
              body: noteBody,
              original: text,
            });
            return;
          }
          case 'event': {
            const eventTitle = intent.extracted.title || text;
            // Parse natural language date (e.g., "tuesday" → next Tuesday)
            const eventDate = intent.extracted.date 
              ? parseNaturalDate(intent.extracted.date)
              : new Date().toISOString().slice(0, 10);
            
            console.log('[QuickAssistant] 🗓️ Parsed date:', intent.extracted.date, '→', eventDate);
            console.log('[QuickAssistant] Creating event with extracted data:', intent.extracted);
            
            emitCreateEvent({
              title: eventTitle,
              date: eventDate,
              start: intent.extracted.startTime,
              end: intent.extracted.endTime,
              location: intent.extracted.location,
              notes: text,
              original: text,
            });
            return;
          }
          case 'unknown':
          default: {
            console.log('[QuickAssistant] Unknown intent, creating note');
            // emitCreateNote already shows success toast, so just explain why it's a note
            emitCreateNote({ 
              body: text,
              title: 'Quick note'
            });
            return;
          }
        }
      } catch (error) {
        console.error('[QuickAssistant] Intent classification failed:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Failed to process: ${errorMsg}`);
        
        // Don't create anything on error - let user try again
        return;
      }
    },
    [handleTaskCreate, emitCreateNote, emitCreateEvent]
  );

  return {
    classifyAndRouteIntent,
  };
}