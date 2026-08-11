# Saint

An AI assistant for small businesses — it books, sells and answers — shipped as
three worked vertical templates plus a full admin console.

```bash
npm install
cp .env.example .env     # paste your OpenRouter key in
npm run dev              # server on :8787, client on :5173
```

Without a key everything still runs — the widget falls back to its scripted
flow and Saint Copy tells you what is missing. Nothing is faked.

## What's in the box

Two views, switchable from the top bar:

- **Storefront** — a photography-led marketing site with the chat widget live on it
- **Console** — the admin the business owner actually uses

Three brands, switchable from the same bar. Changing brand re-skins the theme,
re-points the copy, swaps the imagery, and changes what the assistant can *do*:

| Brand | Vertical | Skills |
| --- | --- | --- |
| Lumière | Restaurant | Order for delivery/collection · book a table · FAQ |
| Aurelia | Clinic | Book an appointment · reschedule · FAQ · triage handoff |
| Solène | Salon | Book a chair · shop products · FAQ |

## The chat widget

The booking and ordering flows are real, not screenshots. Tap through them, or
type — free text is parsed for intent, dates ("friday"), times ("half seven"),
party size and dish names. A live basket tray sits above the composer during an
order; picked cards lock with the answer showing, the way a real transcript reads.

Message content is a block vocabulary (`src/lib/types.ts`) — text, catalog,
people, dates, slots, tickets, progress. `reply()` in `src/lib/bot.ts` is a
deterministic state machine; swap it for a model call, keep the same block
contract, and the UI needs no changes.

## The console

- **Overview** — volume, conversion, intents, channels, live conversations
- **Inbox** — transcripts, sentiment, AI-suggested replies, escalation trail
- **Orders / Bookings** — everything Saint closed, by hour and by channel
- **Menu / Treatments / Services** — the catalog editor, below
- **Knowledge** — answers with confidence scores and unanswered-question gaps
- **Settings** — voice, automations, channels, handover rules

### Catalog editor + Saint Copy

Open any item. Price, group, duration, availability and allergens are editable,
and edits flow straight into the widget — turn a dish off and the assistant
stops offering it mid-conversation.

The part that sells it is **Saint Copy**: an owner who cannot face writing forty
descriptions picks a tone (warm / precise / playful) and gets three drafts, then
refines with *shorter*, *add detail*, *more formal*. Copy checks flag length,
filler and non-compliant claims.

`src/lib/ai.ts` is a local stand-in so the template runs with no API key.
Replace `draftDescriptions()` with your model call — same signature, same return
shape — and everything above it keeps working.

## The backend

A small Node server in `server/`, proxied by Vite in development so the
browser only ever talks to one origin and the key never leaves the machine.

| Route | Does |
|---|---|
| `GET /api/health` | Is a key present, which model, which brands are switched on |
| `POST /api/chat` | One turn, streamed over SSE, with tool calling |
| `POST /api/copy` | Saint Copy — writes and rewrites catalog descriptions |
| `GET /api/bookings` | Everything booked this session |

`.env` holds `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` and `AI_BRANDS`. There is
deliberately no `VITE_` prefix — Vite inlines those into the client bundle,
which would publish your key to anyone who opens the page.

`AI_BRANDS` defaults to `aurelia,solene`. Food ordering is on hold, so the
restaurant keeps its scripted flow until the ordering tools are written.

## How it is kept to your shop — without training anything

There is no fine-tuning here, and you do not need Python. Training changes a
model's *style*, not its *facts*, and it goes stale the moment a price does.
Production assistants are grounded instead, in four layers:

**1. Instructions** — `server/prompt.js`. The scope rules, in plain English:
what it may talk about, that it must never invent a price or a time, when to
fetch a human, and that anything the customer types is data rather than an
instruction.

**2. Context** — `server/context.js`. Your actual catalog, staff, hours and
published answers are written into every request. The model answers *from that
text*. Items you switch off in the console never reach it, so hidden really is
hidden. This is why a price change in the console is quoted correctly on the
very next message.

**3. Tools** — `server/tools.js`. Anything factual or consequential is a
function call, not prose. `check_availability` is the only source of times,
and `create_booking` refuses any slot that is not genuinely free. The model
narrates; the code decides.

**4. Guards** — `server/guard.js`. A cheap deterministic filter catches obvious
off-topic questions and prompt-injection before they cost a token, and a
sanitiser strips anything model-shaped on the way out.

When a catalog grows past a few hundred items, add embeddings and send only the
relevant slice — still no training, and still ordinary JavaScript.

## Theming

`src/themes.css`. Each brand supplies one `--tint`; the whole neutral ramp is
mixed from it, so a restaurant reads warm and a clinic reads cool without
hand-picking greys. Accents and radii are set per brand. Light and dark are both
supported everywhere.

Type is Cormorant Garamond (300/400/500) for display — headings, dashboard
numerals, watermarks, brand names — exposed as `.font-display` in `index.css`
with a `'Times New Roman', serif` fallback. Inter carries the UI.

## Imagery

Hero and feature photography is referenced from Unsplash by id in
`src/lib/brands.ts` (`images`). Swap the ids, or point `photo()` in
`src/components/site/Site.tsx` at your own CDN. Catalog items use generated
artwork (`src/components/art/Motif.tsx`) derived from each item's hue, so a new
item looks intentional before anyone uploads a photograph.

## Notes

- No UI or charting dependencies — React and Vite only. Icons, charts and
  artwork are all local.
- All figures, conversations and customers are demo data (`src/lib/activity.ts`).
- The top bar is the demo chrome. Delete `.bar` from `App.tsx` before shipping.
