import React from 'react';
import { Mail } from 'lucide-react';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { EmailOverlay } from './mail';
import { ComposeDocked, ComposeDraft } from './compose';
import { MailLeftPane } from './mail/MailLeftPane';
import { MailCenterPane } from './mail/MailCenterPane';
import { MailRightPane } from './mail/MailRightPane';
import { CollapsedSidebarPanel } from './mail/CollapsedSidebarPanel';
import { useMailState } from './mail/useMailState';
import { folders, labels, emails } from './mail/mockData';

export function MailModuleTriPane() {
  const {
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
    clearFilters,
    applyFilters
  } = useMailState();

  const [composeMinimized, setComposeMinimized] = React.useState(false);

  // Keyboard shortcut handlers
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // [ ] control left pane; \ controls right pane; ignore when meta/ctrl pressed
      if (e.metaKey || e.ctrlKey) return;
      if (e.key === '[') {
        e.preventDefault();
        setLeftPaneVisible(false);
      } else if (e.key === ']') {
        e.preventDefault();
        setLeftPaneVisible(true);
      } else if (e.key === '\\') {
        e.preventDefault();
        setRightPaneVisible(!rightPaneVisible);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rightPaneVisible, setLeftPaneVisible, setRightPaneVisible]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const parseVar = (value: string, fallback: number) => {
      const numeric = parseFloat(value.trim().replace('px', ''));
      return Number.isFinite(numeric) ? numeric : fallback;
    };

    const enforceMinimumCenterWidth = () => {
      const leftWidth = leftPaneVisible
        ? parseVar(getComputedStyle(root).getPropertyValue('--tripane-left-width'), 280)
        : 0;
      const rightWidth = rightPaneVisible
        ? parseVar(getComputedStyle(root).getPropertyValue('--quick-panel-width'), 320)
        : 0;
      const centerMin = parseVar(getComputedStyle(root).getPropertyValue('--tripane-center-min'), 400);
      const requiredWidth = leftWidth + rightWidth + centerMin;

      if (window.innerWidth < requiredWidth) {
        if (rightPaneVisible) {
          setRightPaneVisible(false);
          return;
        }

        if (leftPaneVisible) {
          setLeftPaneVisible(false);
        }
      }
    };

    enforceMinimumCenterWidth();
    window.addEventListener('resize', enforceMinimumCenterWidth);
    return () => window.removeEventListener('resize', enforceMinimumCenterWidth);
  }, [leftPaneVisible, rightPaneVisible, setLeftPaneVisible, setRightPaneVisible]);

  // Filter emails based on folder and search
  const filteredEmails = emails.filter(email => {
    const matchesSearch = email.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         email.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         email.preview.toLowerCase().includes(searchQuery.toLowerCase());
    
    // For now, show all emails in inbox (you could add folder filtering logic here)
    return matchesSearch;
  });

  const handleEmailSelect = (emailId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedEmail(emailId);
  };

  const handleEmailDoubleClick = (emailId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    // Not used anymore - single click opens modal
  };

  const handleCheckboxToggle = (emailId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedEmails(prev => 
      prev.includes(emailId) 
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
    );
  };

  // Email Detail Modal
  const selectedEmailData = emails.find(e => e.id === selectedEmail);

  const overlayEmail = selectedEmailData
    ? {
        id: selectedEmailData.id.toString(),
        subject: selectedEmailData.subject,
        label: selectedEmailData.labels[0]
          ? labels.find(l => l.id === selectedEmailData.labels[0])?.name || selectedEmailData.labels[0]
          : undefined,
        from: {
          name: selectedEmailData.sender,
          email: selectedEmailData.email
        },
        to: ['john.doe@company.com'],
        timestamp: `${selectedEmailData.date} at ${selectedEmailData.time}`,
        content: selectedEmailData.body
          .split('\\n')
          .map(line => `<p>${line}</p>`)
          .join(''),
        attachments: selectedEmailData.hasAttachment
          ? [
              {
                id: `${selectedEmailData.id}-attachment`,
                filename: `${selectedEmailData.subject.replace(/[^a-z0-9]+/gi, '-')}\.pdf`,
                size: '1.2 MB'
              }
            ]
          : undefined,
      }
    : null;

  return (
    <TooltipProvider>
      {/* Custom Tri-Pane Layout with Enhanced Toggle Controls */}
      <div className="flex h-full bg-[var(--bg-canvas)] relative overflow-hidden">
        {/* Left Pane or Collapsed Bar */}
        {leftPaneVisible ? (
          <div className="w-[var(--tripane-left-width)] border-r border-[var(--border-default)] bg-[var(--bg-surface)] flex flex-col">
            <MailLeftPane
              folders={folders}
              labels={labels}
              selectedFolder={selectedFolder}
              onFolderSelect={setSelectedFolder}
              onComposeClick={() => setShowCompose(true)}
              onHidePane={() => setLeftPaneVisible(false)}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setLeftPaneVisible(true)}
            aria-label="Show mail sidebar"
            title="Show mail sidebar (])"
            aria-keyshortcuts="]"
            className="group h-full w-2 min-w-[8px] max-w-[8px] bg-[var(--bg-surface-elevated)] shadow-[1px_0_0_var(--border-subtle)] flex items-center justify-center cursor-pointer motion-safe:transition-all duration-[var(--duration-base)] ease-[var(--easing-standard)] hover:bg-[var(--primary-tint-5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(51,65,85,0.4)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]"
          >
            <span
              aria-hidden="true"
              className="text-[var(--caret-rest)] text-base leading-none transition-all duration-[var(--duration-base)] ease-[var(--easing-standard)] motion-safe:transition-all group-hover:text-[var(--caret-hover)] group-hover:scale-110"
            >
              ›
            </span>
          </button>
        )}
        
        {/* Center Pane */}
        <div className="flex-1 flex flex-col min-w-0 relative overflow-visible" id="center-pane">
          <div className="flex-1 overflow-y-auto">
            <MailCenterPane
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              showAdvancedSearch={showAdvancedSearch}
              onAdvancedSearchToggle={setShowAdvancedSearch}
              searchFilters={searchFilters}
              onFiltersChange={setSearchFilters}
              onApplyFilters={applyFilters}
              onClearFilters={clearFilters}
              emails={filteredEmails}
              labels={labels}
              selectedEmail={selectedEmail}
              selectedEmails={selectedEmails}
              onEmailSelect={handleEmailSelect}
              onEmailDoubleClick={handleEmailDoubleClick}
              onCheckboxToggle={handleCheckboxToggle}
              onBulkArchive={() => console.log('Bulk archive')}
              onBulkDelete={() => console.log('Bulk delete')}
              onBulkLabel={() => console.log('Bulk label')}
              onBulkClear={() => setSelectedEmails([])}
            />
          </div>
          
          {/* Compose Modal - Mounted inside center pane */}
          <ComposeDocked
            open={showCompose}
            minimized={composeMinimized}
            onClose={() => {
              setShowCompose(false);
              setComposeMinimized(false);
            }}
            onSend={(draft) => {
              console.log('Send email:', draft);
              setShowCompose(false);
              setComposeMinimized(false);
            }}
            onPopout={() => {
              console.log('Pop out compose');
              // Could open the old center modal or new window
            }}
            onMinimize={() => {
              setComposeMinimized(true);
            }}
            onRestore={() => {
              setComposeMinimized(false);
            }}
          />

          {overlayEmail && (
            <EmailOverlay
              email={overlayEmail}
              onClose={() => setSelectedEmail(null)}
              onReply={() => {
                setSelectedEmail(null);
                setShowCompose(true);
              }}
              onReplyAll={() => {
                setSelectedEmail(null);
                setShowCompose(true);
              }}
              onForward={() => {
                setSelectedEmail(null);
                setShowCompose(true);
              }}
              onArchive={() => {
                console.log('Archive email');
                setSelectedEmail(null);
              }}
              onDelete={() => {
                console.log('Delete email');
                setSelectedEmail(null);
              }}
              onToggleStar={() => {
                console.log('Toggle star');
              }}
            />
          )}
        </div>
        
        {/* Right Pane or Collapsed Bar */}
        {rightPaneVisible ? (
          <div className="w-[var(--quick-panel-width)] border-l border-[var(--border-default)] bg-[var(--bg-surface)] flex flex-col">
            <MailRightPane onHidePane={() => setRightPaneVisible(false)} />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setRightPaneVisible(true)}
            aria-label="Show context"
            title="Show context (\\)"
            aria-keyshortcuts="\\"
            className="group h-full w-2 min-w-[8px] max-w-[8px] bg-[var(--bg-surface-elevated)] shadow-[-1px_0_0_var(--border-subtle)] flex items-center justify-center cursor-pointer motion-safe:transition-all duration-[var(--duration-base)] ease-[var(--easing-standard)] hover:bg-[var(--primary-tint-5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(51,65,85,0.4)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]"
          >
            <span
              aria-hidden="true"
              className="text-[var(--caret-rest)] text-base leading-none transition-all duration-[var(--duration-base)] ease-[var(--easing-standard)] motion-safe:transition-all group-hover:text-[var(--caret-hover)] group-hover:scale-110"
            >
              ‹
            </span>
          </button>
        )}
      </div>



    </TooltipProvider>
  );
}
