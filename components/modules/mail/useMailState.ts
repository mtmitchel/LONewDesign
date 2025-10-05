import { useState } from 'react';
import { SearchFilters, EmailChip } from './types';
import { createChip } from './utils';

export function useMailState() {
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedEmail, setSelectedEmail] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<number[]>([]);
  const [leftPaneVisible, setLeftPaneVisible] = useState(true);
  const [rightPaneVisible, setRightPaneVisible] = useState(true);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  
  // Advanced search filters
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    from: '',
    to: '',
    subject: '',
    hasAttachment: false,
    dateRange: 'any',
    folder: 'any'
  });

  // Compose modal state - for legacy compose modal
  const [recipientFieldExpanded, setRecipientFieldExpanded] = useState(false);
  const [showCcField, setShowCcField] = useState(false);
  const [showBccField, setShowBccField] = useState(false);
  const [toChips, setToChips] = useState<EmailChip[]>([]);
  const [ccChips, setCcChips] = useState<EmailChip[]>([]);
  const [bccChips, setBccChips] = useState<EmailChip[]>([]);
  const [toInputValue, setToInputValue] = useState('');
  const [ccInputValue, setCcInputValue] = useState('');
  const [bccInputValue, setBccInputValue] = useState('');
  const [showContactSuggestions, setShowContactSuggestions] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState('john.doe@company.com');

  // Handle input commit functions
  const commitToInput = () => {
    if (toInputValue.trim()) {
      const chip = createChip(toInputValue);
      setToChips(prev => [...prev, chip]);
      setToInputValue('');
    }
  };
  
  const commitCcInput = () => {
    if (ccInputValue.trim()) {
      const chip = createChip(ccInputValue);
      setCcChips(prev => [...prev, chip]);
      setCcInputValue('');
    }
  };
  
  const commitBccInput = () => {
    if (bccInputValue.trim()) {
      const chip = createChip(bccInputValue);
      setBccChips(prev => [...prev, chip]);
      setBccInputValue('');
    }
  };

  const clearFilters = () => {
    setSearchFilters({
      from: '',
      to: '',
      subject: '',
      hasAttachment: false,
      dateRange: 'any',
      folder: 'any'
    });
  };

  const applyFilters = () => {
    setShowAdvancedSearch(false);
  };

  return {
    // Main state
    selectedFolder,
    setSelectedFolder,
    selectedEmail,
    setSelectedEmail,
    searchQuery,
    setSearchQuery,
    showCompose,
    setShowCompose,
    selectedEmails,
    setSelectedEmails,
    leftPaneVisible,
    setLeftPaneVisible,
    rightPaneVisible,
    setRightPaneVisible,
    showAdvancedSearch,
    setShowAdvancedSearch,
    searchFilters,
    setSearchFilters,
    
    // Legacy compose state
    recipientFieldExpanded,
    setRecipientFieldExpanded,
    showCcField,
    setShowCcField,
    showBccField,
    setShowBccField,
    toChips,
    setToChips,
    ccChips,
    setCcChips,
    bccChips,
    setBccChips,
    toInputValue,
    setToInputValue,
    ccInputValue,
    setCcInputValue,
    bccInputValue,
    setBccInputValue,
    showContactSuggestions,
    setShowContactSuggestions,
    selectedAccount,
    setSelectedAccount,
    
    // Helper methods
    commitToInput,
    commitCcInput,
    commitBccInput,
    clearFilters,
    applyFilters
  };
}