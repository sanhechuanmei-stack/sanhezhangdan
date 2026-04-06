import { useState } from 'react';
import { Plus, Pencil, Trash2, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { useAppData } from '@/hooks/useAppData';
import { uploadAttachment } from '@/lib/supabase';
import { useCalculations } from '@/hooks/useCalculations';
import { calcPartnerPaid, calcPartnerExpectedShare, calcProjectFinancials } from '@/lib/calculations';
import { FormDialog } from '@/components/shared/FormDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { DatePicker } from '@/components/shared/DatePicker';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { SharingRecord } from '@/types';

export default function SharingPage() {
  const { state, addSharing, updateSharing, deleteSharing } = useAppData();
  const [searchParams] = useSearchParams();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SharingRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SharingRecord | null>(null);

  // Filters
  const [filterProjectId, setFilterProjectId] = useState(searchParams.get('projectId') ?? 'all');
  const [filterPartnerId, setFilterPartnerId] = useState(searchParams.get('partnerId') ?? 'all');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  // Form state
  const [fDate, setFDate] = useState('');
  const [fProjectId, setFProjectId] = useState('');
  const [fPartnerId, setFPartnerId] = useState('');
  const [fAmount, setFAmount] = useState('');
  const [fPeriod, setFPeriod] = useState('');
  const [fNote, setFNote] = useState('');
  const [fAttachment, setFAttachment] = useState('');
  const [balanceWarning, setBalanceWarning] = useState('');

  const activeProjects = state.projects.filter((p) => p.status === 'active');

  // 选中项目的期次列表
  const formProject = fProjectId ? state.projects.find((p) => p.id === fProjectId) : null;
  const formProjectPeriods = formProject?.periods ?? [];

  // Partners available for selected project in form
  const formProjectPartners = fProjectId
    ? (() => {
        const proj = state.projects.find((p) => p.id === fProjectId);
        if (!proj) return [];
        const ids = new Set([...proj.partnerIds, proj.prioritySharing?.partnerId].filter(Boolean) as string[]);
        return state.partners.filter((p) => ids.has(p.id));
      })()
    : [];

  // Partners available for filter
  const filterProjectPartners = filterProjectId !== 'all'
    ? (() => {
        const proj = state.projects.find((p) => p.id === filterProjectId);
        if (!proj) return state.partners;
        const ids = new Set([...proj.partnerIds, proj.prioritySharing?.partnerId].filter(Boolean) as string[]);
        return state.partners.filter((p) => ids.has(p.id));
      })()
    : state.partners;

  // Filtered records
  const filteredRecords = state.sharingRecords
    .filter((r) => {
      if (r.isYearEnd) return false;
      if (filterProjectId !== 'all' && r.projectId !== filterProjectId) return false;
      if (filterPartnerId !== 'all' && r.partnerId !== filterPartnerId) return false;
      if (filterFrom && r.date < filterFrom) return false;
      if (filterTo && r.date > filterTo) return false;
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  function checkBalance(projectId: string, partnerId: string, amount: number, excludeId?: string) {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;
    const financials = calcProjectFinancials(project, state.bills, state.partners);
    const expected = calcPartnerExpectedShare(project, financials, partnerId, state.partners);
    const alreadyPaid = state.sharingRecords
      .filter((r) => !r.isYearEnd && r.projectId === projectId && r.partnerId === partnerId && r.id !== excludeId)
      .reduce((s, r) => s + r.amount, 0);
    const unpaid = expected - alreadyPaid;
    if (amount > unpaid) {
      setBalanceWarning(`超出未分成余额 ¥${unpaid.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}，确认继续？`);
    } else {
      setBalanceWarning('');
    }
  }

  function openAdd() {
    setEditTarget(null);
    const today = new Date().toISOString().split('T')[0];
    setFDate(today);
    setFProjectId(filterProjectId !== 'all' ? filterProjectId : '');
    setFPartnerId(filterPartnerId !== 'all' ? filterPartnerId : '');
    setFAmount(''); setFPeriod(''); setFNote(''); setFAttachment(''); setBalanceWarning('');
    setDialogOpen(true);
  }

  function openEdit(r: SharingRecord) {
    setEditTarget(r);
    setFDate(r.date); setFProjectId(r.projectId); setFPartnerId(r.partnerId);
    setFAmount(String(r.amount)); setFPeriod(r.period ?? ''); setFNote(r.note ?? ''); setFAttachment(r.attachment ?? '');
    setBalanceWarning('');
    setDialogOpen(true);
  }

  function handleSave() {
    if (!fDate) { toast.error('请选择日期'); return; }
    if (!fProjectId) { toast.error('请选择分成类型'); return; }
    if (!fPartnerId) { toast.error('请选择分成人员'); return; }
    if (!fAmount || parseFloat(fAmount) <= 0) { toast.error('请填写有效金额'); return; }

    const record: SharingRecord = {
      id: editTarget?.id ?? crypto.randomUUID(),
      date: fDate,
      projectId: fProjectId,
      partnerId: fPartnerId,
      amount: parseFloat(fAmount),
      period: fPeriod.trim() || undefined,
      note: fNote.trim() || undefined,
      attachment: fAttachment || undefined,
    };

    if (editTarget) {
      updateSharing(record);
      toast.success('已更新');
    } else {
      addSharing(record);
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

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">分成管理</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 sm:gap-2 bg-primary text-primary-foreground rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">新增分成记录</span>
          <span className="sm:hidden">新增</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        <select
          value={filterProjectId}
          onChange={(e) => { setFilterProjectId(e.target.value); setFilterPartnerId('all'); }}
          className="h-9 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="all">全部项目</option>
          {activeProjects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={filterPartnerId}
          onChange={(e) => setFilterPartnerId(e.target.value)}
          className="h-9 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="all">全部人员</option>
          {filterProjectPartners.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <div className="hidden sm:flex">
          <DateRangePicker
            from={filterFrom}
            to={filterTo}
            onFromChange={setFilterFrom}
            onToChange={setFilterTo}
          />
        </div>
        {(filterProjectId !== 'all' || filterPartnerId !== 'all' || filterFrom || filterTo) && (
          <button
            onClick={() => { setFilterProjectId('all'); setFilterPartnerId('all'); setFilterFrom(''); setFilterTo(''); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            清除筛选
          </button>
        )}
      </div>

      {/* Mobile: card list */}
      <div className="sm:hidden space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="card-solid rounded-2xl p-8 text-center text-sm text-muted-foreground">暂无分成记录</div>
        ) : (
          filteredRecords.map((r) => {
            const project = state.projects.find((p) => p.id === r.projectId);
            const partner = state.partners.find((p) => p.id === r.partnerId);
            return (
              <div key={r.id} className="card-solid rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-apple-purple/10 text-apple-purple text-[11px] px-1.5 py-0.5 rounded font-medium">
                      {project?.name ?? r.projectId}
                    </span>
                    {r.period && (
                      <span className="bg-apple-yellow/10 text-apple-yellow text-[11px] px-1.5 py-0.5 rounded font-medium">
                        {r.period}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{r.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {r.attachment && (
                      <a href={r.attachment} target="_blank" rel="noreferrer" className="p-1 text-muted-foreground">
                        <Paperclip className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <button onClick={() => openEdit(r)} className="p-1 text-muted-foreground hover:text-foreground">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteTarget(r)} className="p-1 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{partner?.name ?? r.partnerId}</span>
                  <span className="text-sm font-semibold text-apple-green num-display">¥{r.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                {r.note && <p className="text-xs text-muted-foreground mt-1">{r.note}</p>}
              </div>
            );
          })
        )}
      </div>

      {/* Desktop: table */}
      <div className="card-solid rounded-2xl overflow-hidden hidden sm:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 text-xs font-semibold text-muted-foreground">登记日期</th>
              <th className="text-left p-4 text-xs font-semibold text-muted-foreground">分成类型</th>
              <th className="text-left p-4 text-xs font-semibold text-muted-foreground">期次</th>
              <th className="text-left p-4 text-xs font-semibold text-muted-foreground">分成人员</th>
              <th className="text-right p-4 text-xs font-semibold text-muted-foreground">分成金额</th>
              <th className="text-left p-4 text-xs font-semibold text-muted-foreground">备注</th>
              <th className="text-center p-4 text-xs font-semibold text-muted-foreground">凭证</th>
              <th className="text-right p-4 text-xs font-semibold text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-sm text-muted-foreground">暂无分成记录</td>
              </tr>
            ) : (
              filteredRecords.map((r) => {
                const project = state.projects.find((p) => p.id === r.projectId);
                const partner = state.partners.find((p) => p.id === r.partnerId);
                return (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-background/50 transition-colors">
                    <td className="p-4 text-sm">{r.date}</td>
                    <td className="p-4 text-sm">
                      <span className="bg-apple-purple/10 text-apple-purple text-xs px-2 py-1 rounded-lg font-medium">
                        {project?.name ?? r.projectId}
                      </span>
                    </td>
                    <td className="p-4 text-sm">
                      {r.period ? (
                        <span className="bg-apple-yellow/10 text-apple-yellow text-xs px-2 py-1 rounded-lg font-medium">{r.period}</span>
                      ) : ''}
                    </td>
                    <td className="p-4 text-sm font-medium">{partner?.name ?? r.partnerId}</td>
                    <td className="p-4 text-sm text-right font-semibold text-apple-green num-display">
                      ¥{r.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{r.note ?? ''}</td>
                    <td className="p-4 text-center">
                      {r.attachment && (
                        <a href={r.attachment} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                          <Paperclip className="h-4 w-4 inline" />
                        </a>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(r)}
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(r)}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Dialog */}
      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editTarget ? '编辑分成记录' : '新增分成记录'}
        onSubmit={handleSave}
      >
        <div className="space-y-2">
          <Label>登记日期</Label>
          <DatePicker value={fDate} onChange={setFDate} placeholder="选择登记日期" />
        </div>

        <div className="space-y-2">
          <Label>分成类型（项目）</Label>
          <select
            value={fProjectId}
            onChange={(e) => { setFProjectId(e.target.value); setFPartnerId(''); setFPeriod(''); setBalanceWarning(''); }}
            className="w-full h-9 rounded-xl border border-input bg-background px-3 text-sm"
          >
            <option value="">请选择项目</option>
            {state.projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>分成人员</Label>
          <select
            value={fPartnerId}
            onChange={(e) => {
              setFPartnerId(e.target.value);
              if (fProjectId && e.target.value && fAmount) {
                checkBalance(fProjectId, e.target.value, parseFloat(fAmount), editTarget?.id);
              }
            }}
            className="w-full h-9 rounded-xl border border-input bg-background px-3 text-sm"
            disabled={!fProjectId}
          >
            <option value="">请选择人员</option>
            {formProjectPartners.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {formProjectPeriods.length > 0 && (
          <div className="space-y-2">
            <Label>期次</Label>
            <select
              value={fPeriod}
              onChange={(e) => setFPeriod(e.target.value)}
              className="w-full h-9 rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="">请选择期次</option>
              {formProjectPeriods.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <Label>分成金额</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={fAmount}
            onChange={(e) => {
              setFAmount(e.target.value);
              if (fProjectId && fPartnerId && e.target.value) {
                checkBalance(fProjectId, fPartnerId, parseFloat(e.target.value), editTarget?.id);
              }
            }}
            placeholder="0.00"
          />
          {balanceWarning && (
            <p className="text-xs text-apple-yellow font-medium">{balanceWarning}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>备注（可选）</Label>
          <Input value={fNote} onChange={(e) => setFNote(e.target.value)} placeholder="备注信息" onKeyDown={(e) => e.key === 'Enter' && handleSave()} />
        </div>

        <div className="space-y-2">
          <Label>凭证附件（可选，最大2MB）</Label>
          <Input type="file" accept="image/*,.pdf" onChange={handleAttachment} />
          {fAttachment && <p className="text-xs text-apple-green">已上传凭证</p>}
        </div>
      </FormDialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="确认删除"
        description="确定要删除这条分成记录吗？"
        onConfirm={() => {
          if (deleteTarget) { deleteSharing(deleteTarget.id); toast.success('已删除'); setDeleteTarget(null); }
        }}
        variant="destructive"
        confirmText="删除"
      />
    </div>
  );
}
