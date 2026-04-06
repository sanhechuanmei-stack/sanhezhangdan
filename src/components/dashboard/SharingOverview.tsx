import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutList, BarChart2 } from 'lucide-react';
import { useAppData } from '@/hooks/useAppData';
import { useCalculations } from '@/hooks/useCalculations';

const BAR_ROWS = [
  { label: '应分', key: 'expected' as const, color: 'hsl(var(--accent-blue))' },
  { label: '已分', key: 'paid' as const, color: 'hsl(var(--accent-green))' },
  { label: '未分', key: 'unpaid' as const, color: 'hsl(var(--accent-orange))' },
];

function PartnerHorizontalBar({ name, expected, paid, unpaid, onClick, compact }: {
  name: string; expected: number; paid: number; unpaid: number; onClick?: () => void; compact?: boolean;
}) {
  const total = expected > 0 ? expected : paid + unpaid;
  const values = { expected, paid, unpaid: Math.max(0, unpaid) };
  const pcts = {
    expected: 100,
    paid: total > 0 ? Math.min(100, (paid / total) * 100) : 0,
    unpaid: total > 0 ? Math.min(100, (Math.max(0, unpaid) / total) * 100) : 0,
  };

  return (
    <div
      className={`border-b border-border/30 last:border-0 cursor-pointer hover:bg-muted/30 transition-colors rounded-lg px-1 ${compact ? 'py-1.5' : 'py-2.5'}`}
      onClick={onClick}
    >
      <p className={`text-xs font-semibold text-foreground ${compact ? 'mb-1.5' : 'mb-2'}`}>{name}</p>
      <div className={`${compact ? 'space-y-1' : 'space-y-1.5'}`}>
        {BAR_ROWS.map((row) => (
          <div key={row.label} className="flex items-center gap-2.5">
            <span className="text-[10px] text-muted-foreground w-6 shrink-0 font-medium">{row.label}</span>
            <div className="flex-1 h-[5px] rounded-full bg-muted/60 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pcts[row.key]}%`, backgroundColor: row.color }}
              />
            </div>
            <span className="text-[11px] font-semibold tabular-nums w-20 text-right shrink-0 text-foreground num-display">
              ¥{values[row.key].toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SharingOverview() {
  const navigate = useNavigate();
  const { state } = useAppData();
  const { partnerSummaries } = useCalculations();
  const [view, setView] = useState<'chart' | 'list'>('chart');
  const [page, setPage] = useState<'main' | 'special'>('main');

  const filteredPartners = state.partners.filter((p) => {
    const summary = partnerSummaries.find((s) => s.partnerId === p.id);
    const hasData = summary && summary.expected > 0;
    const matchType = (p.type ?? 'main') === page;
    return hasData && matchType;
  });

  return (
    <div className="card-solid rounded-2xl p-4 sm:p-5 flex flex-col h-full min-h-[280px] xl:min-h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h3 className="font-display font-bold text-foreground text-[13px] sm:text-sm tracking-tight">分成总览</h3>
        <div className="flex items-center gap-2">
          {/* Page toggle */}
          <div className="segment">
            <button
              onClick={() => setPage('main')}
              className={`segment-item ${page === 'main' ? 'active' : ''}`}
            >
              主合伙人
            </button>
            <button
              onClick={() => setPage('special')}
              className={`segment-item ${page === 'special' ? 'active' : ''}`}
            >
              特殊合伙人
            </button>
          </div>
          {/* View toggle */}
          <div className="segment">
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
      </div>

      {/* Chart View */}
      {view === 'chart' && (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Legend */}
          <div className="flex items-center gap-3 mb-2 shrink-0">
            {BAR_ROWS.map((r) => (
              <span key={r.label} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                {r.label}
              </span>
            ))}
          </div>
          {filteredPartners.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">暂无分成数据</p>
            </div>
          ) : (
            <div className={`flex-1 min-h-0 ${page === 'special' ? 'overflow-y-auto' : 'flex flex-col justify-around'}`}>
              {filteredPartners.map((partner) => {
                const summary = partnerSummaries.find((s) => s.partnerId === partner.id)!;
                return (
                  <PartnerHorizontalBar
                    key={partner.id}
                    name={partner.name}
                    expected={Math.round(summary.expected)}
                    paid={summary.paid}
                    unpaid={Math.round(summary.unpaid)}
                    compact={page === 'main'}
                    onClick={() => navigate(`/sharing?partnerId=${partner.id}`)}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className={`flex flex-col flex-1 min-h-0 ${page === 'main' ? 'justify-around' : 'gap-1.5 overflow-y-auto'}`}>
          {filteredPartners.map((partner) => {
            const summary = partnerSummaries.find((s) => s.partnerId === partner.id);
            if (!summary) return null;
            return (
              <div
                key={partner.id}
                className="rounded-xl bg-[hsl(240_5%_97%)] p-2.5 sm:p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate(`/sharing?partnerId=${partner.id}`)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-display font-bold text-[11px] shrink-0">
                      {partner.name[0]}
                    </div>
                    <span className="font-display font-semibold text-foreground text-[13px] truncate">{partner.name}</span>
                  </div>
                  <div className="flex gap-3 sm:gap-5 text-xs shrink-0">
                    <div className="text-right">
                      <div className="text-muted-foreground mb-0.5 text-[10px]">应得</div>
                      <div className="font-semibold text-foreground num-display text-[11px]">¥{summary.expected.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-muted-foreground mb-0.5 text-[10px]">已分</div>
                      <div className="font-semibold text-apple-green num-display text-[11px]">¥{summary.paid.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-muted-foreground mb-0.5 text-[10px]">未分</div>
                      <div className="font-semibold text-apple-orange num-display text-[11px]">¥{summary.unpaid.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredPartners.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">暂无分成数据</p>
          )}
        </div>
      )}
    </div>
  );
}
