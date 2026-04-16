import { useEffect, useState, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onConfirm: () => void;
  variant?: 'default' | 'destructive';
  confirmText?: string;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  variant = 'default',
  confirmText = '确认',
}: ConfirmDialogProps) {
  const [confirming, setConfirming] = useState(false);

  // 弹窗关闭时重置确认状态
  useEffect(() => {
    if (!open) setConfirming(false);
  }, [open]);

  const handleConfirm = useCallback(() => {
    onConfirm();
  }, [onConfirm]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && confirming) {
        e.preventDefault();
        e.stopPropagation();
        setConfirming(false);
        return;
      }
      if (e.key === 'Enter' && !e.isComposing) {
        e.preventDefault();
        if (confirming) {
          handleConfirm();
          setConfirming(false);
        } else {
          setConfirming(true);
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [open, confirming, handleConfirm]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl w-[calc(100vw-2rem)] sm:w-full max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        {confirming && (
          <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium text-center animate-in fade-in slide-in-from-bottom-1 duration-200">
            确定要{confirmText}吗？再次按 <kbd className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono text-xs">Enter</kbd> 确认，按 <kbd className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono text-xs">ESC</kbd> 取消
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={`transition-all duration-200 ${variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''} ${confirming ? 'ring-2 ring-amber-400 ring-offset-2 shadow-lg shadow-amber-200/50 scale-105' : ''}`}
          >
            {confirming ? `再次${confirmText}` : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
