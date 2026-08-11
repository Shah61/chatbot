import { useEffect, useRef, useState } from 'react';
import { cx } from '../../lib/utils';

/* Hand-drawn SVG charts — no charting dependency, every pixel yours. */

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

export function Sparkline({
  values,
  color = 'var(--accent)',
  className,
}: {
  values: number[];
  color?: string;
  className?: string;
}) {
  const w = 100;
  const h = 30;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * w,
    h - 3 - ((v - min) / span) * (h - 6),
  ]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const id = `sp${Math.round(pts[0][1] * 100)}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${w} ${h} L0 ${h}Z`} fill={`url(#${id})`} />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

const SERIES = [
  { key: 'Conversations', color: 'var(--accent)' },
  { key: 'Completed', color: 'var(--spot)' },
];

export function AreaChart({ data, height = 232 }: { data: number[][]; height?: number }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const pad = { l: 34, r: 10, t: 14, b: 24 };
  const w = Math.max(width, 320);
  const iw = w - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const max = Math.ceil(Math.max(...data.map((d) => d[0])) / 20) * 20;

  const x = (i: number) => pad.l + (i / (data.length - 1)) * iw;
  const y = (v: number) => pad.t + ih - (v / max) * ih;
  const line = (k: number) =>
    data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(d[k]).toFixed(1)}`).join(' ');
  const area = (k: number) => `${line(k)} L${x(data.length - 1)} ${pad.t + ih} L${pad.l} ${pad.t + ih}Z`;

  const labels = data.map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (data.length - 1 - i));
    return d;
  });
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));

  return (
    <div className="chart" ref={ref}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${w} ${height}`}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          const rel = ((e.clientX - box.left) / box.width) * w;
          const i = Math.round(((rel - pad.l) / iw) * (data.length - 1));
          setHover(Math.max(0, Math.min(data.length - 1, i)));
        }}
      >
        <defs>
          <linearGradient id="ar-a" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.24" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ar-b" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--spot)" stopOpacity="0.26" />
            <stop offset="100%" stopColor="var(--spot)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((tv) => (
          <g key={tv}>
            <line x1={pad.l} x2={w - pad.r} y1={y(tv)} y2={y(tv)} stroke="var(--line)" strokeWidth="1" />
            <text x={pad.l - 8} y={y(tv) + 3.5} textAnchor="end" fontSize="10" fill="var(--ink-4)">
              {tv}
            </text>
          </g>
        ))}

        <path d={area(0)} fill="url(#ar-a)" />
        <path d={area(1)} fill="url(#ar-b)" />
        <path d={line(0)} fill="none" stroke="var(--accent)" strokeWidth="1.9" strokeLinejoin="round" strokeLinecap="round" />
        <path d={line(1)} fill="none" stroke="var(--spot)" strokeWidth="1.9" strokeLinejoin="round" strokeLinecap="round" />

        {labels.map((d, i) =>
          i % 3 === 0 || i === labels.length - 1 ? (
            <text key={i} x={x(i)} y={height - 6} textAnchor="middle" fontSize="10" fill="var(--ink-4)">
              {d.getDate()} {d.toLocaleDateString('en-GB', { month: 'short' })}
            </text>
          ) : null,
        )}

        {hover !== null && (
          <g>
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={pad.t}
              y2={pad.t + ih}
              stroke="var(--ink-4)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            {SERIES.map((s, k) => (
              <circle
                key={s.key}
                cx={x(hover)}
                cy={y(data[hover][k])}
                r="4"
                fill="var(--surface)"
                stroke={s.color}
                strokeWidth="2"
              />
            ))}
          </g>
        )}
      </svg>

      {hover !== null && width > 0 && (
        <div
          className="chart-tip"
          style={{
            left: `${(x(hover) / w) * 100}%`,
            top: y(Math.max(data[hover][0], data[hover][1])) - 12,
          }}
        >
          <div className="tip-title">
            {labels[hover].toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
          </div>
          {SERIES.map((s, k) => (
            <div className="tip-row" key={s.key}>
              <span className="swatch" style={{ background: s.color, width: 7, height: 7 }} />
              {s.key}
              <b style={{ marginLeft: 'auto', paddingLeft: 12 }}>{data[hover][k]}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ChartLegend() {
  return (
    <div className="legend">
      {SERIES.map((s) => (
        <span className="legend-item" key={s.key}>
          <span className="swatch" style={{ background: s.color }} />
          {s.key}
        </span>
      ))}
    </div>
  );
}

export function BarList({
  items,
}: {
  items: { label: string; count: number; tone: 'accent' | 'neutral' }[];
}) {
  const max = Math.max(...items.map((i) => i.count));
  return (
    <div className="barlist">
      {items.map((it, i) => (
        <div className="bar-row" key={it.label}>
          <span className="bar-label">{it.label}</span>
          <span className="bar-value">{it.count}</span>
          <span className="bar-track">
            <span
              className={cx('bar-fill', it.tone === 'neutral' && 'muted')}
              style={{ width: `${(it.count / max) * 100}%`, animationDelay: `${i * 55}ms` }}
            />
          </span>
        </div>
      ))}
    </div>
  );
}

export function Donut({
  segments,
  centre,
  caption,
  size = 116,
}: {
  segments: { label: string; value: number; color: string }[];
  centre: string;
  caption: string;
  size?: number;
}) {
  const total = segments.reduce((n, s) => n + s.value, 0);
  const r = size / 2 - 9;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="donut">
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth="11" />
          {segments.map((s) => {
            const len = (s.value / total) * c;
            const el = (
              <circle
                key={s.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="11"
                strokeDasharray={`${Math.max(len - 3, 0)} ${c - len + 3}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="donut-hole">
          <div>
            <div className="numeral">{centre}</div>
            <div className="eyebrow" style={{ fontSize: 8.5 }}>
              {caption}
            </div>
          </div>
        </div>
      </div>
      <div className="donut-key">
        {segments.map((s) => (
          <div className="donut-row" key={s.label}>
            <span className="swatch" style={{ background: s.color }} />
            {s.label}
            <b>{s.value}%</b>
          </div>
        ))}
      </div>
    </div>
  );
}
