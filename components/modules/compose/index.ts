export { ComposeDocked } from './ComposeDocked';
export { ComposeEnvelope } from './ComposeEnvelope';
export { ComposeEditor } from './ComposeEditor';
export { ComposeToolbar } from './ComposeToolbar';
export { ComposeChips } from './ComposeChips';

export type {
  EmailChip,
  ComposeState,
  ComposeDraft,
  RecipientField,
  ComposeEditorCommands
} from './types';

export {
  parseEmailInput,
  createEmailChip,
  validateEmail,
  formatChipLabel,
  getInitials,
  hasComposeContent,
  canSendCompose
} from './utils';