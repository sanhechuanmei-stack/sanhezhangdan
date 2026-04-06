import { useState, useEffect, useRef } from 'react';
import { Gift, ChevronDown, ChevronRight, Plus, ArrowLeft, List } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAppData } from '@/hooks/useAppData';
import { useCalculations } from '@/hooks/useCalculations';
import { DatePicker } from '@/components/shared/DatePicker';
import { toast } from 'sonner';

type View = 'main' | 'alloc' | 'records';

// ── 烟花 Canvas ──
function FireworksCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    type Particle = {
      x: number; y: number; vx: number; vy: number;
      alpha: number; color: string; radius: number;
    };

    const particles: Particle[] = [];
    const colors = ['#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#3b82f6', '#f97316', '#ec4899'];

    function burst(x: number, y: number) {
      const count = 40 + Math.floor(Math.random() * 20);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
        const speed = 2 + Math.random() * 4;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          radius: 2 + Math.random() * 2,
        });
      }
    }

    const w = canvas.width;
    const h = canvas.height;
    const shots = [
      [w * 0.3, h * 0.35], [w * 0.7, h * 0.25], [w * 0.5, h * 0.4],
      [w * 0.2, h * 0.5],  [w * 0.8, h * 0.45],
    ];
    shots.forEach(([x, y], i) => {
      setTimeout(() => burst(x, y), i * 180);
    });

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.alpha -= 0.018;
        if (p.alpha <= 0) { particles.splice(i, 1); continue; }
        ctx!.save();
        ctx!.globalAlpha = p.alpha;
        ctx!.fillStyle = p.color;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();
      }
      if (particles.length > 0) {
        rafRef.current = requestAnimationFrame(draw);
      }
    }
    rafRef.current = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10 rounded-2xl"
    />
  );
}

