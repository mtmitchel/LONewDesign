// Mail module types and interfaces

export interface Folder {
  id: string;
  name: string;
  icon: any; // Lucide icon component
  count: number;
  color?: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Email {
  id: number;
  sender: string;
  email: string;
  subject: string;
  preview: string;
  body: string;
  time: string;
  date: string;
  unread: boolean;
  starred: boolean;
  hasAttachment: boolean;
  labels: string[];
}

export interface Contact {
  email: string;
  name: string;
}

export interface EmailChip {
  id: string;
  email: string;
  name?: string;
  isValid: boolean;
}

export interface SearchFilters {
  from: string;
  to: string;
  subject: string;
  hasAttachment: boolean;
  dateRange: string;
  folder: string;
}