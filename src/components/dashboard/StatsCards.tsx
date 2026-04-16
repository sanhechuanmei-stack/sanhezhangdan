import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '@/hooks/useAppData';
import { useCalculations } from '@/hooks/useCalculations';
import { calcCurrentPeriodProfit, calcProjectFinancials, getProjectPeriods } from '@/lib/calculations';
import { TrendingUp, Wallet, Calendar, GraduationCap, ChevronDown } from 'lucide-react';

interface StatsCardsProps {
  offlineProjectId?: string;
  selectedPeriod?: string;
}

// 下拉选项：无期次项目 → 一条；有期次项目 → 每个期次一条
interface SelectOption {
  key: string;       // 唯一 key
  label: string;     // 显示名称，如 "AI网站" / "第八期线下课"
  projectId: string;
  period?: string;   // 有期次时填写
}

export function StatsCards({ offlineProjectId, selectedPeriod }: StatsCardsProps) {
  const navigate = useNavigate();
  const { state } = useAppData();
  const { totalBalance, monthlyTotalIncome, monthlyYanxisheIncome } = useCalculations();

  // 构建扁平选项列表
  const options = useMemo<SelectOption[]>(() => {
    const result: SelectOption[] = [];
    for (const proj of state.projects) {
      if (proj.status === 'disabled') continue;
      const periods = getProjectPeriods(proj.id, state.bills);
      if (periods.length > 0) {
        // 有期次：每个期次单独一条，label = 期次名 + 项目名（如"第八期线下课"）
        for (const p of periods) {
          result.push({ key: `${proj.id}__${p}`, label: `${p}${proj.name}`, projectId: proj.id, period: p });
        }
      } else {
        // 无期次：整个项目一条，label = 项目名（如"AI网站"）
        result.push({ key: proj.id, label: proj.name, projectId: proj.id });
      }
    }
    return result;
  }, [state.projects, state.bills]);

  // 默认选中：优先选 offlineProjectId 的最新期次，否则第一条
  const defaultKey = useMemo(() => {
    if (offlineProjectId && selectedPeriod) {
      const match = options.find((o) => o.projectId === offlineProjectId && o.period === selectedPeriod);
      if (match) return match.key;
    }
    if (offlineProjectId) {
      const match = options.find((o) => o.projectId === offlineProjectId);
      if (match) return match.key;
    }
    return options[0]?.key ?? '';
  }, [options, offlineProjectId, selectedPeriod]);

  const [selectedKey, setSelectedKey] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const effectiveKey = selectedKey || defaultKey;
  const activeOption = options.find((o) => o.key === effectiveKey) ?? options[0];

  // 计算净利润
  const projectProfit = useMemo(() => {
    if (!activeOption) return 0;
    if (activeOption.period) {
      return calcCurrentPeriodProfit(activeOption.projectId, state.bills, activeOption.period);
    } else {
      const proj = state.projects.find((p) => p.id === activeOption.projectId);
      if (!proj) return 0;
      return calcProjectFinancials(proj, state.bills, state.partners).grossProfit;
    }
  }, [activeOption, state.bills, state.projects, state.partners]);

  const fmtNum = (n: number) => Math.round(n).toLocaleString('zh-CN');

  const stats = [
    { label: '账面总结余', value: fmtNum(totalBalance), color: 'hsl(var(--accent-blue))', bg: 'rgba(79,70,229,0.08)', icon: Wallet },
    { label: '本月总收入', value: fmtNum(monthlyTotalIncome), color: 'hsl(160 72% 38%)', bg: 'rgba(16,185,129,0.08)', icon: TrendingUp },
    { label: '本月研习社收入', value: fmtNum(monthlyYanxisheIncome), color: 'hsl(330 80% 55%)', bg: 'rgba(236,72,153,0.08)', icon: GraduationCap, onClick: () => navigate('/yanxishe') },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 h-full min-h-[280px] xl:min-h-[420px]">
      {stats.map((stat) => (
        <div
          key={stat.label}
          onClick={stat.onClick}
          className={`card-solid rounded-2xl px-4 py-5 sm:px-5 sm:py-6 flex flex-col justify-between ${
            stat.onClick ? 'cursor-pointer card-hover-lift' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-[10px] flex items-center justify-center mb-3" style={{ background: stat.bg }}>
            <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
          </div>
          <div>
            <p className="text-[11px] sm:text-xs text-muted-foreground font-medium mb-1">{stat.label}</p>
            <p className="num-display leading-none" style={{ color: stat.color, fontSize: 'clamp(1.4rem, 2vw, 2.2rem)' }}>
              {stat.value}
            </p>
          </div>
        </div>
      ))}

      {/* 第四卡片：可选项目/期次净利润 */}
      <div className="card-solid rounded-2xl px-4 py-5 sm:px-5 sm:py-6 flex flex-col justify-between relative">
        {/* 右上角选择器 */}
        <div className="absolute top-3 right-3">
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-0.5 text-[10px] sm:text-[11px] text-muted-foreground hover:text-foreground transition-colors bg-muted/50 hover:bg-muted rounded-lg px-2 py-1"
          >
            <span className="max-w-[80px] truncate">{activeOption?.label ?? '选择'}</span>
            <ChevronDown className="h-3 w-3 shrink-0" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 bg-popover border border-border rounded-xl shadow-lg py-1 min-w-[130px] max-h-[200px] overflow-y-auto">
                {options.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => { setSelectedKey(opt.key); setDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors ${
                      opt.key === effectiveKey ? 'text-foreground font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 图标 */}
        <div className="w-8 h-8 rounded-[10px] flex items-center justify-center mb-3" style={{ background: 'rgba(249,115,22,0.08)' }}>
          <Calendar className="h-4 w-4" style={{ color: 'hsl(24 94% 50%)' }} />
        </div>

        {/* 数值 */}
        <div>
          <p className="text-[11px] sm:text-xs text-muted-foreground font-medium mb-1 pr-16">
            {activeOption?.label ?? '净利润'}
          </p>
          <p className="num-display leading-none" style={{ color: 'hsl(24 94% 50%)', fontSize: 'clamp(1.4rem, 2vw, 2.2rem)' }}>
            {fmtNum(projectProfit)}
          </p>
        </div>
      </div>
    </div>
  );
}
