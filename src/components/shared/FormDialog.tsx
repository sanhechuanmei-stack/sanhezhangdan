import { type ReactNode, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onSubmit: () => void;
  isSubmitting?: boolean;
  children: ReactNode;
  submitText?: string;
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  onSubmit,
  isSubmitting = false,
  children,
  submitText = '保存',
}: FormDialogProps) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        if (!isSubmitting) onSubmit();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, isSubmitting, onSubmit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-lg sm:max-w-lg w-[calc(100vw-2rem)] sm:w-full">
        <DialogHeader>
          <DialogTitle className="font-display text-base sm:text-lg tracking-tight">{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] sm:max-h-[60vh] pr-1">
          <div className="space-y-3 sm:space-y-4 py-2 px-1">{children}</div>
        </ScrollArea>
        <DialogFooter className="flex-row gap-2 sm:flex-row sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="flex-1 sm:flex-none rounded-xl">
            取消
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting} className="flex-1 sm:flex-none rounded-xl">
            {isSubmitting ? '保存中...' : submitText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
