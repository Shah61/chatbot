/* One stroked icon set on a 24×24 grid, so the template has no icon
   dependency to install, version or tree-shake. */

const P: Record<string, React.ReactNode> = {
  send: <path d="M4.5 12 20 4.5 15 20l-3.4-6.1L4.5 12Z" />,
  sparkle: (
    <>
      <path d="M12 3.4 13.75 9l5.6 1.75-5.6 1.75L12 18.1l-1.75-5.6L4.65 10.75 10.25 9 12 3.4Z" />
      <path d="M18.6 15.4 19.3 17.8l2.4.7-2.4.8-.7 2.4-.8-2.4-2.4-.8 2.4-.7.8-2.4Z" />
    </>
  ),
  wand: (
    <>
      <path d="M4 20 14.5 9.5M16.8 7.2 14.5 9.5m2.3-2.3L18.6 5.4m-1.8 1.8 1.7 1.7" />
      <path d="M10.6 3.6 11.2 5.3l1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6.6-1.7ZM19.6 12.4l.5 1.4 1.4.5-1.4.5-.5 1.4-.5-1.4-1.4-.5 1.4-.5.5-1.4Z" />
    </>
  ),
  paperclip: <path d="M20 11.5 12.4 19a4.6 4.6 0 0 1-6.5-6.5l7.6-7.6a3.1 3.1 0 0 1 4.4 4.4l-7.6 7.6a1.5 1.5 0 0 1-2.2-2.2l7-7" />,
  mic: (
    <>
      <rect x="9.25" y="3" width="5.5" height="10.5" rx="2.75" />
      <path d="M5.75 11.5a6.25 6.25 0 0 0 12.5 0M12 17.75V21" />
    </>
  ),
  close: <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />,
  minus: <path d="M5.5 12h13" />,
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  expand: <path d="M14.5 4.5h5v5M9.5 19.5h-5v-5M19.5 4.5 14 10M4.5 19.5 10 14" />,
  collapse: <path d="M19 9.5h-4.5V5M5 14.5h4.5V19M14.5 9.5 19.5 4.5M9.5 14.5 4.5 19.5" />,
  chevronDown: <path d="m6.5 9.5 5.5 5.5 5.5-5.5" />,
  chevronUp: <path d="m6.5 14.5 5.5-5.5 5.5 5.5" />,
  chevronRight: <path d="m9.5 6 6 6-6 6" />,
  chevronLeft: <path d="m14.5 6-6 6 6 6" />,
  arrowRight: <path d="M4.5 12h15m-6-6 6 6-6 6" />,
  arrowLeft: <path d="M19.5 12h-15m6-6-6 6 6 6" />,
  arrowUpRight: <path d="M7 17 17 7m-7.5 0H17v7.5" />,
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  ticks: <path d="m2.5 12.6 3.8 3.8 7-8M10.5 16.4l.9.9 7.6-8.6" />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.3 12.2 2.6 2.6 4.8-5.2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.75" y="5.25" width="16.5" height="15" rx="2.5" />
      <path d="M3.75 10h16.5M8.5 3v4.5M15.5 3v4.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.2V12l3.2 2" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21c4-4.6 6-7.9 6-10.4A6 6 0 0 0 6 10.6C6 13.1 8 16.4 12 21Z" />
      <circle cx="12" cy="10.5" r="2.3" />
    </>
  ),
  star: <path d="m12 4 2.5 5.1 5.6.8-4 4 .9 5.6-5-2.7-5 2.7.9-5.6-4-4 5.6-.8L12 4Z" />,
  heart: <path d="M12 20.3C6.4 16.6 3.5 13.6 3.5 10.2A4.7 4.7 0 0 1 12 7.4a4.7 4.7 0 0 1 8.5 2.8c0 3.4-2.9 6.4-8.5 10.1Z" />,
  user: (
    <>
      <circle cx="12" cy="8.2" r="3.7" />
      <path d="M4.8 20c.9-3.7 3.7-5.6 7.2-5.6s6.3 1.9 7.2 5.6" />
    </>
  ),
  users: (
    <>
      <circle cx="9.5" cy="8.5" r="3.2" />
      <path d="M3.5 19.5c.7-3.2 3.1-4.9 6-4.9s5.3 1.7 6 4.9M16 5.6a3.2 3.2 0 0 1 0 6M17.5 14.9c2.1.5 3.3 2 3.8 4.6" />
    </>
  ),
  chat: <path d="M20.5 12.3c0 4-3.8 7.2-8.5 7.2a9.8 9.8 0 0 1-2.8-.4L4 20.5l1.5-3.7a6.9 6.9 0 0 1-2-4.5c0-4 3.8-7.3 8.5-7.3s8.5 3.3 8.5 7.3Z" />,
  inbox: (
    <>
      <path d="M3.5 13.5h4l1.5 3h6l1.5-3h4" />
      <path d="M5.6 5.5h12.8l2.1 8v4.5a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2V13.5l2.1-8Z" />
    </>
  ),
  grid: (
    <>
      <rect x="3.75" y="3.75" width="7" height="7" rx="1.8" />
      <rect x="13.25" y="3.75" width="7" height="7" rx="1.8" />
      <rect x="3.75" y="13.25" width="7" height="7" rx="1.8" />
      <rect x="13.25" y="13.25" width="7" height="7" rx="1.8" />
    </>
  ),
  list: <path d="M8.5 6.5h11M8.5 12h11M8.5 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" />,
  book: <path d="M4.5 5.2c2.8-1 5.2-1 7.5.9 2.3-1.9 4.7-1.9 7.5-.9v13c-2.8-1-5.2-1-7.5.8-2.3-1.8-4.7-1.8-7.5-.8v-13ZM12 6.1v12.8" />,
  bolt: <path d="M13.2 3 5.5 13.4h5.4L10.8 21l7.7-10.4h-5.4L13.2 3Z" />,
  bag: (
    <>
      <path d="M5.4 7.5h13.2l1 12a1.9 1.9 0 0 1-1.9 2H6.3a1.9 1.9 0 0 1-1.9-2l1-12Z" />
      <path d="M8.8 9.6V6.4a3.2 3.2 0 0 1 6.4 0v3.2" />
    </>
  ),
  truck: (
    <>
      <path d="M2.8 6.5h10.4v9.8H2.8zM13.2 10.2h3.6l2.6 3v3.1h-6.2z" />
      <circle cx="7" cy="18" r="1.8" />
      <circle cx="16.5" cy="18" r="1.8" />
    </>
  ),
  utensils: <path d="M7 3v7.5a2 2 0 0 0 4 0V3M9 10.5V21M17.5 3c-1.6 1-2.5 3-2.5 5.4 0 1.6.7 2.6 2 2.9V21" />,
  scissors: (
    <>
      <circle cx="6.5" cy="6.5" r="2.6" />
      <circle cx="6.5" cy="17.5" r="2.6" />
      <path d="M8.7 8.2 20 18.5M8.7 15.8 20 5.5" />
    </>
  ),
  stethoscope: (
    <>
      <path d="M6 3.5v5.2a4.2 4.2 0 0 0 8.4 0V3.5" />
      <path d="M4.4 3.5h3.2M12.8 3.5H16M10.2 13v2.6a4.4 4.4 0 0 0 8.8 0v-1.4" />
      <circle cx="19" cy="12.6" r="1.9" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="2.9" />
      <path d="M12 3.2v2.2M12 18.6v2.2M20.8 12h-2.2M5.4 12H3.2M18.2 5.8l-1.6 1.6M7.4 16.6l-1.6 1.6M18.2 18.2l-1.6-1.6M7.4 7.4 5.8 5.8" />
    </>
  ),
  sliders: <path d="M4.5 7.5h9M17.5 7.5h2M4.5 16.5h2M10.5 16.5h9M15.5 5.5v4M8.5 14.5v4" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  bell: <path d="M18 9.5a6 6 0 1 0-12 0c0 4.2-1.5 5.5-1.5 5.5h15S18 13.7 18 9.5ZM10.3 18.5a2 2 0 0 0 3.4 0" />,
  filter: <path d="M4 6h16l-6.2 7.3V19l-3.6 1.6v-7.3L4 6Z" />,
  download: <path d="M12 4v11m0 0 4-4m-4 4-4-4M4.5 19.5h15" />,
  more: (
    <>
      <circle cx="5.5" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="12" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  phone: <path d="M8.4 4.5 10 8.1l-2 1.6a10.5 10.5 0 0 0 5.9 5.9l1.6-2 3.6 1.6v3.2a1.7 1.7 0 0 1-1.9 1.7C10.4 19.6 4.4 13.6 3.6 6.4A1.7 1.7 0 0 1 5.3 4.5h3.1Z" />,
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.4" />
      <path d="m4.5 8 7.5 5 7.5-5" />
    </>
  ),
  shield: <path d="M12 3.5 19 6v5.6c0 4.2-2.8 7.3-7 8.9-4.2-1.6-7-4.7-7-8.9V6l7-2.5ZM9.2 12.1l2 2 3.6-3.9" />,
  trendUp: <path d="M4 16.5 9.5 11l3.5 3.5L20 7.5m0 0h-4.8m4.8 0v4.8" />,
  trendDown: <path d="M4 7.5 9.5 13l3.5-3.5L20 16.5m0 0h-4.8m4.8 0v-4.8" />,
  moon: <path d="M20 14.3A8.2 8.2 0 0 1 9.7 4 8.5 8.5 0 1 0 20 14.3Z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.8v2M12 19.2v2M21.2 12h-2M4.8 12h-2M18.5 5.5 17 7M7 17l-1.5 1.5M18.5 18.5 17 17M7 7 5.5 5.5" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.2 2.3 3.3 5.1 3.3 8.5S14.2 18.2 12 20.5c-2.2-2.3-3.3-5.1-3.3-8.5S9.8 5.8 12 3.5Z" />
    </>
  ),
  whatsapp: <path d="M4 20.2 5.2 16A7.6 7.6 0 1 1 8.3 19L4 20.2ZM9.3 8.6c.6 2.9 3.2 5.4 6.1 6l1-1.6 1.8.9v1.5c-3.8.6-8.2-3.4-8.8-7.3h1.5l.9 1.8-.9.7" />,
  instagram: (
    <>
      <rect x="3.75" y="3.75" width="16.5" height="16.5" rx="4.6" />
      <circle cx="12" cy="12" r="3.7" />
      <path d="M16.9 7.1h.01" />
    </>
  ),
  sms: <path d="M20.5 11.8c0 3.7-3.8 6.7-8.5 6.7a10 10 0 0 1-2.6-.3L4.5 20l1.3-3.2a6.4 6.4 0 0 1-1.8-5C4 8 7.8 5 12 5s8.5 3 8.5 6.8ZM9 11.8h.01M12 11.8h.01M15 11.8h.01" />,
  refresh: <path d="M20 12a8 8 0 1 1-2.4-5.7M20 4v4.5h-4.5" />,
  external: <path d="M14 4.5h5.5V10M19 5l-7.5 7.5M17.5 14v4a1.9 1.9 0 0 1-1.9 1.9H6a1.9 1.9 0 0 1-1.9-1.9V8.4A1.9 1.9 0 0 1 6 6.5h4" />,
  lock: (
    <>
      <rect x="4.75" y="10.25" width="14.5" height="10" rx="2.4" />
      <path d="M8 10V7.8a4 4 0 0 1 8 0V10" />
    </>
  ),
  pencil: <path d="M4.5 19.5h4L19 9a2.5 2.5 0 0 0-3.5-3.5L5 16v3.5ZM14.5 6.5l3 3" />,
  trash: <path d="M4.5 6.5h15M9.5 6.5V4.8a1.3 1.3 0 0 1 1.3-1.3h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7M6.5 6.5l.9 12.2a1.9 1.9 0 0 0 1.9 1.8h5.4a1.9 1.9 0 0 0 1.9-1.8l.9-12.2M10 10.5v6M14 10.5v6" />,
  copy: (
    <>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2.2" />
      <path d="M15.5 5.5H6.7A2.2 2.2 0 0 0 4.5 7.7v8.8" />
    </>
  ),
  filePlus: (
    <>
      <path d="M13.5 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9l-5.5-5.5Z" />
      <path d="M13.5 3.5V9H19M12 12.5v5M9.5 15h5" />
    </>
  ),
  route: (
    <>
      <circle cx="6.5" cy="6" r="2.5" />
      <circle cx="17.5" cy="18" r="2.5" />
      <path d="M9 6h4.5a4 4 0 0 1 0 8H10a4 4 0 0 0 0 8h.5" />
    </>
  ),
  image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.4" />
      <circle cx="8.8" cy="9.6" r="1.6" />
      <path d="m4.5 17 4.8-4.6 4 3.6 2.9-2.6 3.3 3" />
    </>
  ),
  tag: (
    <>
      <path d="M4.5 11V5.4a.9.9 0 0 1 .9-.9H11l8.2 8.2a1.8 1.8 0 0 1 0 2.6l-4.5 4.5a1.8 1.8 0 0 1-2.6 0L4.5 11Z" />
      <circle cx="8.6" cy="8.6" r="1.2" />
    </>
  ),
  eye: (
    <>
      <path d="M2.8 12S6.4 6 12 6s9.2 6 9.2 6-3.6 6-9.2 6-9.2-6-9.2-6Z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  alert: <path d="M12 4.6 21 20H3l9-15.4ZM12 10v4M12 17h.01" />,
  play: <path d="M7.5 5.2 18.5 12 7.5 18.8V5.2Z" />,
  pause: <path d="M9.5 5.5v13M14.5 5.5v13" />,
  undo: <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" />,
  layers: <path d="m12 3.5 8.5 4.4L12 12.3 3.5 7.9 12 3.5ZM3.5 12.2 12 16.6l8.5-4.4M3.5 16.4 12 20.8l8.5-4.4" />,
};

export type IconName = keyof typeof P;

export function Icon({
  name,
  size = 16,
  strokeWidth = 1.5,
  className,
  style,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {P[name]}
    </svg>
  );
}
