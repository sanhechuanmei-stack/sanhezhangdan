import { useState, useEffect } from 'react';
import { Plus, Settings, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAppData } from '@/hooks/useAppData';
import { useCalculations } from '@/hooks/useCalculations';
import { FormDialog } from '@/components/shared/FormDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { Project } from '@/types';

const PROJECT_TYPES = [
  { value: 'internal', label: '内部项目' },
  { value: 'cooperation', label: '合作项目' },
] as const;

const PROJECT_STATUSES = [
  { value: 'active', label: '进行中' },
  { value: 'ended', label: '已结束' },
  { value: 'disabled', label: '停用' },
] as const;

const statusColors: Record<string, string> = {
  active: 'bg-apple-green/10 text-apple-green',
  ended: 'bg-muted text-muted-foreground',
  disabled: 'bg-apple-red/10 text-apple-red',
};

const statusLabels: Record<string, string> = {
  active: '进行中', ended: '已结束', disabled: '停用',
};

export default function ProjectsPage() {
  const { state, addProject, updateProject, deleteProject } = useAppData();
  const { projectFinancials } = useCalculations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [ratioConfirmOpen, setRatioConfirmOpen] = useState(false);
  const [pendingSave, setPendingSave] = useState<Project | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<Project['type']>('regular');
  const [status, setStatus] = useState<Project['status']>('active');
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [ratios, setRatios] = useState<Record<string, string>>({});
  const [priorityPartnerId, setPriorityPartnerId] = useState('');
  const [priorityPct, setPriorityPct] = useState('');
  const [periods, setPeriods] = useState<string[]>([]);
  const [excludedPeriods, setExcludedPeriods] = useState<string[]>([]);
  const [newPeriod, setNewPeriod] = useState('');
  const [notes, setNotes] = useState('');
  const [extraFields, setExtraFields] = useState<string[]>([]);

  function openAdd() {
    setEditTarget(null);
    setName(''); setType('internal'); setStatus('active');
    setSelectedPartners([]); setRatios({});
    setPriorityPartnerId(''); setPriorityPct('');
    setPeriods([]); setNewPeriod(''); setExcludedPeriods([]);
    setNotes('');
    setExtraFields([]);
    setDialogOpen(true);
  }

  function openEdit(p: Project) {
    setEditTarget(p);
    setName(p.name); setType(p.type); setStatus(p.status);
    setSelectedPartners([...p.partnerIds]);
    const r: Record<string, string> = {};
    for (const [k, v] of Object.entries(p.sharingRatios)) r[k] = String(v);
    setRatios(r);
    setPriorityPartnerId(p.prioritySharing?.partnerId ?? '');
    setPriorityPct(p.prioritySharing ? String(p.prioritySharing.percentage) : '');
    setPeriods(p.periods ? [...p.periods] : []);
    setExcludedPeriods(p.excludedPeriods ? [...p.excludedPeriods] : []);
    setNewPeriod('');
    setNotes(p.notes ?? '');
    setExtraFields(p.extraFields ? [...p.extraFields] : []);
    setDialogOpen(true);
  }

  // When partners change, initialize missing ratios
  useEffect(() => {
    setRatios((prev) => {
      const next = { ...prev };
      for (const id of selectedPartners) {
        if (!(id in next)) next[id] = '';
      }
      // Remove deselected
      for (const id of Object.keys(next)) {
        if (!selectedPartners.includes(id)) delete next[id];
      }
      return next;
    });
  }, [selectedPartners]);

  function togglePartner(id: string) {
    setSelectedPartners((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function distributeEvenly() {
    if (selectedPartners.length === 0) return;
    const each = (100 / selectedPartners.length).toFixed(2);
    const r: Record<string, string> = {};
    selectedPartners.forEach((id, i) => {
      // Last one gets the remainder to ensure sum = 100
      if (i === selectedPartners.length - 1) {
        const used = selectedPartners.slice(0, -1).reduce((s) => s + parseFloat(each), 0);
        r[id] = String(Math.round((100 - used) * 100) / 100);
      } else {
        r[id] = each;
      }
    });
    setRatios(r);
  }

  function validateAndSave() {
    if (!name.trim()) { toast.error('项目名称不能为空'); return; }
    if (selectedPartners.length === 0) { toast.error('请至少选择一位合伙人'); return; }
    const ratioSum = selectedPartners.reduce((s, id) => s + (parseFloat(ratios[id] ?? '0') || 0), 0);
    if (Math.abs(ratioSum - 100) > 0.1) {
      toast.error(`分成比例之和为 ${ratioSum.toFixed(2)}%，必须等于 100%`);
      return;
    }

    const sharingRatios: Record<string, number> = {};
    for (const id of selectedPartners) sharingRatios[id] = parseFloat(ratios[id] ?? '0');

    const project: Project = {
      id: editTarget?.id ?? crypto.randomUUID(),
      name: name.trim(),
      type,
      status,
      partnerIds: selectedPartners,
      sharingRatios,
      notes: notes.trim() || undefined,
      periods: periods.length > 0 ? periods : undefined,
      excludedPeriods: excludedPeriods.length > 0 ? excludedPeriods : undefined,
      extraFields: extraFields.length > 0 ? extraFields : undefined,
      prioritySharing: (priorityPartnerId && priorityPct)
        ? { partnerId: priorityPartnerId, percentage: parseFloat(priorityPct) }
        : undefined,
    };

    // If editing and ratios changed, warn user
    if (editTarget) {
      const ratiosChanged = JSON.stringify(editTarget.sharingRatios) !== JSON.stringify(sharingRatios);
      if (ratiosChanged && (state.bills.some((b) => b.projectId === editTarget.id) || state.sharingRecords.some((r) => r.projectId === editTarget.id))) {
        setPendingSave(project);
        setRatioConfirmOpen(true);
        return;
      }
    }
    doSave(project);
  }

  function doSave(project: Project) {
    if (editTarget) {
      updateProject(project);
      toast.success('已更新');
    } else {
      addProject(project);
      toast.success('已添加');
    }
    setDialogOpen(false);
    setPendingSave(null);
  }

  function handleDelete(p: Project) {
    const hasBills = state.bills.some((b) => b.projectId === p.id);
    const hasSharing = state.sharingRecords.some((r) => r.projectId === p.id);
    if (hasBills || hasSharing) {
      toast.error('该项目已有关联账单或分成记录，无法删除');
      return;
    }
    setDeleteTarget(p);
  }

  const activePartners = state.partners.filter((p) => p.status === 'active');

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">项目管理</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 sm:gap-2 bg-primary text-primary-foreground rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">新增项目</span>
          <span className="sm:hidden">新增</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {state.projects.map((p) => {
          const fin = projectFinancials.find((f) => f.projectId === p.id);
          const partners = state.partners.filter((pt) => p.partnerIds.includes(pt.id));
          return (
            <div key={p.id} className="card-solid rounded-2xl p-4 sm:p-5 card-hover-lift">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-display font-bold text-[15px] text-foreground tracking-tight">{p.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {PROJECT_TYPES.find((t) => t.value === p.type)?.label}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[p.status]}`}>
                      {statusLabels[p.status]}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(p)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(p)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-1.5">参与合伙人</p>
                <div className="flex flex-wrap gap-1.5">
                  {partners.map((pt) => (
                    <span key={pt.id} className="text-xs bg-background rounded-lg px-2 py-1">
                      {pt.name} {p.sharingRatios[pt.id] ? `${p.sharingRatios[pt.id]}%` : ''}
                    </span>
                  ))}
                  {p.prioritySharing && (
                    <span className="text-xs bg-apple-yellow/10 text-apple-yellow rounded-lg px-2 py-1">
                      {state.partners.find((pt) => pt.id === p.prioritySharing!.partnerId)?.name} 优先{p.prioritySharing.percentage}%
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-3 border-t border-border">
                <div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground">总收入</p>
                  <p className="font-display font-bold text-foreground text-sm sm:text-[15px] num-display">¥{(fin?.totalIncome ?? 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground">总支出</p>
                  <p className="font-display font-bold text-apple-red text-sm sm:text-[15px] num-display">¥{(fin?.totalExpense ?? 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground">即时可分成</p>
                  <p className="font-display font-bold text-apple-green text-sm sm:text-[15px] num-display">¥{(fin?.instantShareable ?? 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Dialog */}
      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editTarget ? '编辑项目' : '新增项目'}
        onSubmit={validateAndSave}
      >
        <div className="space-y-2">
          <Label>项目名称</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入项目名称" onKeyDown={(e) => e.key === 'Enter' && validateAndSave()} />
        </div>

        <div className="space-y-2">
          <Label>项目类型</Label>
          <div className="flex gap-2 flex-wrap">
            {PROJECT_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                  type === t.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>项目状态</Label>
          <div className="flex gap-2">
            {PROJECT_STATUSES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStatus(s.value)}
                className={`flex-1 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                  status === s.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>参与合伙人</Label>
          <div className="flex flex-wrap gap-2">
            {activePartners.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePartner(p.id)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                  selectedPartners.includes(p.id) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {selectedPartners.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>分成比例（合计须为100%）</Label>
              <button
                type="button"
                onClick={distributeEvenly}
                className="text-xs text-primary hover:underline"
              >
                均分
              </button>
            </div>
            <div className="space-y-2">
              {selectedPartners.map((id) => {
                const partner = state.partners.find((p) => p.id === id);
                return (
                  <div key={id} className="flex items-center gap-3">
                    <span className="text-sm w-16 shrink-0">{partner?.name}</span>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={ratios[id] ?? ''}
                      onChange={(e) => setRatios((prev) => ({ ...prev, [id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && validateAndSave()}
                      placeholder="0"
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground">
                当前合计：{selectedPartners.reduce((s, id) => s + (parseFloat(ratios[id] ?? '0') || 0), 0).toFixed(2)}%
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2 p-3 bg-apple-yellow/5 rounded-xl border border-apple-yellow/20">
          <Label className="text-apple-yellow">优先分成配置（可选）</Label>
          <div className="flex items-center gap-3">
            <select
              value={priorityPartnerId}
              onChange={(e) => setPriorityPartnerId(e.target.value)}
              className="flex-1 h-9 rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="">选择优先分成人</option>
              {state.partners.filter((p) => p.status === 'active').map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <Input
              type="number"
              min="0"
              max="100"
              value={priorityPct}
              onChange={(e) => setPriorityPct(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && validateAndSave()}
              placeholder="比例"
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
          <p className="text-xs text-muted-foreground">优先分成人先从毛利润中提取固定比例，剩余再按常规比例分配</p>
        </div>

        <div className="space-y-2">
          <Label>期次管理（可选）</Label>
          <div className="space-y-2">
            {periods.map((period, idx) => {
              const isExcluded = excludedPeriods.includes(period);
              return (
                <div key={idx} className="flex items-center gap-2">
                  <span className="flex-1 text-sm bg-background rounded-lg px-3 py-2 border border-border">
                    {period}
                  </span>
                  <button
                    type="button"
                    onClick={() => setExcludedPeriods((prev) =>
                      isExcluded ? prev.filter((p) => p !== period) : [...prev, period]
                    )}
                    className={`text-[11px] px-2 py-1 rounded-lg border transition-colors shrink-0 ${
                      isExcluded
                        ? 'bg-apple-orange/10 text-apple-orange border-apple-orange/30'
                        : 'bg-muted text-muted-foreground border-border hover:border-apple-orange/30 hover:text-apple-orange'
                    }`}
                  >
                    {isExcluded ? '不参与彩蛋' : '参与彩蛋'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPeriods((prev) => prev.filter((_, i) => i !== idx));
                      setExcludedPeriods((prev) => prev.filter((p) => p !== period));
                    }}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
            <div className="flex items-center gap-2">
              <Input
                value={newPeriod}
                onChange={(e) => setNewPeriod(e.target.value)}
                placeholder="输入新期次名称..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newPeriod.trim() && !periods.includes(newPeriod.trim())) {
                      setPeriods((prev) => [...prev, newPeriod.trim()]);
                      setNewPeriod('');
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (newPeriod.trim() && !periods.includes(newPeriod.trim())) {
                    setPeriods((prev) => [...prev, newPeriod.trim()]);
                    setNewPeriod('');
                  }
                }}
                className="px-3 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                添加
              </button>
            </div>
            <p className="text-xs text-muted-foreground">用于记账时选择期次，如"广州站"、"第6期"、"2026春季班"等</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>记账时需要填写的额外字段（可选）</Label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'customerName', label: '客户姓名' },
              { value: 'customerPhone', label: '手机号' },
            ].map((field) => (
              <button
                key={field.value}
                type="button"
                onClick={() => setExtraFields((prev) =>
                  prev.includes(field.value) ? prev.filter((f) => f !== field.value) : [...prev, field.value]
                )}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                  extraFields.includes(field.value) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {field.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">勾选后，在该业务页面记账时会显示对应的输入框</p>
        </div>

        <div className="space-y-2">
          <Label>备注（可选）</Label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="备注信息" onKeyDown={(e) => e.key === 'Enter' && validateAndSave()} />
        </div>
      </FormDialog>

      {/* Ratio change warning */}
      <ConfirmDialog
        open={ratioConfirmOpen}
        onOpenChange={(open) => { if (!open) { setRatioConfirmOpen(false); setPendingSave(null); } }}
        title="修改分成比例"
        description="修改分成比例将影响该项目所有历史数据的分成计算结果，确认继续？"
        onConfirm={() => { if (pendingSave) { doSave(pendingSave); setRatioConfirmOpen(false); } }}
        confirmText="确认修改"
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="确认删除"
        description={`确定要删除项目「${deleteTarget?.name}」吗？`}
        onConfirm={() => {
          if (deleteTarget) { deleteProject(deleteTarget.id); toast.success('已删除'); setDeleteTarget(null); }
        }}
        variant="destructive"
        confirmText="删除"
      />
    </div>
  );
}
