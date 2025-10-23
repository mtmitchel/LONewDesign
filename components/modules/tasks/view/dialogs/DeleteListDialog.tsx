"use client";

import { Button } from '../../../../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../ui/select';

interface DeleteListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  listTitle: string;
  taskCount: number;
  taskLists: Array<{ id: string; name: string }>;
  fallbackList: string;
  setFallbackList: (listId: string) => void;
  listId: string;
}

export function DeleteListDialog({
  isOpen,
  onClose,
  onConfirm,
  listTitle,
  taskCount,
  taskLists,
  fallbackList,
  setFallbackList,
  listId,
}: DeleteListDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Delete list?</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-[color:var(--text-secondary)]">
            {taskCount ? (
              <>
                Delete <span className="font-semibold text-[color:var(--text-primary)]">"{listTitle}"</span>? 
                {' '}{taskCount} task{taskCount > 1 ? 's' : ''} will be moved to "To Do".
              </>
            ) : (
              <>
                Delete <span className="font-semibold text-[color:var(--text-primary)]">"{listTitle}"</span>?
              </>
            )}
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
         <div className="flex items-center justify-between w-full">
           <div className="flex items-center gap-2">
             <span className="text-sm text-[color:var(--text-secondary)]">Reassign tasks to</span>
             <Select value={fallbackList} onValueChange={setFallbackList}>
               <SelectTrigger className="w-40 h-8">
                 <SelectValue placeholder="Select list" />
               </SelectTrigger>
               <SelectContent>
                 {taskLists
                   .filter(l => l.id !== listId)
                   .map(l => (
                     <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                   ))}
               </SelectContent>
             </Select>
           </div>
           <Button 
             variant="destructive" 
             onClick={onConfirm}
             className="bg-[var(--danger)] hover:bg-[var(--danger-hover)] text-white"
           >
             Delete
           </Button>
         </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}