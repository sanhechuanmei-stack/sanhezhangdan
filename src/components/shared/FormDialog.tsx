import { type ReactNode, useEffect, useState, useCallback } from 'react';
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
  const [confirming, setConfirming] = useState(false);

  // 弹窗关闭时重置确认状态
  useEffect(() => {
    if (!open) setConfirming(false);
  }, [open]);

  const handleSubmit = useCallback(() => {
    if (!isSubmitting) onSubmit();
  }, [isSubmitting, onSubmit]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      // ESC 在确认状态下取消确认，不关闭弹窗
      if (e.key === 'Escape' && confirming) {
        e.preventDefault();
        e.stopPropagation();
        setConfirming(false);
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        if (confirming) {
          // 第二次回车，执行提交
          handleSubmit();
          setConfirming(false);
        } else {
          // 第一次回车，进入确认状态
          setConfirming(true);
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [open, confirming, handleSubmit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-lg sm:max-w-lg w-[calc(100vw-2rem)] sm:w-full">
        <DialogHeader>
          <DialogTitle className="font-display text-base sm:text-lg tracking-tight">{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] sm:max-h-[60vh] pr-1">
          <div className="space-y-3 sm:space-y-4 py-2 px-1">{children}</div>
        </ScrollArea>
        {confirming && (
          <div className="mx-1 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium text-center animate-in fade-in slide-in-from-bottom-1 duration-200">
            确定要{submitText}吗？再次按 <kbd className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono text-xs">Enter</kbd> 确认，按 <kbd className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono text-xs">ESC</kbd> 取消
          </div>
        )}
        <DialogFooter className="flex-row gap-2 sm:flex-row sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="flex-1 sm:flex-none rounded-xl">
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`flex-1 sm:flex-none rounded-xl transition-all duration-200 ${confirming ? 'ring-2 ring-amber-400 ring-offset-2 shadow-lg shadow-amber-200/50 scale-105' : ''}`}
          >
            {isSubmitting ? '保存中...' : (confirming ? `再次${submitText}` : submitText)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
