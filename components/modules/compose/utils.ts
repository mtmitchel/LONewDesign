import { EmailChip } from './types';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Parse email input and create chips
export function parseEmailInput(input: string): EmailChip[] {
  if (!input.trim()) return [];
  
  // Split on comma, semicolon, or newline
  const parts = input.split(/[,;\n]/).map(part => part.trim()).filter(Boolean);
  
  return parts.map(part => createEmailChip(part));
}

// Create a single email chip from input
export function createEmailChip(input: string): EmailChip {
  const trimmed = input.trim();
  
  // Handle "Name <email>" format
  const nameEmailMatch = trimmed.match(/^(.+?)\s*<(.+?)>$/);
  if (nameEmailMatch) {
    const [, name, email] = nameEmailMatch;
    return {
      id: Math.random().toString(36).substr(2, 9),
      label: name.trim(),
      email: email.trim(),
      valid: validateEmail(email.trim())
    };
  }
  
  // Plain email
  return {
    id: Math.random().toString(36).substr(2, 9),
    label: trimmed,
    email: trimmed,
    valid: validateEmail(trimmed)
  };
}

// Validate email address
export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

// Format chip for display
export function formatChipLabel(chip: EmailChip): string {
  if (chip.label !== chip.email) {
    return chip.label;
  }
  return chip.email;
}

// Get initials for avatar
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Check if compose has content
export function hasComposeContent(state: { to: EmailChip[]; cc: EmailChip[]; bcc: EmailChip[]; subject: string; html: string }): boolean {
  return (
    state.to.length > 0 ||
    state.cc.length > 0 ||
    state.bcc.length > 0 ||
    state.subject.trim().length > 0 ||
    state.html.trim().length > 0
  );
}

// Check if compose is ready to send
export function canSendCompose(state: { to: EmailChip[]; subject: string; html: string }): boolean {
  const hasValidRecipients = state.to.some(chip => chip.valid);
  const hasContent = state.html.trim().length > 0 || state.subject.trim().length > 0;
  return hasValidRecipients && hasContent;
}