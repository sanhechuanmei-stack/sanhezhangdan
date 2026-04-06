import { useState } from 'react';
import { Plus, Pencil, Trash2, Filter, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { useAppData } from '@/hooks/useAppData';
import { uploadAttachment } from '@/lib/supabase';
import { FormDialog } from '@/components/shared/FormDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { DatePicker } from '@/components/shared/DatePicker';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { BillRecord } from '@/types';

interface BusinessBillPageProps {
  projectId: string;
  title: string;
  accentColor: string; // e.g. 'pink' | 'purple' | 'amber'
  showPeriodFilter?: boolean;
}

export function BusinessBillPage({ projectId, title, accentColor, showPeriodFilter }: BusinessBillPageProps) {
  const { state, addBill, updateBill, deleteBill } = useAppData();
  const project = state.projects.find((p) => p.id === projectId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BillRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BillRecord | null>(null);
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all');

  // Form state
  const [fDate, setFDate] = useState('');
  const [fType, setFType] = useState<'income' | 'expense'>('income');
  const [fIncome, setFIncome] = useState('');
  const [fIncomeNote, setFIncomeNote] = useState('');
  const [fExpCat, setFExpCat] = useState('');
  const [fExpense, setFExpense] = useState('');
  const [fExpNote, setFExpNote] = useState('');
  const [fPeriod, setFPeriod] = useState('');
  const [fAttachment, setFAttachment] = useState('');
  const [fCustomerName, setFCustomerName] = useState('');
  const [fCustomerPhone, setFCustomerPhone] = useState('');

  const extraFields = project?.extraFields || [];

  const allBills = state.bills
    .filter((b) => b.projectId === projectId)
    .sort((a, b) => b.date.localeCompare(a.date));

  // Derive unique periods
  const periods = [...new Set(allBills.map((b) => b.period).filter(Boolean))] as string[];

  // Apply filters
  const filteredBills = allBills.filter((b) => {
    if (filterFrom && b.date < filterFrom) return false;
    if (filterTo && b.date > filterTo) return false;
    if (showPeriodFilter && filterPeriod !== 'all' && b.period !== filterPeriod) return false;
    return true;
  });

  const totalIncome = filteredBills.reduce((s, b) => s + (b.income ?? 0), 0);
  const totalExpense = filteredBills.reduce((s, b) => s + (b.expense ?? 0), 0);

  function openAdd() {
    setEditTarget(null);
    const today = new Date().toISOString().split('T')[0];
    setFDate(today); setFType('income');
    setFIncome(''); setFIncomeNote('');
    setFExpCat(''); setFExpense(''); setFExpNote('');
    setFPeriod(''); setFAttachment('');
    setFCustomerName(''); setFCustomerPhone('');
    setDialogOpen(true);
  }

  function openEdit(b: BillRecord) {
    setEditTarget(b);
    setFDate(b.date);
    setFType(b.income !== undefined ? 'income' : 'expense');
    setFIncome(b.income !== undefined ? String(b.income) : '');
    setFIncomeNote(b.incomeNote ?? '');
    setFExpCat(b.expenseCategory ?? '');
    setFExpense(b.expense !== undefined ? String(b.expense) : '');
    setFExpNote(b.expenseNote ?? '');
    setFPeriod(b.period ?? '');
    setFAttachment(b.attachment ?? '');
    setFCustomerName(b.customerName ?? '');
    setFCustomerPhone(b.customerPhone ?? '');
    setDialogOpen(true);
  }

  function handleSave() {
    if (!fDate) { toast.error('请选择日期'); return; }
    if (fType === 'income' && !fIncome) { toast.error('请填写收入金额'); return; }
    if (fType === 'expense' && !fExpense) { toast.error('请填写支出金额'); return; }
    if (showPeriodFilter && !fPeriod) { toast.error('请选择期次'); return; }

    const bill: BillRecord = {
      id: editTarget?.id ?? crypto.randomUUID(),
      projectId,
      date: fDate,
      ...(fType === 'income' ? {
        income: parseFloat(fIncome),
        incomeNote: fIncomeNote.trim() || undefined,
      } : {
        expenseCategory: fExpCat || undefined,
        expense: parseFloat(fExpense),
        expenseNote: fExpNote.trim() || undefined,
      }),
      period: fPeriod.trim() || undefined,
      attachment: fAttachment || undefined,
      customerName: fCustomerName.trim() || undefined,
      customerPhone: fCustomerPhone.trim() || undefined,
    };

    if (editTarget) {
      updateBill(bill);
      toast.success('已更新');
    } else {
      addBill(bill);
      toast.success('已添加');
    }
    setDialogOpen(false);
  }

  async function handleAttachment(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('文件大小不能超过 2MB'); return; }
    try {
      toast.loading('正在上传附件...');
      const url = await uploadAttachment(file);
      setFAttachment(url);
      toast.dismiss();
      toast.success('附件上传成功');
    } catch (err) {
      toast.dismiss();
      toast.error('附件上传失败');
    }
  }

  const borderClass = `card-accent-${accentColor}`;

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">{title}</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 sm:gap-2 bg-primary text-primary-foreground rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">新增账目</span>
          <span className="sm:hidden">新增</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        <DateRangePicker
          from={filterFrom}
          to={filterTo}
          onFromChange={setFilterFrom}
          onToChange={setFilterTo}
        />
        {showPeriodFilter && periods.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="h-9 rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="all">全部期次</option>
              {periods.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        )}
        {(filterFrom || filterTo || filterPeriod !== 'all') && (
          <button
            onClick={() => { setFilterFrom(''); setFilterTo(''); setFilterPeriod('all'); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            清除筛选
          </button>
        )}
      </div>

      {/* Summary bar on mobile */}
      {filteredBills.length > 0 && (
        <div className="flex gap-3 sm:hidden">
          <div className="flex-1 card-solid rounded-xl p-3 text-center">
            <p className="text-[11px] text-muted-foreground">总收入</p>
            <p className="text-sm font-bold text-apple-green">¥{totalIncome.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="flex-1 card-solid rounded-xl p-3 text-center">
            <p className="text-[11px] text-muted-foreground">总支出</p>
            <p className="text-sm font-bold text-apple-red">¥{totalExpense.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      )}

      {/* Mobile: card list */}
      <div className="sm:hidden space-y-3">
        {filteredBills.length === 0 ? (
          <div className="card-solid rounded-2xl p-8 text-center text-sm text-muted-foreground">暂无账单记录</div>
        ) : (
          filteredBills.map((b) => (
            <div key={b.id} className={`card-solid rounded-xl p-4 ${borderClass}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{b.date}</span>
                  {b.period && (
                    <span className="bg-apple-yellow/10 text-apple-yellow text-[11px] px-1.5 py-0.5 rounded font-medium">{b.period}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {b.attachment && (
                    <a href={b.attachment} target="_blank" rel="noreferrer" className="p-1 text-muted-foreground">
                      <Paperclip className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <button onClick={() => openEdit(b)} className="p-1 text-muted-foreground hover:text-foreground">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setDeleteTarget(b)} className="p-1 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {b.income !== undefined && (
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">{b.incomeNote || '收入'}</span>
                    {(b.customerName || b.customerPhone) && (
                      <span className="text-[11px] text-muted-foreground/70">
                        {b.customerName}{b.customerName && b.customerPhone ? ' ' : ''}{b.customerPhone}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-apple-green">+¥{b.income.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              {b.expense !== undefined && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {b.expenseCategory && (
                      <span className="bg-muted text-muted-foreground text-[11px] px-1.5 py-0.5 rounded">{b.expenseCategory}</span>
                    )}
                    <span className="text-xs text-muted-foreground">{b.expenseNote || ''}</span>
                  </div>
                  <span className="text-sm font-semibold text-apple-red">-¥{b.expense.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop: table */}
      <div className={`card-solid rounded-2xl overflow-hidden ${borderClass} hidden sm:block`}>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <colgroup>
              <col className="w-[11%]" />{/* 发生日期 */}
              {showPeriodFilter && <col className="w-[7%]" />}{/* 期次 */}
              <col className="w-[13%]" />{/* 收入金额 */}
              <col className="w-[14%]" />{/* 备注 */}
              <col className="w-[12%]" />{/* 支出项目 */}
              <col className="w-[11%]" />{/* 支出金额 */}
              <col className="w-[14%]" />{/* 支出备注 */}
              <col className="w-[8%]" />{/* 凭证 */}
              <col className="w-[10%]" />{/* 操作 */}
            </colgroup>
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground">发生日期</th>
                {showPeriodFilter && <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground">期次</th>}
                <th className="text-center px-3 py-3 text-xs font-semibold text-muted-foreground">收入金额</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground">备注</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground">支出项目</th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-muted-foreground">支出金额</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground">支出备注</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-muted-foreground">凭证</th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={showPeriodFilter ? 9 : 8} className="p-8 text-center text-sm text-muted-foreground">
                    暂无账单记录
                  </td>
                </tr>
              ) : (
                filteredBills.map((b) => (
                  <tr key={b.id} className="border-b border-border/50 hover:bg-background/50 transition-colors">
                    <td className="px-3 py-3 text-sm">{b.date}</td>
                    {showPeriodFilter && (
                      <td className="px-3 py-3 text-sm">
                        {b.period ? (
                          <span className="bg-apple-yellow/10 text-apple-yellow text-xs px-2 py-1 rounded-lg font-medium">{b.period}</span>
                        ) : ''}
                      </td>
                    )}
                    <td className="px-3 py-3 text-sm text-center font-semibold text-apple-green num-display">
                      {b.income ? (
                        <div className="flex flex-col items-center">
                          <span>¥{b.income.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          {(b.customerName || b.customerPhone) && (
                            <span className="text-[11px] font-normal text-muted-foreground/70">
                              {b.customerName}{b.customerName && b.customerPhone ? ' ' : ''}{b.customerPhone}
                            </span>
                          )}
                        </div>
                      ) : ''}
                    </td>
                    <td className="px-3 py-3 text-sm text-muted-foreground">{b.incomeNote ?? ''}</td>
                    <td className="px-3 py-3 text-sm">
                      {b.expenseCategory ? (
                        <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-lg">{b.expenseCategory}</span>
                      ) : ''}
                    </td>
                    <td className="px-3 py-3 text-sm text-right font-semibold text-apple-red num-display">
                      {b.expense ? `¥${b.expense.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                    </td>
                    <td className="px-3 py-3 text-sm text-muted-foreground">{b.expenseNote ?? ''}</td>
                    <td className="px-3 py-3 text-center">
                      {b.attachment && (
                        <a href={b.attachment} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                          <Paperclip className="h-4 w-4 inline" />
                        </a>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(b)}
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(b)}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredBills.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-border bg-background/30">
                  <td className="px-3 py-3 text-sm font-semibold" colSpan={showPeriodFilter ? 2 : 1}>合计</td>
                  <td className="px-3 py-3 text-sm text-center font-bold text-apple-green num-display">
                    {totalIncome > 0 ? `¥${totalIncome.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                  </td>
                  <td colSpan={2} />
                  <td className="px-3 py-3 text-sm text-right font-bold text-apple-red num-display">
                    {totalExpense > 0 ? `¥${totalExpense.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                  </td>
                  <td colSpan={showPeriodFilter ? 3 : 2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editTarget ? '编辑账目' : '新增账目'}
        onSubmit={handleSave}
      >
        <div className="space-y-2">
          <Label>发生日期</Label>
          <DatePicker value={fDate} onChange={setFDate} placeholder="选择发生日期" />
        </div>

        <div className="space-y-2">
          <Label>类型</Label>
          <div className="flex gap-2">
            {(['income', 'expense'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFType(t)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  fType === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'income' ? '收入' : '支出'}
              </button>
            ))}
          </div>
        </div>

        {fType === 'income' ? (
          <>
            <div className="space-y-2">
              <Label>收入金额</Label>
              <Input type="number" min="0" step="0.01" value={fIncome} onChange={(e) => setFIncome(e.target.value)} placeholder="0.00" onKeyDown={(e) => e.key === 'Enter' && handleSave()} />
            </div>
            <div className="space-y-2">
              <Label>备注（可选）</Label>
              <Input value={fIncomeNote} onChange={(e) => setFIncomeNote(e.target.value)} placeholder="收入说明" onKeyDown={(e) => e.key === 'Enter' && handleSave()} />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label>支出项目</Label>
              <select
                value={fExpCat}
                onChange={(e) => setFExpCat(e.target.value)}
                className="w-full h-9 rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="">请选择支出项目</option>
                {state.expenseCategories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>支出金额</Label>
              <Input type="number" min="0" step="0.01" value={fExpense} onChange={(e) => setFExpense(e.target.value)} placeholder="0.00" onKeyDown={(e) => e.key === 'Enter' && handleSave()} />
            </div>
            <div className="space-y-2">
              <Label>支出备注（可选）</Label>
              <Input value={fExpNote} onChange={(e) => setFExpNote(e.target.value)} placeholder="支出说明" onKeyDown={(e) => e.key === 'Enter' && handleSave()} />
            </div>
          </>
        )}

        {showPeriodFilter && (
          <div className="space-y-2">
            <Label>期次</Label>
            {project?.periods && project.periods.length > 0 ? (
              <select
                value={fPeriod}
                onChange={(e) => setFPeriod(e.target.value)}
                className="w-full h-9 rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="">请选择期次</option>
                {project.periods.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            ) : (
              <>
                <Input
                  value={fPeriod}
                  onChange={(e) => setFPeriod(e.target.value)}
                  placeholder="例如：第5期"
                  list="period-suggestions"
                />
                <datalist id="period-suggestions">
                  {periods.map((p) => <option key={p} value={p} />)}
                </datalist>
              </>
            )}
          </div>
        )}

        {extraFields.includes('customerName') && (
          <div className="space-y-2">
            <Label>客户姓名（可选）</Label>
            <Input value={fCustomerName} onChange={(e) => setFCustomerName(e.target.value)} placeholder="客户姓名" onKeyDown={(e) => e.key === 'Enter' && handleSave()} />
          </div>
        )}

        {extraFields.includes('customerPhone') && (
          <div className="space-y-2">
            <Label>手机号（可选）</Label>
            <Input value={fCustomerPhone} onChange={(e) => setFCustomerPhone(e.target.value)} placeholder="手机号" onKeyDown={(e) => e.key === 'Enter' && handleSave()} />
          </div>
        )}

        <div className="space-y-2">
          <Label>凭证附件（可选，最大2MB）</Label>
          <Input type="file" accept="image/*,.pdf" onChange={handleAttachment} />
          {fAttachment && (
            <p className="text-xs text-apple-green">已上传凭证</p>
          )}
        </div>
      </FormDialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="确认删除"
        description="确定要删除这条账目记录吗？"
        onConfirm={() => {
          if (deleteTarget) { deleteBill(deleteTarget.id); toast.success('已删除'); setDeleteTarget(null); }
        }}
        variant="destructive"
        confirmText="删除"
      />
    </div>
  );
}

export function YanxishePage() {
  const { state } = useAppData();
  const project = state.projects.find((p) => p.name === '研习社');
  if (!project) return <div className="p-6 text-muted-foreground">项目未找到</div>;
  return <BusinessBillPage projectId={project.id} title="研习社" accentColor="pink" />;
}

export function XiaojiandaoPage() {
  const { state } = useAppData();
  const project = state.projects.find((p) => p.name === '三和·小剪刀');
  if (!project) return <div className="p-6 text-muted-foreground">项目未找到</div>;
  return <BusinessBillPage projectId={project.id} title="三和·小剪刀" accentColor="purple" />;
}

export function OfflineCoursePage() {
  const { state } = useAppData();
  const project = state.projects.find((p) => state.bills.some((b) => b.projectId === p.id && b.period));
  if (!project) return <div className="p-6 text-muted-foreground">项目未找到</div>;
  return <BusinessBillPage projectId={project.id} title={project.name} accentColor="amber" showPeriodFilter />;
}
