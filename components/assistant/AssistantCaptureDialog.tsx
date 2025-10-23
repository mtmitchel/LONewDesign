import { CaptureDialog } from "./capture/CaptureDialog";
import { AssistantCommand, AssistantSubmitPayload } from "./capture/types";

export type { AssistantCommand, AssistantSubmitPayload };

export interface AssistantCaptureDialogProps {
  open: boolean;
  initialValue?: string;
  selectedText?: string;
  canEditSelection?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: AssistantSubmitPayload) => Promise<void>;
  onCommandSelect?: (command: AssistantCommand) => void;
  onError?: (message: string) => void;
  onReplace?: (text: string) => void;
  onInsert?: (text: string) => void;
}

export function AssistantCaptureDialog(props: AssistantCaptureDialogProps) {
  return <CaptureDialog {...props} />;
}