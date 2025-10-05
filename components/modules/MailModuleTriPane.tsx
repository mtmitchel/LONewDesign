import React from 'react';
import { Mail } from 'lucide-react';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { EmailOverlay } from '../EmailOverlay';
import { ComposeModal, ComposeDraft } from '../ComposeModal';
import { ComposeDocked } from './compose';
import { MailLeftPane } from './mail/MailLeftPane';
import { MailCenterPane } from './mail/MailCenterPane';
import { MailRightPane } from './mail/MailRightPane';
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
      <div className="flex h-full bg-[var(--bg-canvas)] relative">
        {/* Keyboard hint when left pane is collapsed */}
        {!leftPaneVisible && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10 opacity-40 hover:opacity-80 transition-opacity">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setLeftPaneVisible(true)}
                  className="w-8 h-8 p-0 text-[#94A3B8] hover:text-[#64748B] hover:bg-[#F1F5F9]"
                >
                  <Mail size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Show mail sidebar (])</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Right pane keyboard hint when collapsed */}
        {!rightPaneVisible && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10 opacity-40 hover:opacity-80 transition-opacity">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setRightPaneVisible(true)}
                  className="w-8 h-8 p-0 text-[#94A3B8] hover:text-[#64748B] hover:bg-[#F1F5F9]"
                >
                  <Mail size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Show context (\)</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Left Pane or Collapsed Bar */}
        {leftPaneVisible && (
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
            onClose={() => setShowCompose(false)}
            onSend={(draft) => {
              console.log('Send email:', draft);
              setShowCompose(false);
            }}
            onPopout={() => {
              console.log('Pop out compose');
              // Could open the old center modal or new window
            }}
            onMinimize={() => {
              console.log('Minimize compose');
              // Could minimize to bottom bar
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
        
        {/* Right Pane or Slim Toggle Handle */}
        {rightPaneVisible && (
          <div className="w-[var(--quick-panel-width)] border-l border-[var(--border-default)] bg-[var(--bg-surface)] flex flex-col">
            <MailRightPane onHidePane={() => setRightPaneVisible(false)} />
          </div>
        )}
      </div>



    </TooltipProvider>
  );
}