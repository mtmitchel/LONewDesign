import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { EmailOverlay } from './mail';
import { ComposeDocked } from './compose';
import { MailLeftPane } from './mail/MailLeftPane';
import { MailCenterPane } from './mail/MailCenterPane';
import { MailRightPane } from './mail/MailRightPane';
import { CollapsedSidebarPanel } from './mail/CollapsedSidebarPanel';
import { useMailState } from './mail/useMailState';
import { folders, labels, emails as initialEmails } from './mail/mockData';

const PAGE_SIZE = 25;

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

  const [mailItems, setMailItems] = React.useState(initialEmails);
  const [composeMinimized, setComposeMinimized] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);

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
  const filteredEmails = React.useMemo(() => {
    const keyword = searchQuery.toLowerCase();
    return mailItems.filter(email => {
      const matchesSearch =
        email.subject.toLowerCase().includes(keyword) ||
        email.sender.toLowerCase().includes(keyword) ||
        email.preview.toLowerCase().includes(keyword);

      // TODO: incorporate folder filtering and advanced filters
      return matchesSearch;
    });
  }, [mailItems, searchQuery]);

  const totalEmails = filteredEmails.length;
  const totalPages = Math.max(1, Math.ceil(totalEmails / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = totalEmails === 0 ? 0 : (safePage - 1) * PAGE_SIZE;
  const endIndex = totalEmails === 0 ? 0 : Math.min(startIndex + PAGE_SIZE, totalEmails);
  const paginatedEmails = filteredEmails.slice(startIndex, endIndex);
  const rangeStart = totalEmails === 0 ? 0 : startIndex + 1;
  const rangeEnd = totalEmails === 0 ? 0 : endIndex;
  const hasPreviousPage = safePage > 1;
  const hasNextPage = endIndex < totalEmails;

  React.useEffect(() => {
    if (currentPage !== safePage) {
      setCurrentPage(safePage);
    }
  }, [currentPage, safePage]);

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

  const handleSelectAll = React.useCallback(() => {
    setSelectedEmails(filteredEmails.map(email => email.id));
  }, [filteredEmails, setSelectedEmails]);

  const handleSelectNone = React.useCallback(() => {
    setSelectedEmails([]);
  }, [setSelectedEmails]);

  const handleSelectRead = React.useCallback(() => {
    setSelectedEmails(filteredEmails.filter(email => !email.unread).map(email => email.id));
  }, [filteredEmails, setSelectedEmails]);

  const handleSelectUnread = React.useCallback(() => {
    setSelectedEmails(filteredEmails.filter(email => email.unread).map(email => email.id));
  }, [filteredEmails, setSelectedEmails]);

  const handleSelectStarred = React.useCallback(() => {
    setSelectedEmails(filteredEmails.filter(email => email.starred).map(email => email.id));
  }, [filteredEmails, setSelectedEmails]);

  const handleSelectUnstarred = React.useCallback(() => {
    setSelectedEmails(filteredEmails.filter(email => !email.starred).map(email => email.id));
  }, [filteredEmails, setSelectedEmails]);

  const handleRefresh = React.useCallback(() => {
    setMailItems(initialEmails);
    setSelectedEmails([]);
  }, [setSelectedEmails]);

  const handleMarkRead = React.useCallback(() => {
    if (!selectedEmails.length) return;
    setMailItems(prev =>
      prev.map(email =>
        selectedEmails.includes(email.id)
          ? { ...email, unread: false }
          : email
      )
    );
  }, [selectedEmails]);

  const handleMarkUnread = React.useCallback(() => {
    if (!selectedEmails.length) return;
    setMailItems(prev =>
      prev.map(email =>
        selectedEmails.includes(email.id)
          ? { ...email, unread: true }
          : email
      )
    );
  }, [selectedEmails]);

  const handleArchive = React.useCallback(() => {
    if (!selectedEmails.length) return;
    setMailItems(prev => prev.filter(email => !selectedEmails.includes(email.id)));
    if (selectedEmail && selectedEmails.includes(selectedEmail)) {
      setSelectedEmail(null);
    }
    setSelectedEmails([]);
  }, [selectedEmail, selectedEmails, setSelectedEmail, setSelectedEmails]);

  const handleDelete = React.useCallback(() => {
    if (!selectedEmails.length) return;
    setMailItems(prev => prev.filter(email => !selectedEmails.includes(email.id)));
    if (selectedEmail && selectedEmails.includes(selectedEmail)) {
      setSelectedEmail(null);
    }
    setSelectedEmails([]);
  }, [selectedEmail, selectedEmails, setSelectedEmail, setSelectedEmails]);

  const handleMove = React.useCallback(() => {
    console.log('Move to folder', selectedEmails);
  }, [selectedEmails]);

  const handleSnooze = React.useCallback(() => {
    console.log('Snooze emails', selectedEmails);
  }, [selectedEmails]);

  const handleStarToggle = React.useCallback(() => {
    if (!selectedEmails.length) return;
    setMailItems(prev =>
      prev.map(email =>
        selectedEmails.includes(email.id)
          ? { ...email, starred: !email.starred }
          : email
      )
    );
  }, [selectedEmails]);

  const handlePreviousPage = React.useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = React.useCallback(() => {
    setCurrentPage(prev => (prev < totalPages ? prev + 1 : prev));
  }, [totalPages]);

  // Email Detail Modal
  const selectedEmailData = mailItems.find(e => e.id === selectedEmail);

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
                filename: `${selectedEmailData.subject.replace(/[^a-z0-9]+/gi, '-')}.pdf`,
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
          <MailLeftPane
            folders={folders}
            labels={labels}
            selectedFolder={selectedFolder}
            onFolderSelect={setSelectedFolder}
            onComposeClick={() => setShowCompose(true)}
            onHidePane={() => setLeftPaneVisible(false)}
            className="w-[var(--tripane-left-width)]"
          />
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
          <MailCenterPane
            showLeftDivider={leftPaneVisible}
            showRightDivider={rightPaneVisible}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            showAdvancedSearch={showAdvancedSearch}
            onAdvancedSearchToggle={setShowAdvancedSearch}
            searchFilters={searchFilters}
            onFiltersChange={setSearchFilters}
            onApplyFilters={applyFilters}
            onClearFilters={clearFilters}
            emails={paginatedEmails}
            labels={labels}
            selectedEmail={selectedEmail}
            selectedEmails={selectedEmails}
            onEmailSelect={handleEmailSelect}
            onEmailDoubleClick={handleEmailDoubleClick}
            onCheckboxToggle={handleCheckboxToggle}
            onSelectAll={handleSelectAll}
            onSelectNone={handleSelectNone}
            onSelectRead={handleSelectRead}
            onSelectUnread={handleSelectUnread}
            onSelectStarred={handleSelectStarred}
            onSelectUnstarred={handleSelectUnstarred}
            onRefresh={handleRefresh}
            onMarkRead={handleMarkRead}
            onMarkUnread={handleMarkUnread}
            onArchive={handleArchive}
            onDelete={handleDelete}
            onMove={handleMove}
            onSnooze={handleSnooze}
            onStar={handleStarToggle}
            totalCount={totalEmails}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            hasPreviousPage={hasPreviousPage}
            hasNextPage={hasNextPage}
            onPreviousPage={handlePreviousPage}
            onNextPage={handleNextPage}
            currentPage={safePage}
            totalPages={totalPages}
          />
          
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
          <MailRightPane 
            onHidePane={() => setRightPaneVisible(false)} 
            className="w-[var(--quick-panel-width)]" 
          />
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
