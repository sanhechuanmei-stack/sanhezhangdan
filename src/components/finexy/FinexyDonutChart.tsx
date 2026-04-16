import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';

interface FinexyDonutChartProps {
  paid: number;
  unpaid: number;
  centerLabel?: string;
  centerValue?: string;
}

export function FinexyDonutChart({ paid, unpaid, centerLabel = '总应分成', centerValue }: FinexyDonutChartProps) {
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    setAnimKey(k => k + 1);
  }, [paid, unpaid]);

  const total = paid + unpaid;
  const data = total > 0
    ? [
        { name: '未分成', value: unpaid, color: '#CBFB45' },
        { name: '已分成', value: paid, color: '#E2E5E9' },
      ]
    : [{ name: '暂无', value: 1, color: '#F0F2F5' }];

  const displayValue = centerValue ?? `¥${Math.round(total).toLocaleString('zh-CN')}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', minHeight: 0 }}>
      <div style={{ flex: 1, minHeight: 0, width: '100%', position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart key={animKey}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="78%"
              startAngle={90}
              endAngle={-270}
              paddingAngle={total > 0 ? 3 : 0}
              dataKey="value"
              stroke="none"
              animationBegin={0}
              animationDuration={1000}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="fx-donut-center">
          <div className="fx-donut-center-label">{centerLabel}</div>
          <div className="fx-donut-center-value">{displayValue}</div>
        </div>
      </div>

      <div className="fx-donut-legend" style={{ flexShrink: 0 }}>
        <div className="fx-donut-legend-item">
          <div className="fx-donut-legend-dot" style={{ background: '#CBFB45' }} />
          <span>未分成</span>
          <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', marginLeft: 4 }}>
            ¥{Math.round(unpaid).toLocaleString('zh-CN')}
          </span>
        </div>
        <div className="fx-donut-legend-item">
          <div className="fx-donut-legend-dot" style={{ background: '#E2E5E9' }} />
          <span>已分成</span>
          <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', marginLeft: 4 }}>
            ¥{Math.round(paid).toLocaleString('zh-CN')}
          </span>
        </div>
      </div>
    </div>
  );
}
