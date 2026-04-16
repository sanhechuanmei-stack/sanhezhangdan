import { useState } from 'react';
import { Users, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '@/hooks/useAppData';
import { useCalculations } from '@/hooks/useCalculations';
import { FormDialog } from '@/components/shared/FormDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { Partner, Project, PartnerTotalSummary } from '@/types';

function formatMoney(val: number) {
  return '¥' + val.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface PartnerCardProps {
  p: Partner;
  summary: PartnerTotalSummary | undefined;
  projects: Project[];
  onEdit: (p: Partner) => void;
  onDelete: (p: Partner) => void;
  onNavigate: () => void;
}

function PartnerCard({ p, summary, projects, onEdit, onDelete, onNavigate }: PartnerCardProps) {
  return (
    <div className="card-solid rounded-2xl p-4 sm:p-6 card-hover-lift">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${p.type === 'main' ? 'bg-apple-purple/10' : 'bg-apple-pink/10'}`}>
            <Users className={`h-5 w-5 ${p.type === 'main' ? 'text-apple-purple' : 'text-apple-pink'}`} />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground text-[15px]">{p.name}</h3>
            <span className={`text-[11px] font-medium ${p.status === 'active' ? 'text-apple-green' : 'text-muted-foreground'}`}>
              {p.status === 'active' ? '启用' : '停用'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(p)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(p)}
            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-1.5">参与项目</p>
        <div className="flex flex-wrap gap-1.5">
          {projects.length > 0 ? projects.map((proj) => (
            <button
              key={proj.id}
              onClick={onNavigate}
              className="text-xs bg-background rounded-lg px-2 py-1 text-foreground hover:bg-muted transition-colors"
            >
              {proj.name}
            </button>
          )) : <span className="text-xs text-muted-foreground">暂无</span>}
        </div>
      </div>

      <div className="space-y-1.5 text-sm border-t border-border pt-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground text-xs">累计应分成</span>
          <span className="font-semibold num-display text-[13px]">{formatMoney(summary?.expected ?? 0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground text-xs">累计已分成</span>
          <span className="font-semibold text-apple-green num-display text-[13px]">{formatMoney(summary?.paid ?? 0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground text-xs">累计未分成</span>
          <span className="font-semibold text-apple-orange num-display text-[13px]">{formatMoney(summary?.unpaid ?? 0)}</span>
        </div>
      </div>
    </div>
  );
}

export default function PartnersPage() {
  const { state, addPartner, updatePartner, deletePartner } = useAppData();
  const { partnerSummaries } = useCalculations();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Partner | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [statusInput, setStatusInput] = useState<'active' | 'disabled'>('active');
  const [typeInput, setTypeInput] = useState<'main' | 'special'>('main');
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null);

  function openAdd() {
    setEditTarget(null);
    setNameInput('');
    setStatusInput('active');
    setTypeInput('main');
    setDialogOpen(true);
  }

  function openEdit(p: Partner) {
    setEditTarget(p);
    setNameInput(p.name);
    setStatusInput(p.status);
    setTypeInput(p.type ?? 'main');
    setDialogOpen(true);
  }

  function handleSave() {
    const name = nameInput.trim();
    if (!name) { toast.error('姓名不能为空'); return; }
    const dup = state.partners.find((p) => p.name === name && p.id !== editTarget?.id);
    if (dup) { toast.error('该姓名已存在'); return; }
    if (editTarget) {
      updatePartner({ ...editTarget, name, status: statusInput, type: typeInput });
      toast.success('已更新');
    } else {
      addPartner({ id: crypto.randomUUID(), name, status: statusInput, type: typeInput });
      toast.success('已添加');
    }
    setDialogOpen(false);
  }

  function handleDelete(p: Partner) {
    const inSharing = state.sharingRecords.some((r) => r.partnerId === p.id);
    const inProject = state.projects.some((proj) => proj.partnerIds.includes(p.id));
    if (inSharing || inProject) {
      toast.error('该合伙人已有关联数据，无法删除');
      return;
    }
    setDeleteTarget(p);
  }

  // Get participating projects for a partner
  function getPartnerProjects(partnerId: string) {
    return state.projects.filter(
      (proj) => proj.partnerIds.includes(partnerId) || proj.prioritySharing?.partnerId === partnerId
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">合伙人</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 sm:gap-2 bg-primary text-primary-foreground rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">新增合伙人</span>
          <span className="sm:hidden">新增</span>
        </button>
      </div>

      {/* 主合伙人 */}
      {state.partners.some((p) => p.type === 'main') && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-1 rounded-full bg-apple-purple" />
            <h2 className="text-sm font-semibold text-foreground">主合伙人</h2>
            <span className="text-xs text-muted-foreground">({state.partners.filter((p) => p.type === 'main').length}人)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
            {state.partners.filter((p) => p.type === 'main').map((p) => {
              const summary = partnerSummaries.find((s) => s.partnerId === p.id);
              const projects = getPartnerProjects(p.id);
              return (
                <PartnerCard
                  key={p.id}
                  p={p}
                  summary={summary}
                  projects={projects}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onNavigate={() => navigate('/projects')}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* 特殊合伙人 */}
      {state.partners.some((p) => p.type === 'special') && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-1 rounded-full bg-apple-pink" />
            <h2 className="text-sm font-semibold text-foreground">特殊合伙人</h2>
            <span className="text-xs text-muted-foreground">({state.partners.filter((p) => p.type === 'special').length}人)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
            {state.partners.filter((p) => p.type === 'special').map((p) => {
              const summary = partnerSummaries.find((s) => s.partnerId === p.id);
              const projects = getPartnerProjects(p.id);
              return (
                <PartnerCard
                  key={p.id}
                  p={p}
                  summary={summary}
                  projects={projects}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onNavigate={() => navigate('/projects')}
                />
              );
            })}
          </div>
        </div>
      )}

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editTarget ? '编辑合伙人' : '新增合伙人'}
        onSubmit={handleSave}
      >
        <div className="space-y-2">
          <Label>姓名</Label>
          <Input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="请输入姓名"
          />
        </div>
        <div className="space-y-2">
          <Label>类型</Label>
          <div className="flex gap-3">
            {(['main', 'special'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeInput(t)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  typeInput === t
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'main' ? '主合伙人' : '特殊合伙人'}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>状态</Label>
          <div className="flex gap-3">
            {(['active', 'disabled'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusInput(s)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  statusInput === s
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {s === 'active' ? '启用' : '停用'}
              </button>
            ))}
          </div>
        </div>
      </FormDialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="确认删除"
        description={`确定要删除合伙人「${deleteTarget?.name}」吗？`}
        onConfirm={() => {
          if (deleteTarget) { deletePartner(deleteTarget.id); toast.success('已删除'); setDeleteTarget(null); }
        }}
        variant="destructive"
        confirmText="删除"
      />
    </div>
  );
}
