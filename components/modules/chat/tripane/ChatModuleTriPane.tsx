"use client";
import React from "react";
import { TriPane } from "../../../TriPane";
import { PaneHeader } from "../../../layout/PaneHeader";
import { PaneCaret } from "../../../dev/PaneCaret";
import { ChatLeftPane } from "../ChatLeftPane";
import { ChatRightPane } from "../ChatRightPane";
import { ChatCenterPane } from "../ChatCenterPane";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../ui/select";
import { Button } from "../../../ui/button";

import { useChatState } from "./hooks/useChatState";
import { useModelSelection } from "./hooks/useModelSelection";
import { usePaneManagement } from "./hooks/usePaneManagement";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useStreaming } from "./hooks/useStreaming";

import type { ChatModuleTriPaneProps } from "./types";
import type { ConversationAction } from "../types";

export function ChatModuleTriPane(props: ChatModuleTriPaneProps) {
  const {
    containerRef,
    leftPaneVisible,
    rightPaneVisible,
    isOverlayRight,
    overlayPanelRef,
    leftPaneRef,
    setLeftPaneVisible,
    setRightPaneVisible,
  } = usePaneManagement();

  const {
    MODEL_OPTIONS,
    selectedModel,
    selectedModelLabel,
    selectedOption,
    modelAnnouncement,
    onModelChange,
  } = useModelSelection();

  const {
    conversations,
    messages,
    activeConversationId,
    activeConversation,
    isStreaming,
    onOpenConversation,
    onSend,
    onStartNewConversation,
    onConversationAction,
  } = useChatState({
    selectedModel,
    selectedOption,
    MODEL_OPTIONS,
  });

  const handleConversationAction = React.useCallback((id: string, action: ConversationAction) => {
    const conversation = conversations.find((c: any) => c.id === id);
    if (conversation) {
      onConversationAction(action, conversation);
    }
  }, [conversations, onConversationAction]);

  const { handleSend } = useStreaming({
    selectedModel,
    selectedOption,
    activeConversationId,
    conversations,
    messages,
    isStreaming,
    onSend,
  });

  useKeyboardShortcuts({
    leftPaneVisible,
    setLeftPaneVisible,
    setRightPaneVisible,
    onStartNewConversation,
    leftPaneRef,
  });

  const handleOpenAssistant = React.useCallback(() => {
    // TODO: Implement quick assistant opening
    console.debug('chat:assistant:open', { source: 'chat' });
  }, []);

  const railWidth = '20px';
  const collapsedRail = parseFloat(railWidth) || 20;
  const leftPaneWidth = leftPaneVisible ? 'var(--tripane-left-width)' : railWidth;
  const rightPaneWidth = rightPaneVisible ? 'var(--quick-panel-width)' : railWidth;

  return (
    <div ref={containerRef} className="h-full w-full">
      <TriPane
        leftWidth={leftPaneWidth}
        rightWidth={rightPaneWidth}
        left={
          leftPaneVisible ? (
            <ChatLeftPane 
              ref={leftPaneRef}
              conversations={conversations} 
              activeId={activeConversationId} 
              onSelect={onOpenConversation}
              onHidePane={() => setLeftPaneVisible(false)}
               onConversationAction={handleConversationAction}
            />
          ) : (
            <div className="h-full w-5 min-w-[20px] max-w-[20px] bg-[var(--bg-surface-elevated)] shadow-[1px_0_0_var(--border-subtle)] flex items-center justify-center cursor-pointer">
              <PaneCaret
                side="left"
                label="Show conversations"
                ariaKeyshortcuts="]"
                onClick={() => setLeftPaneVisible(true)}
              />
            </div>
          )
        }
        leftHeader={
          leftPaneVisible ? (
            <PaneHeader
              label="Conversations"
              actions={
                <Button
                  type="button"
                  size="sm"
                  variant="solid"
                  className="gap-[var(--space-1)] px-[var(--space-3)]"
                  onClick={onStartNewConversation}
                  title="New chat (N)"
                  aria-keyshortcuts="KeyN"
                >
                  + New
                </Button>
              }
            />
          ) : undefined
        }
        center={
          <ChatCenterPane
            conversationId={activeConversationId}
            messages={messages}
            onSend={handleSend}
            onStartNewConversation={onStartNewConversation}
            onAttachFiles={() => {}} // TODO: Implement file attachment
            isStreaming={isStreaming}
            modelName={selectedModelLabel}
          />
        }
        centerHeader={
          <PaneHeader className="px-[var(--space-4)]">
            <div className="flex w-full items-center justify-between gap-[var(--space-3)]">
              <div className="min-w-0 truncate text-[color:var(--text-primary)]">
                {activeConversation?.title ?? 'Chat'}
              </div>
              <div className="flex items-center gap-[var(--space-2)]">
                <div className="flex items-center gap-[var(--space-2)] text-xs font-medium text-[color:var(--text-tertiary)]">
                  <span>Model</span>
                  <Select
                    value={selectedModel || undefined}
                    onValueChange={onModelChange}
                    disabled={MODEL_OPTIONS.length === 0}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SelectTrigger
                          size="sm"
                          aria-label="Select model for this conversation"
                          className="max-w-[220px] text-[length:var(--text-sm)]"
                          disabled={MODEL_OPTIONS.length === 0}
                        >
                          <SelectValue
                            placeholder={MODEL_OPTIONS.length === 0 ? 'No models configured' : 'Select a model'}
                          />
                        </SelectTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        {MODEL_OPTIONS.length === 0 ? 'Configure models in Settings → Models' : selectedModelLabel}
                      </TooltipContent>
                    </Tooltip>
                    <SelectContent>
                       {MODEL_OPTIONS.map((option: any) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="sm"
                  className="h-9 bg-[var(--primary)] text-[var(--primary-foreground)] md:hidden"
                  onClick={handleOpenAssistant}
                  aria-keyshortcuts="Meta+K,Control+K"
                >
                  Add
                </Button>
              </div>
            </div>
            <div aria-live="polite" className="sr-only">
              {modelAnnouncement}
            </div>
          </PaneHeader>
        }
        right={
          rightPaneVisible && !isOverlayRight ? (
            <ChatRightPane
              onHidePane={() => setRightPaneVisible(false)}
              selectedModel={selectedModel}
              selectedModelLabel={selectedModelLabel}
              conversation={activeConversation}
            />
          ) : (
            <div className="h-full w-5 min-w-[20px] max-w-[20px] bg-[var(--bg-surface-elevated)] shadow-[-1px_0_0_var(--border-subtle)] flex items-center justify-center cursor-pointer">
              <PaneCaret
                side="right"
                label="Show assistant info"
                ariaKeyshortcuts="\\"
                onClick={() => setRightPaneVisible(true)}
              />
            </div>
          )
        }
      />
      {/* Overlay right pane on small widths */}
      {isOverlayRight && rightPaneVisible && (
        <div className="fixed inset-0 z-40 flex" aria-modal="true" role="dialog">
          <div
            className="flex-1 bg-[var(--overlay-scrim)] backdrop-blur-[var(--overlay-blur)]"
            onClick={() => setRightPaneVisible(false)}
            aria-hidden
          />
          <div
            ref={overlayPanelRef}
            className="w-[var(--quick-panel-width)] h-full bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] rounded-l-[var(--radius-lg)] shadow-xl z-50 focus:outline-none"
            tabIndex={-1}
          >
            <ChatRightPane
              onHidePane={() => setRightPaneVisible(false)}
              selectedModel={selectedModel}
              selectedModelLabel={selectedModelLabel}
              conversation={activeConversation}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatModuleTriPane;