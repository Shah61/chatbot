import { hash } from '../../lib/utils';

/* Generated artwork for catalog items. Every dish, treatment and product gets
   a stable abstract mark derived from its hue and id — so the template looks
   photographed without shipping a single image. */

export function Motif({
  hue,
  seed,
  size = 56,
  round = true,
  dark = false,
  className,
}: {
  hue: number;
  seed: string;
  size?: number;
  round?: boolean;
  dark?: boolean;
  className?: string;
}) {
  const h = hash(seed);
  const rot = h % 360;
  const dx = ((h >> 3) % 22) - 11;
  const dy = ((h >> 7) % 22) - 11;
  const rx = 26 + ((h >> 11) % 14);
  const ry = 20 + ((h >> 14) % 16);
  const id = `mo-${seed.replace(/[^a-z0-9]/gi, '')}`;

  const c = dark
    ? {
        bg1: `hsl(${hue} 30% 20%)`,
        bg2: `hsl(${hue} 26% 13%)`,
        s1: `hsl(${hue} 42% 38%)`,
        s2: `hsl(${(hue + 26) % 360} 48% 46%)`,
        s3: `hsl(${(hue + 340) % 360} 32% 28%)`,
        ring: 'rgba(255,255,255,0.13)',
        glow: 'rgba(255,255,255,0.16)',
      }
    : {
        bg1: `hsl(${hue} 46% 93%)`,
        bg2: `hsl(${hue} 40% 86%)`,
        s1: `hsl(${hue} 52% 74%)`,
        s2: `hsl(${(hue + 26) % 360} 58% 66%)`,
        s3: `hsl(${(hue + 340) % 360} 44% 82%)`,
        ring: 'rgba(0,0,0,0.07)',
        glow: 'rgba(255,255,255,0.6)',
      };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
      style={{ borderRadius: round ? '50%' : 'calc(var(--r-sm))', display: 'block' }}
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor={c.bg1} />
          <stop offset="100%" stopColor={c.bg2} />
        </linearGradient>
        <radialGradient id={`${id}-gl`} cx="0.32" cy="0.24" r="0.6">
          <stop offset="0%" stopColor={c.glow} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <clipPath id={`${id}-cl`}>
          {round ? <circle cx="50" cy="50" r="50" /> : <rect width="100" height="100" rx="14" />}
        </clipPath>
      </defs>

      <g clipPath={`url(#${id}-cl)`}>
        <rect width="100" height="100" fill={`url(#${id}-bg)`} />
        <g transform={`rotate(${rot} 50 50)`}>
          <ellipse cx={50 + dx} cy={52 + dy} rx={rx + 12} ry={ry + 14} fill={c.s3} opacity="0.85" />
          <ellipse cx={48 - dx} cy={50 + dy / 2} rx={rx} ry={ry} fill={c.s1} opacity="0.9" />
          <ellipse cx={54 + dy} cy={46 - dx} rx={ry * 0.6} ry={rx * 0.55} fill={c.s2} opacity="0.85" />
        </g>
        <rect width="100" height="100" fill={`url(#${id}-gl)`} />
      </g>

      {round ? (
        <circle cx="50" cy="50" r="49.4" fill="none" stroke={c.ring} strokeWidth="1.2" />
      ) : (
        <rect x="0.6" y="0.6" width="98.8" height="98.8" rx="13.6" fill="none" stroke={c.ring} strokeWidth="1.2" />
      )}
    </svg>
  );
}
