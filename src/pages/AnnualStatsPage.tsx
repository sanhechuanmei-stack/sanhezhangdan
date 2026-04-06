import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ComposedChart,
  Bar,
  Line,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
} from 'recharts';
import { useAppData } from '@/hooks/useAppData';
import { useIsMobile } from '@/hooks/use-mobile';
import { calcMonthlyData } from '@/lib/calculations';

const COLORS = ['#FF708B', '#FBBF24', '#8B5CF6', '#34D399', '#94A3B8', '#F97316', '#06B6D4'];

const INCOME_COLOR = '#436FE3';
const EXPENSE_COLOR = '#61CBBF';
const PROFIT_COLOR = '#FBBF24';

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 4px 24px rgba(0,0,0,0.10)', padding: '12px 16px', minWidth: 160 }}>
      <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8, fontWeight: 500 }}>{label}</p>
      {payload.map((item) => (
        <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ display: 'inline-block', width: 3, height: 16, borderRadius: 2, background: item.color, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#94A3B8', flex: 1 }}>{item.name}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>¥{item.value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnnualStatsPage() {
  const navigate = useNavigate();
  const { state } = useAppData();
  const isMobile = useIsMobile();

  // Derive available years from bill dates
  const availableYears = useMemo(() => {
    const years = new Set(state.bills.map((b) => new Date(b.date).getFullYear()));
    const currentYear = new Date().getFullYear();
    years.add(currentYear);
    return [...years].sort((a, b) => b - a);
  }, [state.bills]);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const yearBills = useMemo(
    () => state.bills.filter((b) => new Date(b.date).getFullYear() === selectedYear),
    [state.bills, selectedYear]
  );

  const yearSharing = useMemo(
    () => state.sharingRecords.filter((r) => !r.isYearEnd && new Date(r.date).getFullYear() === selectedYear),
    [state.sharingRecords, selectedYear]
  );

  // Overview stats
  const totalIncome = yearBills.reduce((s, b) => s + (b.income ?? 0), 0);
  const totalExpense = yearBills.reduce((s, b) => s + (b.expense ?? 0), 0);
  const grossProfit = totalIncome - totalExpense;
  const grossMargin = totalIncome > 0 ? (grossProfit / totalIncome) * 100 : 0;
  const totalPaid = yearSharing.reduce((s, r) => s + r.amount, 0);
  const totalUnpaid = grossProfit * 0.85 - totalPaid; // approximate

  const overview = [
    { label: '年度总收入', value: `¥${totalIncome.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'text-apple-green' },
    { label: '年度总支出', value: `¥${totalExpense.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'text-apple-red' },
    { label: '年度毛利润', value: `¥${grossProfit.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'text-foreground' },
    { label: '年度毛利率', value: `${grossMargin.toFixed(2)}%`, color: 'text-apple-purple' },
    { label: '年度已分成', value: `¥${totalPaid.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'text-apple-yellow' },
    { label: '年度未分成', value: `¥${Math.max(0, totalUnpaid).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'text-muted-foreground' },
  ];

  // Monthly chart data
  const monthlyData = useMemo(() => calcMonthlyData(yearBills, selectedYear), [yearBills, selectedYear]);

  // Business revenue contribution
  const businessContribution = useMemo(() => {
    return state.projects
      .map((p, i) => {
        const income = yearBills
          .filter((b) => b.projectId === p.id)
          .reduce((s, b) => s + (b.income ?? 0), 0);
        return { projectId: p.id, name: p.name, value: income, color: COLORS[i % COLORS.length] };
      })
      .filter((p) => p.value > 0);
  }, [state.projects, yearBills]);

  // Expense breakdown by category
  const expenseBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of yearBills) {
      if (b.expense && b.expenseCategory) {
        map[b.expenseCategory] = (map[b.expenseCategory] ?? 0) + b.expense;
      }
    }
    return Object.entries(map)
      .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [yearBills]);

  // Period analysis: any project that has bills with period field
  const offlineProject = state.projects.find((p) =>
    state.bills.some((b) => b.projectId === p.id && b.period)
  );
  const periodData = useMemo(() => {
    if (!offlineProject) return [];
    const periodBills = yearBills.filter((b) => b.projectId === offlineProject.id && b.period);
    const periods = [...new Set(periodBills.map((b) => b.period!))];
    return periods.map((period) => {
      const pBills = periodBills.filter((b) => b.period === period);
      const income = pBills.reduce((s, b) => s + (b.income ?? 0), 0);
      const expense = pBills.reduce((s, b) => s + (b.expense ?? 0), 0);
      return { period, income, expense, profit: income - expense };
    });
  }, [offlineProject, yearBills]);

  // 研习社年度分析：按月统计研习社收入/支出/利润
  const xiyansheProject = state.projects.find((p) => p.name.includes('研习社'));
  const xiyansheMonthlyData = useMemo(() => {
    if (!xiyansheProject) return [];
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    return months.map((m) => {
      const mBills = yearBills.filter(
        (b) => b.projectId === xiyansheProject.id && new Date(b.date).getMonth() + 1 === m
      );
      const income = mBills.reduce((s, b) => s + (b.income ?? 0), 0);
      const expense = mBills.reduce((s, b) => s + (b.expense ?? 0), 0);
      return { month: `${m}月`, income, expense, profit: income - expense };
    });
  }, [xiyansheProject, yearBills]);

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">年度统计</h1>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="h-9 rounded-xl border border-input bg-background px-3 text-sm"
        >
          {availableYears.map((y) => (
            <option key={y} value={y}>{y}年</option>
          ))}
        </select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
        {overview.map((item) => (
          <div key={item.label} className="card-solid rounded-xl sm:rounded-2xl p-3 sm:p-5 text-center">
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-2">{item.label}</p>
            <p className={`text-sm sm:text-lg font-display font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly Chart */}
      <div className="card-solid rounded-2xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-5">
          <h3 className="font-display font-semibold text-foreground text-sm sm:text-base">年度经营分析</h3>
          <div className="flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: INCOME_COLOR }} />月收入</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: EXPENSE_COLOR }} />月支出</span>
            <span className="flex items-center gap-1"><span className="inline-block w-5 h-0.5" style={{ background: PROFIT_COLOR }} />毛利润</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={isMobile ? 240 : 360}>
          <ComposedChart data={monthlyData} margin={{ left: -10, right: 10, top: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(228 20% 90%)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: isMobile ? 10 : 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: isMobile ? 10 : 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="income" name="月收入" fill={INCOME_COLOR} radius={[4, 4, 0, 0]} maxBarSize={isMobile ? 14 : 22}>
              <LabelList dataKey="income" position="top" formatter={(v: number) => v > 0 ? `¥${v.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}` : ''} style={{ fontSize: isMobile ? 8 : 10, fill: INCOME_COLOR, fontWeight: 600 }} />
            </Bar>
            <Bar dataKey="expense" name="月支出" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={isMobile ? 14 : 22}>
              <LabelList dataKey="expense" position="top" formatter={(v: number) => v > 0 ? `¥${v.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}` : ''} style={{ fontSize: isMobile ? 8 : 10, fill: EXPENSE_COLOR, fontWeight: 600 }} />
            </Bar>
            <Line
              type="linear"
              dataKey="profit"
              name="毛利润"
              stroke={PROFIT_COLOR}
              strokeWidth={2.5}
              dot={{ fill: PROFIT_COLOR, r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: PROFIT_COLOR }}
            >
              <LabelList dataKey="profit" position="top" formatter={(v: number) => v !== 0 ? `¥${v.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}` : ''} style={{ fontSize: isMobile ? 8 : 10, fill: PROFIT_COLOR, fontWeight: 600 }} />
            </Line>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-5">
        {/* Business Revenue Contribution */}
        <div className="card-solid rounded-2xl p-4 sm:p-6">
          <h3 className="font-display font-semibold text-foreground mb-3 sm:mb-5 text-sm sm:text-base">业务收入贡献</h3>
          {businessContribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
                <PieChart>
                  <Pie
                    data={businessContribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={isMobile ? 40 : 60}
                    outerRadius={isMobile ? 70 : 90}
                    paddingAngle={4}
                    dataKey="value"
                    onClick={(entry: { projectId: string }) => {
                      const proj = state.projects.find((p) => p.id === entry.projectId);
                      if (!proj) return;
                      navigate(`/project/${proj.id}`);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {businessContribution.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-3">
                {businessContribution.map((b) => (
                  <div key={b.name} className="flex items-center gap-1.5 text-xs">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                    <span className="text-muted-foreground">{b.name}</span>
                    <span className="font-medium">¥{b.value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">暂无收入数据</p>
          )}
        </div>

        {/* Expense Breakdown */}
        <div className="card-solid rounded-2xl p-4 sm:p-6">
          <h3 className="font-display font-semibold text-foreground mb-3 sm:mb-5 text-sm sm:text-base">年度支出分析</h3>
          {expenseBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
              <BarChart data={expenseBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(228 20% 90%)" />
                <XAxis type="number" tick={{ fontSize: isMobile ? 10 : 12 }} tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: isMobile ? 10 : 11 }} width={isMobile ? 60 : 90} />
                <Tooltip formatter={(value: number) => `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                <Bar dataKey="value" name="支出" radius={[0, 6, 6, 0]}>
                  {expenseBreakdown.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">暂无支出数据</p>
          )}
        </div>
      </div>

      {/* Offline Course Period Analysis */}
      {offlineProject && periodData.length > 0 && (
        <div className="card-solid rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-5">
            <h3 className="font-display font-semibold text-foreground text-sm sm:text-base">线下课期次分析</h3>
            <div className="flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: INCOME_COLOR }} />期次收入</span>
              <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: EXPENSE_COLOR }} />期次支出</span>
              <span className="flex items-center gap-1"><span className="inline-block w-5 h-0.5" style={{ background: PROFIT_COLOR }} />毛利润</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={isMobile ? 240 : 360}>
            <ComposedChart data={periodData} margin={{ left: -10, right: 10, top: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(228 20% 90%)" vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: isMobile ? 10 : 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: isMobile ? 10 : 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="income" name="期次收入" fill={INCOME_COLOR} radius={[4, 4, 0, 0]} maxBarSize={isMobile ? 18 : 28}>
                <LabelList dataKey="income" position="top" formatter={(v: number) => v > 0 ? `¥${v.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}` : ''} style={{ fontSize: isMobile ? 8 : 10, fill: INCOME_COLOR, fontWeight: 600 }} />
              </Bar>
              <Bar dataKey="expense" name="期次支出" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={isMobile ? 18 : 28}>
                <LabelList dataKey="expense" position="top" formatter={(v: number) => v > 0 ? `¥${v.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}` : ''} style={{ fontSize: isMobile ? 8 : 10, fill: EXPENSE_COLOR, fontWeight: 600 }} />
              </Bar>
              <Line
                type="linear"
                dataKey="profit"
                name="毛利润"
                stroke={PROFIT_COLOR}
                strokeWidth={2.5}
                dot={{ fill: PROFIT_COLOR, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: PROFIT_COLOR }}
              >
                <LabelList dataKey="profit" position="top" formatter={(v: number) => v !== 0 ? `¥${v.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}` : ''} style={{ fontSize: isMobile ? 8 : 10, fill: PROFIT_COLOR, fontWeight: 600 }} />
              </Line>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 研习社年度分析 */}
      {xiyansheProject && (
        <div className="card-solid rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-5">
            <h3 className="font-display font-semibold text-foreground text-sm sm:text-base">研习社年度分析</h3>
            <div className="flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: INCOME_COLOR }} />月收入</span>
              <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: EXPENSE_COLOR }} />月支出</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={isMobile ? 240 : 360}>
            <ComposedChart data={xiyansheMonthlyData} margin={{ left: -10, right: 10, top: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(228 20% 90%)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: isMobile ? 10 : 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: isMobile ? 10 : 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="income" name="月收入" fill={INCOME_COLOR} radius={[4, 4, 0, 0]} maxBarSize={isMobile ? 14 : 22}>
                <LabelList dataKey="income" position="top" formatter={(v: number) => v > 0 ? `¥${v.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}` : ''} style={{ fontSize: isMobile ? 8 : 10, fill: INCOME_COLOR, fontWeight: 600 }} />
              </Bar>
              <Bar dataKey="expense" name="月支出" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={isMobile ? 14 : 22}>
                <LabelList dataKey="expense" position="top" formatter={(v: number) => v > 0 ? `¥${v.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}` : ''} style={{ fontSize: isMobile ? 8 : 10, fill: EXPENSE_COLOR, fontWeight: 600 }} />
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
