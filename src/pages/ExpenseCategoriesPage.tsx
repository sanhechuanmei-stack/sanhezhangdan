import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAppData } from '@/hooks/useAppData';
import { FormDialog } from '@/components/shared/FormDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { ExpenseCategory } from '@/types';

export default function ExpenseCategoriesPage() {
  const { state, addCategory, updateCategory, deleteCategory } = useAppData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ExpenseCategory | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ExpenseCategory | null>(null);

  function openAdd() {
    setEditTarget(null);
    setNameInput('');
    setDialogOpen(true);
  }

  function openEdit(cat: ExpenseCategory) {
    setEditTarget(cat);
    setNameInput(cat.name);
    setDialogOpen(true);
  }

  function handleSave() {
    const name = nameInput.trim();
    if (!name) { toast.error('分类名称不能为空'); return; }
    const duplicate = state.expenseCategories.find((c) => c.name === name && c.id !== editTarget?.id);
    if (duplicate) { toast.error('该分类名称已存在'); return; }
    if (editTarget) {
      updateCategory({ ...editTarget, name });
      toast.success('已更新');
    } else {
      addCategory({ id: crypto.randomUUID(), name });
      toast.success('已添加');
    }
    setDialogOpen(false);
  }

  function handleDelete(cat: ExpenseCategory) {
    const inUse = state.bills.some((b) => b.expenseCategory === cat.name);
    if (inUse) { toast.error('该分类已被账单使用，无法删除'); return; }
    setDeleteTarget(cat);
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">支出项目</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 sm:gap-2 bg-primary text-primary-foreground rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">新增分类</span>
          <span className="sm:hidden">新增</span>
        </button>
      </div>

      {/* Mobile: card list */}
      <div className="sm:hidden space-y-2">
        {state.expenseCategories.length === 0 ? (
          <div className="card-solid rounded-2xl p-8 text-center text-sm text-muted-foreground">暂无分类</div>
        ) : (
          state.expenseCategories.map((cat, i) => (
            <div key={cat.id} className="card-solid rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-5 text-center">{i + 1}</span>
                <span className="text-sm font-medium">{cat.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(cat)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop: table */}
      <div className="card-solid rounded-2xl overflow-hidden hidden sm:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 text-xs font-semibold text-muted-foreground w-12">#</th>
              <th className="text-left p-4 text-xs font-semibold text-muted-foreground">分类名称</th>
              <th className="text-right p-4 text-xs font-semibold text-muted-foreground w-24">操作</th>
            </tr>
          </thead>
          <tbody>
            {state.expenseCategories.map((cat, i) => (
              <tr key={cat.id} className="border-b border-border/50 hover:bg-background/50 transition-colors">
                <td className="p-4 text-sm text-muted-foreground">{i + 1}</td>
                <td className="p-4 text-sm font-medium">{cat.name}</td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEdit(cat)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editTarget ? '编辑分类' : '新增分类'}
        onSubmit={handleSave}
      >
        <div className="space-y-2">
          <Label>分类名称</Label>
          <Input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="请输入分类名称"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
        </div>
      </FormDialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="确认删除"
        description={`确定要删除分类「${deleteTarget?.name}」吗？`}
        onConfirm={() => { if (deleteTarget) { deleteCategory(deleteTarget.id); toast.success('已删除'); setDeleteTarget(null); } }}
        variant="destructive"
        confirmText="删除"
      />
    </div>
  );
}
