import { useId, type ReactNode } from 'react';
import { formatNumber } from '../lib';

export interface DonutSlice {
  id: string;
  label: string;
  value: number;
  color: string;
}

export function Donut({
  data,
  size = 208,
  stroke = 22,
  selected,
  onSelect,
  children,
}: {
  data: DonutSlice[];
  size?: number;
  stroke?: number;
  selected?: string | null;
  onSelect?: (id: string) => void;
  children?: ReactNode;
}) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Расходы по категориям">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--chart-track)"
          strokeWidth={stroke}
        />
        {data.map((slice) => {
          const portion = total > 0 ? slice.value / total : 0;
          const dash = portion * circumference;
          const visible = Math.max(0, dash - 3);
          const offset = cumulative;
          cumulative += dash;
          const isSelected = selected === slice.id;
          const isDimmed = selected && !isSelected;
          return (
            <circle
              key={slice.id}
              className={`donut__slice ${isDimmed ? 'is-dimmed' : ''}`}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={isSelected ? stroke + 6 : stroke}
              strokeLinecap="round"
              strokeDasharray={`${visible} ${circumference - visible}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              onClick={() => onSelect?.(slice.id)}
              tabIndex={onSelect ? 0 : -1}
              role={onSelect ? 'button' : undefined}
              aria-label={`${slice.label}: ${formatNumber(slice.value)} рублей`}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect?.(slice.id);
                }
              }}
            />
          );
        })}
      </svg>
      <div className="donut__center">{children}</div>
    </div>
  );
}

export function Sparkline({
  values,
  color = '#FFFFFF',
  height = 62,
  fill = true,
}: {
  values: number[];
  color?: string;
  height?: number;
  fill?: boolean;
}) {
  const id = useId().replace(/:/g, '');
  const width = 320;
  const padding = 6;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((value, index) => ({
    x: padding + (index / (values.length - 1)) * (width - padding * 2),
    y: padding + (1 - (value - min) / span) * (height - padding * 2),
  }));

  let line = `M ${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const midX = (previous.x + current.x) / 2;
    line += ` C ${midX} ${previous.y}, ${midX} ${current.y}, ${current.x} ${current.y}`;
  }
  const area = `${line} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <svg
      className="sparkline"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".34" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#spark-${id})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function WeeklyBars({
  data,
  color = 'var(--accent)',
}: {
  data: { label: string; value: number; active?: boolean }[];
  color?: string;
}) {
  const max = Math.max(...data.map((item) => item.value), 1);
  return (
    <div className="bars" role="img" aria-label="Расходы по дням недели">
      {data.map((item) => (
        <div className={`bars__col ${item.active ? 'is-active' : ''}`} key={item.label}>
          <span className="bars__value">{formatNumber(item.value / 1000)}к</span>
          <span className="bars__track">
            <span
              className="bars__fill"
              style={{
                height: `${Math.max(8, (item.value / max) * 100)}%`,
                background: item.active ? color : undefined,
              }}
            />
          </span>
          <span className="bars__label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