export function YearEndBonus() {
  const { state, addSharing, deleteSharing } = useAppData();
  const { yearEndBonus } = useCalculations();
  const [expandedPartners, setExpandedPartners] = useState<Set<string>>(new Set());
  const [view, setView] = useState<View>('main');
  const [fireworks, setFireworks] = useState(false);

  const [allocTarget, setAllocTarget] = useState<{ partnerId: string; name: string } | null>(null);
  const [allocProjectId, setAllocProjectId] = useState('');
  const [allocAmount, setAllocAmount] = useState('');
  const [allocDate, setAllocDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [allocNote, setAllocNote] = useState('');

  const fmt = (n: number) => '¥' + n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const totalPaid = yearEndBonus.byPartner.reduce((s, p) => s + p.paid, 0);
  const totalUnpaid = yearEndBonus.byPartner.reduce((s, p) => s + p.unpaid, 0);

  const yearEndRecords = state.sharingRecords
    .filter((r) => r.isYearEnd)
    .sort((a, b) => b.date.localeCompare(a.date));

  function handleOpenChange(open: boolean) {
    if (open) {
      setView('main');
      setTimeout(() => {
        setFireworks(true);
        setTimeout(() => setFireworks(false), 2200);
      }, 150);
    } else {
      setView('main');
      setExpandedPartners(new Set());
      setAllocTarget(null);
      setFireworks(false);
    }
  }

  function toggleExpand(partnerId: string) {
    setExpandedPartners((prev) => {
      const next = new Set(prev);
      next.has(partnerId) ? next.delete(partnerId) : next.add(partnerId);
      return next;
    });
  }

  function openAlloc(partnerId: string, name: string) {
    setAllocTarget({ partnerId, name });
    setAllocProjectId('');
    setAllocAmount('');
    setAllocNote('');
    setAllocDate(new Date().toISOString().slice(0, 10));
    setView('alloc');
  }

  const allocProjectRemaining = (() => {
    if (!allocTarget || !allocProjectId) return null;
    const partnerData = yearEndBonus.byPartner.find((p) => p.partnerId === allocTarget.partnerId);
    if (!partnerData) return null;
    const projEntry = partnerData.byProject.find((p) => p.projectId === allocProjectId);
    if (!projEntry) return null;
    const paidForProj = state.sharingRecords
      .filter((r) => r.isYearEnd && r.partnerId === allocTarget.partnerId && r.projectId === allocProjectId)
      .reduce((s, r) => s + r.amount, 0);
    return projEntry.amount - paidForProj;
  })();

  const allocProjectTotal = (() => {
    if (!allocTarget || !allocProjectId) return null;
    const partnerData = yearEndBonus.byPartner.find((p) => p.partnerId === allocTarget.partnerId);
    return partnerData?.byProject.find((p) => p.projectId === allocProjectId)?.amount ?? null;
  })();

  const allocPartnerProjects = (() => {
    if (!allocTarget) return [];
    const partnerData = yearEndBonus.byPartner.find((p) => p.partnerId === allocTarget.partnerId);
    if (!partnerData) return [];
    return partnerData.byProject
      .map((proj) => {
        const project = state.projects.find((p) => p.id === proj.projectId);
        return { id: proj.projectId, name: project?.name ?? proj.projectId, amount: proj.amount };
      })
      .filter((p) => p.amount > 0);
  })();

  function handleAllocSave() {
    if (!allocTarget || !allocAmount || !allocDate || !allocProjectId) return;
    const amount = parseFloat(allocAmount);
    if (isNaN(amount) || amount <= 0) { toast.error('请输入有效金额'); return; }
    const projName = state.projects.find((p) => p.id === allocProjectId)?.name ?? allocProjectId;
    addSharing({
      id: crypto.randomUUID(),
      date: allocDate,
      projectId: allocProjectId,
      partnerId: allocTarget.partnerId,
      amount,
      note: allocNote || undefined,
      isYearEnd: true,
    });
    toast.success(`已记录：${allocTarget.name} · ${projName} 年终彩蛋 ${fmt(amount)}`);
    setView('main');
  }

  return (
    <>
      <Dialog onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <button className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-50 flex items-center gap-1.5 sm:gap-2 bg-apple-orange/10 text-apple-orange hover:bg-apple-orange/20 transition-colors rounded-full px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium shadow-sm year-end-bonus-btn">
            <Gift className="h-4 w-4" />
            年终彩蛋
          </button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-lg rounded-2xl">

          {fireworks && (
            <div className="absolute inset-0 pointer-events-none z-10 rounded-2xl overflow-hidden">
              <FireworksCanvas active={fireworks} />
            </div>
          )}

          {/* 分配表单 */}
          {view === 'alloc' && allocTarget && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-base flex items-center gap-2 tracking-tight">
                  <button onClick={() => setView('main')} className="p-1 rounded-lg hover:bg-muted transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  为「{allocTarget.name}」记录分配
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block font-medium">分配项目</label>
                  <select value={allocProjectId} onChange={(e) => { setAllocProjectId(e.target.value); setAllocAmount(''); }}
                    className="field-apple text-sm">
                    <option value="">请选择项目</option>
                    {allocPartnerProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                {allocProjectId && allocProjectTotal !== null && (
                  <div className="flex items-center justify-between p-2.5 bg-apple-orange/8 rounded-xl text-sm">
                    <span className="text-muted-foreground text-xs">{state.projects.find((p) => p.id === allocProjectId)?.name} 彩蛋总额</span>
                    <div className="text-right">
                      <div className="text-apple-orange font-semibold text-sm num-display">剩余可分 {fmt(allocProjectRemaining ?? 0)}</div>
                      <div className="text-[11px] text-muted-foreground">共 {fmt(allocProjectTotal)}</div>
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block font-medium">分配日期</label>
                  <DatePicker value={allocDate} onChange={setAllocDate} placeholder="选择分配日期" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block font-medium">分配金额</label>
                  <input type="number" placeholder="请输入金额" value={allocAmount} onChange={(e) => setAllocAmount(e.target.value)}
                    className="field-apple text-sm" />
                  {allocAmount && allocProjectRemaining !== null && parseFloat(allocAmount) > allocProjectRemaining && (
                    <p className="text-xs text-destructive mt-1">超出该项目剩余可分金额</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block font-medium">备注（可选）</label>
                  <input type="text" placeholder="如：微信转账" value={allocNote} onChange={(e) => setAllocNote(e.target.value)}
                    className="field-apple text-sm" />
                </div>
                <button onClick={handleAllocSave} disabled={!allocAmount || !allocDate || !allocProjectId}
                  className="w-full h-9 rounded-xl bg-apple-orange text-white font-medium text-sm disabled:opacity-40 hover:opacity-90 transition-opacity">
                  确认记录
                </button>
              </div>
            </>
          )}

          {/* 分润记录 */}
          {view === 'records' && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-base flex items-center gap-2 tracking-tight">
                  <button onClick={() => setView('main')} className="p-1 rounded-lg hover:bg-muted transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  年终彩蛋分润记录
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
                {yearEndRecords.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">暂无分润记录</p>
                ) : yearEndRecords.map((r) => {
                  const partner = state.partners.find((p) => p.id === r.partnerId);
                  const project = state.projects.find((p) => p.id === r.projectId);
                  return (
                    <div key={r.id} className="flex items-center justify-between p-2.5 bg-[hsl(240_5%_97%)] rounded-xl">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-medium text-foreground">{partner?.name ?? r.partnerId}</span>
                          {project && <span className="text-[10px] bg-apple-orange/10 text-apple-orange px-1.5 py-0.5 rounded font-medium">{project.name}</span>}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{r.date}{r.note ? ` · ${r.note}` : ''}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-semibold text-apple-green num-display">{fmt(r.amount)}</span>
                        <button onClick={() => { deleteSharing(r.id); toast.success('已删除'); }}
                          className="text-[11px] text-muted-foreground hover:text-destructive transition-colors px-1">删除</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* 主视图 */}
          {view === 'main' && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-base flex items-center gap-2 tracking-tight">
                  <div className="w-7 h-7 rounded-lg bg-apple-orange/10 flex items-center justify-center">
                    <Gift className="h-4 w-4 text-apple-orange" />
                  </div>
                  年终彩蛋
                </DialogTitle>
              </DialogHeader>

              <div className="text-center py-3 px-4 bg-apple-orange/8 rounded-xl">
                <p className="text-[11px] text-muted-foreground mb-0.5">今年累计留存分成总额</p>
                <p className="text-2xl font-display font-bold text-apple-red num-display">{fmt(totalUnpaid)}</p>
              </div>

              <div>
                <h4 className="text-[11px] font-semibold text-foreground mb-1.5 uppercase tracking-wider">各合伙人年底预计可分</h4>
                <div className="space-y-1">
                  {yearEndBonus.byPartner.map((item) => {
                    const partner = state.partners.find((p) => p.id === item.partnerId);
                    const name = partner?.name ?? item.partnerId;
                    const isExpanded = expandedPartners.has(item.partnerId);
                    return (
                      <div key={item.partnerId} className="bg-[hsl(240_5%_97%)] rounded-xl overflow-hidden">
                        <div className="flex items-center gap-2 p-2">
                          <button onClick={() => toggleExpand(item.partnerId)} className="flex items-center gap-1.5 flex-1 min-w-0">
                            {isExpanded
                              ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            }
                            <span className="text-[13px] text-foreground truncate font-medium">{name}</span>
                          </button>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right">
                              <div className="text-[13px] font-semibold text-apple-red num-display">{fmt(item.unpaid)}</div>
                              {item.paid > 0 && <div className="text-[10px] text-muted-foreground">已分 {fmt(item.paid)}</div>}
                            </div>
                            <button onClick={() => openAlloc(item.partnerId, name)} disabled={item.unpaid <= 0}
                              className="flex items-center gap-1 px-2 py-1 sm:px-3 rounded-lg bg-primary/8 text-primary text-[11px] font-medium hover:bg-primary/15 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                              <Plus className="h-3 w-3" />
                              <span className="hidden sm:inline">记录分配</span>
                            </button>
                          </div>
                        </div>
                        {isExpanded && item.byProject.length > 0 && (
                          <div className="px-3 pb-2 space-y-1 border-t border-border/30 pt-1.5">
                            {item.byProject.map((proj) => {
                              const project = state.projects.find((p) => p.id === proj.projectId);
                              const paidForProj = state.sharingRecords
                                .filter((r) => r.isYearEnd && r.partnerId === item.partnerId && r.projectId === proj.projectId)
                                .reduce((s, r) => s + r.amount, 0);
                              const remaining = proj.amount - paidForProj;
                              return (
                                <div key={proj.projectId} className="flex items-center justify-between pl-5">
                                  <span className="text-[11px] font-semibold text-foreground">{project?.name ?? proj.projectId}</span>
                                  <div className="text-right">
                                    <span className="text-[11px] font-medium text-foreground num-display">{fmt(proj.amount)}</span>
                                    {paidForProj > 0 && <div className="text-[10px] text-muted-foreground">剩 {fmt(remaining)}</div>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {yearEndBonus.byPartner.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">暂无数据</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-semibold text-foreground mb-1.5 uppercase tracking-wider">各项目累计留存金额</h4>
                <div className="space-y-1">
                  {yearEndBonus.byProject.map((item) => {
                    const project = state.projects.find((p) => p.id === item.projectId);
                    const paidForProject = state.sharingRecords
                      .filter((r) => r.isYearEnd && r.projectId === item.projectId)
                      .reduce((s, r) => s + r.amount, 0);
                    const remaining = item.amount - paidForProject;
                    return (
                      <div key={item.projectId} className="flex items-center justify-between p-2 bg-[hsl(240_5%_97%)] rounded-xl">
                        <span className="text-[13px] text-foreground">{project?.name ?? item.projectId}</span>
                        <span className="text-[13px] font-semibold text-apple-purple num-display">{fmt(remaining)}</span>
                      </div>
                    );
                  })}
                  {yearEndBonus.byProject.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">暂无数据</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={() => setView('records')}
                  className="flex items-center gap-1.5 bg-apple-green/10 text-apple-green hover:bg-apple-green/20 transition-colors rounded-full px-3 py-1.5 text-[11px] font-medium">
                  <List className="h-3.5 w-3.5" />
                  分润记录
                </button>
              </div>
            </>
          )}

        </DialogContent>
      </Dialog>
    </>
  );
}
