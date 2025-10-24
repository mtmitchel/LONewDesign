export {
  QuickAssistantProvider,
  useQuickAssistant,
} from "./quick/QuickAssistantProvider";

export {
  openQuickAssistant,
  QUICK_ASSISTANT_EVENTS,
} from "./quick/telemetry";

export type {
  QuickAssistantScope,
  QuickAssistantMode,
  OpenAssistantOptions,
  QuickAssistantContextValue,
} from "./quick/QuickAssistantProvider";

export { AssistantCaptureDialog } from "./AssistantCaptureDialog";
export type {
  AssistantSubmitPayload,
  AssistantCommand,
  AssistantCaptureDialogProps,
} from "./AssistantCaptureDialog";
