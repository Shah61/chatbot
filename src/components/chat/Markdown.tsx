import { memo, useState, type ReactNode } from 'react';
import { Icon } from '../Icon';

/* ==========================================================================
   Markdown

   A model writes markdown whether or not you asked it to, so the transcript
   has to read it. This is not a spec-complete parser and does not want to be:
   a chat turn needs headings, lists, tables, code and emphasis, and it has to
   survive being handed half a document — which is what a stream is. Every
   construct here degrades to the literal text it was typed as, so a sentence
   caught mid-token never flickers into the wrong shape.

   No dependency. The whole thing is ~200 lines and renders React directly,
   so there is no HTML string anywhere and nothing to sanitise.
   ========================================================================== */

/* --- Inline ---------------------------------------------------------------- */

const ESCAPABLE = '\\`*_{}[]()#+-.!>~|';

type Rule = [RegExp, (m: RegExpExecArray, key: string) => ReactNode];

const href = (raw: string) => {
  /* Only ever link somewhere a browser can safely go. A model that emits
     javascript: or data: gets its text shown, not honoured. */
  const url = raw.trim();
  return /^(https?:|mailto:|tel:)/i.test(url) ? url : null;
};

const Link = ({ to, children }: { to: string; children: ReactNode }) => {
  const safe = href(to);
  if (!safe) return <>{children}</>;
  return (
    <a href={safe} target="_blank" rel="noreferrer noopener">
      {children}
      <Icon name="arrowUpRight" size={11} className="md-ext" />
    </a>
  );
};

/* Sticky, so the scanner can test at a position without slicing the string. */
const RULES: Rule[] = [
  /* Code first — nothing inside a span is markup. */
  [/`([^`\n]+)`/y, (m, k) => <code key={k}>{m[1]}</code>],
  [/\*\*(\S[\s\S]*?)\*\*/y, (m, k) => <strong key={k}>{inline(m[1])}</strong>],
  [/(?<![A-Za-z0-9_])__(\S[\s\S]*?)__(?![A-Za-z0-9_])/y, (m, k) => <strong key={k}>{inline(m[1])}</strong>],
  [/~~(\S[\s\S]*?)~~/y, (m, k) => <s key={k}>{inline(m[1])}</s>],
  [/\*(\S[\s\S]*?)\*/y, (m, k) => <em key={k}>{inline(m[1])}</em>],
  /* file_name_like_this is not emphasis, so both ends must sit at a boundary. */
  [/(?<![A-Za-z0-9_])_(\S[\s\S]*?)_(?![A-Za-z0-9_])/y, (m, k) => <em key={k}>{inline(m[1])}</em>],
  /* An image is a link to an image. Remote pictures in a support widget are
     someone else's tracking pixel, and the alt text is the useful half. */
  [
    /!\[([^\]]*)\]\(\s*<?([^\s)>]*)>?[^)]*\)/y,
    (m, k) => (
      <Link key={k} to={m[2]}>
        <Icon name="image" size={12} className="md-ico" />
        {m[1] || 'image'}
      </Link>
    ),
  ],
  [
    /\[([^\]]*)\]\(\s*<?([^\s)>]*)>?(?:\s+"[^"]*")?\s*\)/y,
    (m, k) => (
      <Link key={k} to={m[2]}>
        {inline(m[1])}
      </Link>
    ),
  ],
  [/<((?:https?:\/\/|mailto:)[^>\s]+)>/y, (m, k) => <Link key={k} to={m[1]}>{m[1]}</Link>],
  /* Bare URLs, minus any trailing punctuation that belongs to the sentence. */
  [
    /https?:\/\/[^\s<>()[\]]+[^\s<>()[\].,;:!?'"]/y,
    (m, k) => (
      <Link key={k} to={m[0]}>
        {m[0].replace(/^https?:\/\//, '')}
      </Link>
    ),
  ],
];

function inline(src: string): ReactNode[] {
  const out: ReactNode[] = [];
  let buf = '';
  let i = 0;
  let n = 0;
  const flush = () => {
    if (buf) out.push(buf);
    buf = '';
  };

  while (i < src.length) {
    const c = src[i];

    if (c === '\\' && ESCAPABLE.includes(src[i + 1] ?? '')) {
      buf += src[i + 1];
      i += 2;
      continue;
    }

    /* A single newline inside a paragraph is a line the writer meant. Chat is
       not prose — addresses and steps arrive one per line. */
    if (c === '\n') {
      flush();
      out.push(<br key={`n${n++}`} />);
      i++;
      continue;
    }

    let hit = false;
    for (const [re, make] of RULES) {
      re.lastIndex = i;
      const m = re.exec(src);
      if (!m) continue;
      /* Advance off the match, not off re.lastIndex: make() recurses into
         inline() for the emphasised content, and the rules are shared, so by
         the time it returns lastIndex belongs to the inner scan. */
      const end = i + m[0].length;
      flush();
      out.push(make(m, `i${n++}`));
      i = end;
      hit = true;
      break;
    }
    if (!hit) {
      buf += c;
      i++;
    }
  }

  flush();
  return out;
}

/* --- Blocks ---------------------------------------------------------------- */

const FENCE = /^\s{0,3}(```|~~~)(.*)$/;
const HEADING = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
const RULE = /^\s{0,3}([-*_])[ \t]*(?:\1[ \t]*){2,}$/;
const QUOTE = /^\s{0,3}>/;
const ITEM = /^(\s*)([-*+]|\d{1,9}[.)])([ \t]+)(.*)$/;
const DIVIDER = /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/;

