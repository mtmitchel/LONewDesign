import { EmailChip } from './types';

// Email validation utility
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// Create chip from email string
export const createChip = (email: string): EmailChip => {
  const trimmedEmail = email.trim();
  const isValid = validateEmail(trimmedEmail);
  return {
    id: Math.random().toString(36).substr(2, 9),
    email: trimmedEmail,
    isValid
  };
};