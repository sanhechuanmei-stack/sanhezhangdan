import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '@/hooks/useAppData';
import { useCalculations } from '@/hooks/useCalculations';
import { useAuth } from '@/context/AuthContext';
import { FinexyDonutChart } from './FinexyDonutChart';
import {
  BookOpen,
  Users,
  Cpu,
  Wallet,
  TrendingUp,
  GraduationCap,
  ArrowUpRight,
  ArrowDownRight,
  Target,
} from 'lucide-react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';
import {
  calcMonthlyProjectIncome,
} from '@/lib/calculations';

const WALLET_CONFIG: Record<string, { icon: typeof BookOpen; className: string }> = {
  '研习社': { icon: BookOpen, className: 'yanxishe' },
  '线下课': { icon: Users, className: 'offline' },
  'AI网站': { icon: Cpu, className: 'ai' },
};

const fmt = (n: number) => `¥${Math.round(n).toLocaleString('zh-CN')}`;
const fmtDecimal = (n: number) =>
  `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function FinexyDashboard() {
  const navigate = useNavigate();
  const { state } = useAppData();
  const { totalBalance, monthlyTotalIncome, monthlyYanxisheIncome, partnerSummaries, yearEndBonus } =
    useCalculations();
  const { user } = useAuth();

  const currentPartner = state.partners.find((p) => p.name === user?.name);
  const partnerSummary = partnerSummaries.find((s) => currentPartner && s.partnerId === currentPartner.id);

  // A. 每个项目的未分成
  const walletData = useMemo(() => {
    if (!currentPartner || !partnerSummary) return [];
    return partnerSummary.byProject
      .map((ps) => {
        const project = state.projects.find((p) => p.id === ps.projectId);
        if (!project) return null;
        const config = WALLET_CONFIG[project.name] || { icon: Cpu, className: 'ai' };
        return {
          projectId: project.id,
          name: project.name,
          unpaid: ps.unpaid,
          icon: config.icon,
          className: config.className,
        };
      })
      .filter(Boolean) as {
      projectId: string;
      name: string;
      unpaid: number;
      icon: typeof BookOpen;
      className: string;
    }[];
  }, [currentPartner, partnerSummary, state.projects]);

  // B4. AI网站最近6个月收入趋势
  const aiSparkData = useMemo(() => {
    const aiProject = state.projects.find((p) => p.name === 'AI网站');
    if (!aiProject) return [];
    const now = new Date();
    const data: { month: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const income = calcMonthlyProjectIncome(aiProject.id, state.bills, d.getFullYear(), d.getMonth() + 1);
      data.push({ month: `${d.getMonth() + 1}月`, value: income });
    }
    return data;
  }, [state.projects, state.bills]);

  const aiMonthlyIncome = useMemo(() => {
    const aiProject = state.projects.find((p) => p.name === 'AI网站');
    if (!aiProject) return 0;
    const now = new Date();
    return calcMonthlyProjectIncome(aiProject.id, state.bills, now.getFullYear(), now.getMonth() + 1);
  }, [state.projects, state.bills]);

  // C. 环形图数据
  const donutPaid = partnerSummary?.paid ?? 0;
  const donutUnpaid = partnerSummary?.unpaid ?? 0;

  // D. 最近6条收支明细（研习社 + AI网站）
  const recentActivities = useMemo(() => {
    const targetProjects = state.projects.filter(
      (p) => p.name === '研习社' || p.name === 'AI网站'
    );
    const targetIds = new Set(targetProjects.map((p) => p.id));
    return [...state.bills]
      .filter((b) => targetIds.has(b.projectId))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6)
      .map((bill) => {
        const project = state.projects.find((p) => p.id === bill.projectId);
        const isIncome = (bill.income ?? 0) > 0;
        return {
          id: bill.id,
          projectName: project?.name ?? '',
          isIncome,
          amount: isIncome ? bill.income! : bill.expense!,
          note: isIncome ? bill.incomeNote : bill.expenseNote,
          category: bill.expenseCategory,
          date: bill.date,
        };
      });
  }, [state.bills, state.projects]);

  // E. 年底预计分成
  const yearEndData = useMemo(() => {
    if (!currentPartner) return { amount: 0, target: 50000 };
    const partnerBonus = yearEndBonus.byPartner.find((p) => p.partnerId === currentPartner.id);
    return {
      amount: partnerBonus?.unpaid ?? 0,
      target: 50000,
    };
  }, [currentPartner, yearEndBonus]);

  const progressPct = Math.min(100, (yearEndData.amount / yearEndData.target) * 100);

  const totalUnpaid = partnerSummary?.unpaid ?? 0;

  // 欢迎语时段判断
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return '早上';
    if (h < 14) return '中午';
    if (h < 18) return '下午';
    return '晚上';
  })();

  const partnerName = user?.name ?? '';

  return (
    <div className="fx-bento">
      {/* ═══ 欢迎语 ═══ */}
      <div className="fx-welcome fx-animate fx-delay-1">
        <h1 className="fx-welcome-title">
          {partnerName}老师，久仰大名！{greeting}好！
        </h1>
        <p className="fx-welcome-sub">Sanhe is better with you.</p>
      </div>

      {/* ═══ Row 1: 余额 + KPI 2x2 + 环形图 ═══ */}
      <div className="fx-row-top">
        {/* A. 主余额区（左） */}
        <div className="fx-bento-balance fx-card fx-animate fx-delay-1">
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--fx-text-secondary)', marginBottom: 8 }}>
              剩余未分成
            </p>
            <p
              style={{
                fontSize: 'clamp(1.6rem, 2.5vw, 2.4rem)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
                color: 'var(--fx-text-primary)',
              }}
            >
              {fmtDecimal(totalUnpaid)}
            </p>
          </div>

          {/* Wallets */}
          <div className="fx-wallets">
            {walletData.map((w) => (
              <div
                key={w.projectId}
                className="fx-wallet"
                onClick={() => navigate(`/business/${w.projectId}`)}
              >
                <div className={`fx-wallet-icon ${w.className}`}>
                  <w.icon size={18} strokeWidth={1.8} />
                </div>
                <p className="fx-wallet-name">{w.name}</p>
                <p className="fx-wallet-value">{fmt(w.unpaid)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* B. 四张 KPI 卡片 2x2（中） */}
        <div className="fx-bento-kpi">
          {/* B1: 账面总结余 — 深色卡片 */}
          <div className="fx-card fx-card-sm fx-card-accent fx-card-hover fx-animate fx-delay-2">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(203,251,69,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Wallet size={16} color="#CBFB45" strokeWidth={1.8} />
            </div>
            <p style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
              账面总结余
            </p>
            <p
              style={{
                fontSize: 'clamp(1rem, 1.5vw, 1.4rem)',
                fontWeight: 700,
                color: '#CBFB45',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              {fmt(totalBalance)}
            </p>
          </div>

          {/* B2: 本月总收入 */}
          <div className="fx-card fx-card-sm fx-card-hover fx-animate fx-delay-3">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(16,185,129,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <TrendingUp size={16} color="#10b981" strokeWidth={1.8} />
            </div>
            <p className="fx-kpi-label" style={{ fontSize: 12, marginBottom: 4 }}>本月总收入</p>
            <p className="fx-kpi-value" style={{ color: '#10b981', fontSize: 'clamp(1rem, 1.5vw, 1.4rem)' }}>
              {fmt(monthlyTotalIncome)}
            </p>
          </div>

          {/* B3: 本月研习社收入 */}
          <div className="fx-card fx-card-sm fx-card-hover fx-animate fx-delay-4">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(99,102,241,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <GraduationCap size={16} color="#6366f1" strokeWidth={1.8} />
            </div>
            <p className="fx-kpi-label" style={{ fontSize: 12, marginBottom: 4 }}>本月研习社</p>
            <p className="fx-kpi-value" style={{ color: '#6366f1', fontSize: 'clamp(1rem, 1.5vw, 1.4rem)' }}>
              {fmt(monthlyYanxisheIncome)}
            </p>
          </div>

          {/* B4: AI网站动态看板 */}
          <div className="fx-card fx-card-sm fx-card-hover fx-animate fx-delay-5">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(249,115,22,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Cpu size={16} color="#f97316" strokeWidth={1.8} />
            </div>
            <p className="fx-kpi-label" style={{ fontSize: 12, marginBottom: 4 }}>AI网站本月</p>
            <p className="fx-kpi-value" style={{ color: '#f97316', fontSize: 'clamp(1rem, 1.5vw, 1.4rem)' }}>
              {fmt(aiMonthlyIncome)}
            </p>
            {aiSparkData.length > 0 && (
              <div className="fx-sparkline-wrap" style={{ height: 32, marginTop: 8 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={aiSparkData}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* C. 环形图（右） */}
        <div className="fx-bento-donut fx-card fx-animate fx-delay-2">
          <p className="fx-section-title" style={{ marginBottom: 8 }}>
            应分成总览
          </p>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FinexyDonutChart paid={donutPaid} unpaid={donutUnpaid} />
          </div>
        </div>
      </div>

      {/* ═══ Row 2: 年底进度 + 最近动态 ═══ */}
      <div className="fx-row-bottom">
        {/* E. 年底预计分成（左） */}
        <div className="fx-card fx-animate fx-delay-6" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexShrink: 0 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'var(--fx-green-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Target size={16} color="#4d7c0f" strokeWidth={1.8} />
            </div>
            <p className="fx-section-title">年底预计分成</p>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 12, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p
              style={{
                fontSize: 'clamp(1.4rem, 2.5vw, 2rem)',
                fontWeight: 700,
                color: 'var(--fx-text-primary)',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              {fmtDecimal(yearEndData.amount)}
            </p>
            <p style={{ fontSize: 11, color: 'var(--fx-text-tertiary)', marginTop: 6 }}>
              目标 {fmt(yearEndData.target)}
            </p>
          </div>

          <div style={{ flexShrink: 0 }}>
            <div className="fx-progress-track">
              <div className="fx-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>

            <div className="fx-progress-labels">
              <span style={{ color: 'var(--fx-text-tertiary)' }}>
                {progressPct.toFixed(1)}%
              </span>
              <span style={{ fontWeight: 600, color: 'var(--fx-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {fmt(yearEndData.target)}
              </span>
            </div>
          </div>
        </div>

        {/* D. 最近动态（右） */}
        <div className="fx-card fx-animate fx-delay-7" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <p className="fx-section-title" style={{ marginBottom: 8, flexShrink: 0 }}>
            最近动态
          </p>
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {recentActivities.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--fx-text-tertiary)', textAlign: 'center', padding: '16px 0' }}>
              暂无收支记录
            </p>
          ) : (
            recentActivities.map((act) => (
              <div key={act.id} className="fx-activity-row">
                <div className="fx-activity-left">
                  <div className={`fx-activity-icon ${act.isIncome ? 'income' : 'expense'}`}>
                    {act.isIncome ? (
                      <ArrowDownRight size={16} strokeWidth={2} />
                    ) : (
                      <ArrowUpRight size={16} strokeWidth={2} />
                    )}
                  </div>
                  <div>
                    <p className="fx-activity-name">
                      {act.isIncome ? (act.note || '收入') : (act.note || act.category || '支出')}
                    </p>
                    <div className="fx-activity-meta">
                      <span className="fx-activity-tag">{act.projectName}</span>
                      <span>{act.date}</span>
                    </div>
                  </div>
                </div>
                <span className={`fx-activity-amount ${act.isIncome ? 'positive' : 'negative'}`}>
                  {act.isIncome ? '+' : '-'}{fmt(act.amount)}
                </span>
              </div>
            ))
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