const indentOf = (l: string) => l.length - l.trimStart().length;

const opensBlock = (l: string) =>
  FENCE.test(l) || HEADING.test(l) || RULE.test(l) || QUOTE.test(l) || ITEM.test(l);

const cells = (row: string) =>
  row
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split(/(?<!\\)\|/)
    .map((c) => c.trim().replace(/\\\|/g, '|'));

function blocksOf(src: string): ReactNode[] {
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  const out: ReactNode[] = [];
  let i = 0;
  let k = 0;
  const key = () => `b${k++}`;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    /* Fenced code. The closing fence is optional: while a reply is streaming
       there simply is not one yet, and a half-written block still reads as
       code. */
    const fence = FENCE.exec(line);
    if (fence) {
      const close = new RegExp(`^\\s{0,3}${fence[1]}\\s*$`);
      const body: string[] = [];
      i++;
      while (i < lines.length && !close.test(lines[i])) body.push(lines[i++]);
      i++;
      out.push(<CodeBlock key={key()} lang={fence[2].trim().split(/\s+/)[0]} code={body.join('\n')} />);
      continue;
    }

    const head = HEADING.exec(line);
    if (head) {
      const Tag = `h${head[1].length}` as 'h1';
      out.push(<Tag key={key()}>{inline(head[2])}</Tag>);
      i++;
      continue;
    }

    /* Before lists — '- - -' is a rule, not three empty bullets. */
    if (RULE.test(line)) {
      out.push(<hr key={key()} />);
      i++;
      continue;
    }

    if (QUOTE.test(line)) {
      const body: string[] = [];
      while (i < lines.length && (QUOTE.test(lines[i]) || (body.length && lines[i].trim()))) {
        body.push(lines[i].replace(/^\s{0,3}>[ \t]?/, ''));
        i++;
      }
      out.push(<blockquote key={key()}>{blocksOf(body.join('\n'))}</blockquote>);
      continue;
    }

    /* A table is only a table once the divider row confirms it. */
    if (line.includes('|') && DIVIDER.test(lines[i + 1] ?? '')) {
      const align = cells(lines[i + 1]).map((c) =>
        c.startsWith(':') && c.endsWith(':') ? 'center' : c.endsWith(':') ? 'right' : undefined,
      );
      const header = cells(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) rows.push(cells(lines[i++]));
      out.push(
        <div className="md-table" key={key()}>
          <table>
            <thead>
              <tr>
                {header.map((c, n) => (
                  <th key={n} style={{ textAlign: align[n] }}>
                    {inline(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, y) => (
                <tr key={y}>
                  {header.map((_, x) => (
                    <td key={x} style={{ textAlign: align[x] }}>
                      {inline(r[x] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (ITEM.test(line)) {
      const [node, next] = takeList(lines, i, key);
      out.push(node);
      i = next;
      continue;
    }

    const para: string[] = [lines[i++]];
    while (i < lines.length && lines[i].trim() && !opensBlock(lines[i])) para.push(lines[i++]);
    out.push(<p key={key()}>{inline(para.join('\n'))}</p>);
  }

  return out;
}

/** One run of same-kind items at one indent. Nested lists recurse through
    the item body, which keeps `1. a / - b` working without special cases. */
function takeList(lines: string[], start: number, key: () => string): [ReactNode, number] {
  const first = ITEM.exec(lines[start])!;
  const indent = first[1].length;
  const ordered = /\d/.test(first[2]);
  const items: string[] = [];
  let loose = false;
  let i = start;

  while (i < lines.length) {
    const m = ITEM.exec(lines[i]);
    if (!m || m[1].length !== indent || /\d/.test(m[2]) !== ordered || RULE.test(lines[i])) break;

    const body = [m[4]];
    const cont = indent + m[2].length + m[3].length;
    i++;

    while (i < lines.length) {
      const l = lines[i];
      if (!l.trim()) {
        const next = lines[i + 1] ?? '';
        /* Indented: the item continues — a second paragraph, or a nested
           block that wanted air above it. */
        if (next.trim() && indentOf(next) >= cont) {
          loose = true;
          body.push('');
          i++;
          continue;
        }
        /* A sibling marker: still one list, written with air between the
           items. Swallow the blank so the outer loop sees the marker. */
        const sib = ITEM.exec(next);
        if (sib && sib[1].length === indent && /\d/.test(sib[2]) === ordered) {
          loose = true;
          i++;
        }
        break;
      }
      if (indentOf(l) >= cont) {
        body.push(l.slice(cont));
        i++;
        continue;
      }
      if (opensBlock(l)) break;
      /* Lazy continuation — a wrapped line the writer did not indent. */
      body.push(l.trim());
      i++;
    }

    items.push(body.join('\n'));
  }

  const rendered = items.map((body, n) => {
    const task = /^\[([ xX])\][ \t]+/.exec(body);
    return (
      <li key={n} className={task ? 'md-task' : undefined}>
        {task && (
          <span className={task[1] === ' ' ? 'md-box' : 'md-box on'} aria-hidden>
            {task[1] !== ' ' && <Icon name="check" size={10} strokeWidth={2.6} />}
          </span>
        )}
        {blocksOf(task ? body.slice(task[0].length) : body)}
      </li>
    );
  });

  const cls = loose ? 'md-loose' : undefined;
  const startNo = ordered ? Number.parseInt(first[2], 10) : undefined;
  return [
    ordered ? (
      <ol key={key()} className={cls} start={startNo === 1 ? undefined : startNo}>
        {rendered}
      </ol>
    ) : (
      <ul key={key()} className={cls}>
        {rendered}
      </ul>
    ),
    i,
  ];
}

/* --- Code ------------------------------------------------------------------ */

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* Clipboard refused — no permission, or an insecure origin. Say
         nothing; the code is right there to select. */
    }
  };

  return (
    <div className="md-pre">
      <div className="md-pre-head">
        <span>{lang || 'code'}</span>
        <button onClick={copy} aria-label="Copy code">
          <Icon name={copied ? 'check' : 'copy'} size={11.5} />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* --- Entry ----------------------------------------------------------------- */

/** Renders one message's text. Memoised on the string, because a streaming
    turn re-renders the whole transcript on every token. */
export const Markdown = memo(function Markdown({ text }: { text: string }) {
  return <div className="md">{blocksOf(text)}</div>;
});
