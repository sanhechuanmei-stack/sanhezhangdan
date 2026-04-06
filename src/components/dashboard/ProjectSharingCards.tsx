import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutList, BarChart2, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAppData } from '@/hooks/useAppData';
import { useCalculations } from '@/hooks/useCalculations';
import { calcPartnerExpectedShare, calcPartnerPaid, calcProjectFinancials } from '@/lib/calculations';
import type { Project } from '@/types';

const CHART_COLORS = ['hsl(224 76% 48%)', 'hsl(160 72% 38%)', 'hsl(24 94% 50%)', 'hsl(330 80% 55%)', 'hsl(270 60% 50%)'];

function HorizontalBar({ name, paid, unpaid, expected }: {
  name: string; paid: number; unpaid: number; expected: number;
}) {
  const total = expected > 0 ? expected : paid + unpaid;
  const paidPct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
  const unpaidPct = total > 0 ? Math.min(100, (unpaid / total) * 100) : 0;

  const rows = [
    { label: '应分', value: expected, pct: 100, color: 'hsl(var(--accent-blue))' },
    { label: '已分', value: paid, pct: paidPct, color: 'hsl(var(--accent-green))' },
    { label: '未分', value: Math.max(0, unpaid), pct: unpaidPct, color: 'hsl(var(--accent-orange))' },
  ];

  return (
    <div className="py-2 border-b border-border/30 last:border-0">
      <p className="text-[11px] font-semibold text-foreground mb-2">{name}</p>
      <div className="space-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-2.5">
            <span className="text-[10px] text-muted-foreground w-6 shrink-0">{row.label}</span>
            <div className="flex-1 h-[5px] rounded-full bg-muted/60 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${row.pct}%`, backgroundColor: row.color }}
              />
            </div>
            <span className="text-[11px] font-semibold tabular-nums w-20 text-right shrink-0 text-foreground num-display">
              ¥{row.value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SortableProjectCard({ project, members, onNavigate }: {
  project: { id: string; name: string };
  members: { id: string; name: string; expected: number; paid: number; unpaid: number }[];
  onNavigate: () => void;
}) {
  const [view, setView] = useState<'chart' | 'list'>('chart');
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: project.id,
    transition: {
      duration: 300,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    scale: isDragging ? '0.97' : '1',
    zIndex: isDragging ? 10 : 'auto' as any,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="card-solid rounded-2xl p-4 sm:p-5 card-hover-lift flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors touch-none"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <h3
            className="font-display font-bold text-foreground text-[13px] sm:text-sm cursor-pointer hover:text-primary transition-colors truncate tracking-tight"
            onClick={onNavigate}
          >
            {project.name}分成
          </h3>
        </div>
        <div className="segment shrink-0">
          <button
            onClick={() => setView('chart')}
            className={`segment-item ${view === 'chart' ? 'active' : ''}`}
          >
            <BarChart2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setView('list')}
            className={`segment-item ${view === 'list' ? 'active' : ''}`}
          >
            <LayoutList className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Legend */}
      {view === 'chart' && members.length > 0 && (
        <div className="flex items-center gap-3 mb-2 shrink-0">
          {[{ label: '应分', color: 'hsl(var(--accent-blue))' }, { label: '已分', color: 'hsl(var(--accent-green))' }, { label: '未分', color: 'hsl(var(--accent-orange))' }].map((l) => (
            <span key={l.label} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
      )}

      {/* Chart View */}
      {view === 'chart' && (
        <div className="flex-1">
          {members.map((member) => (
            <HorizontalBar
              key={member.id}
              name={member.name}
              paid={member.paid}
              unpaid={member.unpaid}
              expected={member.expected}
            />
          ))}
          {members.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">暂无分成数据</p>
          )}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="flex-1 space-y-3 cursor-pointer" onClick={onNavigate}>
          {members.map((member, i) => {
            const paidPercent = member.expected > 0 ? (member.paid / member.expected) * 100 : 0;
            const color = CHART_COLORS[i % CHART_COLORS.length];
            return (
              <div key={member.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-semibold text-foreground text-[13px]">{member.name}</span>
                  <span className="text-muted-foreground text-[11px]">应分 ¥{member.expected.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, paidPercent)}%`, backgroundColor: color }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>已分 ¥{member.paid.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span>未分 ¥{member.unpaid.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            );
          })}
          {members.length === 0 && (
            <p className="text-sm text-muted-foreground text-center">暂无分成数据</p>
          )}
        </div>
      )}
    </div>
  );
}

const ORDER_STORAGE_KEY = 'xiaoyan-project-order';

interface ProjectSharingCardsProps {
  offlineProjectId?: string;
  selectedPeriod?: string;
}

export function ProjectSharingCards({ offlineProjectId, selectedPeriod }: ProjectSharingCardsProps) {
  const navigate = useNavigate();
  const { state } = useAppData();
  const { projectFinancials } = useCalculations();

  const activeProjects = state.projects.filter((p) => p.status === 'active');

  const [orderedIds, setOrderedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(ORDER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        const activeIds = activeProjects.map((p) => p.id);
        const ordered = parsed.filter((id) => activeIds.includes(id));
        const newIds = activeIds.filter((id) => !ordered.includes(id));
        return [...ordered, ...newIds];
      }
    } catch {}
    return activeProjects.map((p) => p.id);
  });

  useEffect(() => {
    const activeIds = activeProjects.map((p) => p.id);
    const filtered = orderedIds.filter((id) => activeIds.includes(id));
    const newIds = activeIds.filter((id) => !filtered.includes(id));
    if (newIds.length > 0 || filtered.length !== orderedIds.length) {
      setOrderedIds([...filtered, ...newIds]);
    }
  }, [activeProjects.map((p) => p.id).join(',')]);

  useEffect(() => {
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orderedIds));
  }, [orderedIds]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (over && active.id !== over.id) {
      setOrderedIds((prev) => {
        const oldIndex = prev.indexOf(active.id as string);
        const newIndex = prev.indexOf(over.id as string);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }

  function getFinancials(project: Project) {
    const isOffline = project.id === offlineProjectId && selectedPeriod;
    if (isOffline) {
      const periodBills = state.bills.filter(
        (b) => b.projectId === project.id && b.period === selectedPeriod
      );
      return calcProjectFinancials(project, periodBills, state.partners);
    }
    return projectFinancials.find((f) => f.projectId === project.id);
  }

  const sortedProjects = orderedIds
    .map((id) => activeProjects.find((p) => p.id === id))
    .filter(Boolean) as typeof activeProjects;

  const activeProject = activeId ? sortedProjects.find((p) => p.id === activeId) : null;
  const activeMembers = activeProject ? (() => {
    const financials = getFinancials(activeProject);
    if (!financials) return [];
    const partnerIds = new Set([
      ...activeProject.partnerIds,
      activeProject.prioritySharing?.partnerId,
    ].filter(Boolean) as string[]);
    return [...partnerIds].map((pid) => {
      const partner = state.partners.find((p) => p.id === pid);
      const expected = calcPartnerExpectedShare(activeProject, financials, pid, state.partners);
      const periodFilter = activeProject.id === offlineProjectId && selectedPeriod ? selectedPeriod : undefined;
      const paid = calcPartnerPaid(state.sharingRecords, activeProject.id, pid, periodFilter);
      return { id: pid, name: partner?.name ?? pid, expected, paid, unpaid: expected - paid };
    }).filter((m) => m.expected > 0);
  })() : [];

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <SortableContext items={orderedIds} strategy={horizontalListSortingStrategy}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
          {sortedProjects.map((project) => {
            const financials = getFinancials(project);
            if (!financials) return null;

            const partnerIds = new Set([
              ...project.partnerIds,
              project.prioritySharing?.partnerId,
            ].filter(Boolean) as string[]);

            const members = [...partnerIds].map((pid) => {
              const partner = state.partners.find((p) => p.id === pid);
              const expected = calcPartnerExpectedShare(project, financials, pid, state.partners);
              const periodFilter = project.id === offlineProjectId && selectedPeriod ? selectedPeriod : undefined;
              const paid = calcPartnerPaid(state.sharingRecords, project.id, pid, periodFilter);
              return { id: pid, name: partner?.name ?? pid, expected, paid, unpaid: expected - paid };
            }).filter((m) => m.expected > 0);

            return (
              <SortableProjectCard
                key={project.id}
                project={{
                  id: project.id,
                  name: project.id === offlineProjectId && selectedPeriod
                    ? `${project.name}·${selectedPeriod}`
                    : project.name,
                }}
                members={members}
                onNavigate={() => navigate(`/sharing?projectId=${project.id}`)}
              />
            );
          })}
        </div>
      </SortableContext>
      <DragOverlay dropAnimation={{ duration: 250, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeProject && (
          <div className="card-elevated rounded-2xl p-4 sm:p-5 opacity-90 rotate-[2deg] scale-105">
            <h3 className="font-display font-semibold text-foreground text-sm sm:text-base mb-2">
              {activeProject.name}分成
            </h3>
            <div className="space-y-2">
              {activeMembers.map((m) => (
                <div key={m.id} className="text-xs text-muted-foreground">
                  {m.name} · 应分 ¥{m.expected.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              ))}
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
