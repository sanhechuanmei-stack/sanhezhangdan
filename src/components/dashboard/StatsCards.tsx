import { useNavigate } from 'react-router-dom';
import { useAppData } from '@/hooks/useAppData';
import { useCalculations } from '@/hooks/useCalculations';
import { calcCurrentPeriodProfit } from '@/lib/calculations';
import { TrendingUp, Wallet, Calendar, GraduationCap } from 'lucide-react';

interface StatsCardsProps {
  offlineProjectId?: string;
  selectedPeriod?: string;
}

export function StatsCards({ offlineProjectId, selectedPeriod }: StatsCardsProps) {
  const navigate = useNavigate();
  const { state } = useAppData();
  const {
    totalBalance,
    monthlyTotalIncome,
    monthlyYanxisheIncome,
  } = useCalculations();

  const currentPeriodOfflineIncome = offlineProjectId && selectedPeriod
    ? calcCurrentPeriodProfit(offlineProjectId, state.bills, selectedPeriod)
    : 0;

  const periodLabel = selectedPeriod ? `${selectedPeriod}线下课` : '本次线下课';

  const fmtNum = (n: number) => Math.round(n).toLocaleString('zh-CN');

  const stats = [
    { label: '账面总结余', value: fmtNum(totalBalance), color: 'hsl(var(--accent-blue))', bg: 'rgba(79,70,229,0.08)', icon: Wallet },
    { label: '本月总收入', value: fmtNum(monthlyTotalIncome), color: 'hsl(160 72% 38%)', bg: 'rgba(16,185,129,0.08)', icon: TrendingUp },
    { label: periodLabel, value: fmtNum(currentPeriodOfflineIncome), color: 'hsl(24 94% 50%)', bg: 'rgba(249,115,22,0.08)', icon: Calendar, onClick: () => navigate('/offline-course') },
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
          <div
            className="w-8 h-8 rounded-[10px] flex items-center justify-center mb-3"
            style={{ background: stat.bg }}
          >
            <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
          </div>
          <div>
            <p className="text-[11px] sm:text-xs text-muted-foreground font-medium mb-1">{stat.label}</p>
            <p
              className="num-display leading-none"
              style={{ color: stat.color, fontSize: 'clamp(1.4rem, 2vw, 2.2rem)' }}
            >
              {stat.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
