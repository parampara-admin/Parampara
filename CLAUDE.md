# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Next.js Rebuild

Active feature development has moved to `/workspaces/parampara-next` (Next.js 16, TypeScript, App Router). The repo is `parampara-admin/Parampara-Next`. Unless fixing a bug in the legacy site specifically, work in that directory instead. The CLAUDE.md there documents the new architecture.

## Overview

Static HTML/CSS/JS site — **no build step**. Deployed to GitHub Pages at `parampara-admin.github.io/Parampara/`. Edit files directly; changes take effect on push. There is no package.json, npm, or bundler.

## Two code patterns

### 1. `index.html` — the SPA shell

`index.html` (352 lines) is the multi-screen single-page app. It loads `parampara.css`, Supabase JS v2, D3 v7, and Leaflet from CDN, then loads:

- **`parampara-data.js`** (124 lines) — creates the shared `db` Supabase client (anon key, no auth session), declares mutable globals (`profs`, `cg`, `loaded`, `prev`, `dCal`, `allBaniGurus`), defines constants (`FL` country-flag map, `INSTRUMENTS`, `SAD`, `PRA`, `MIN_ACTIVE=3`, `KM_ROUTE_COLORS`, `KM_COMPOSERS`), and stat-counting async functions (`cntGuru`, `cntShishya`, `cntRole`, `cntKala`, `cntVadya`, `cntComp`, `cntEnt`).
- **`parampara-ui.js`** (1686 lines) — all UI logic: screen switching (`showSc(id)` toggles `.sc → .sc.active → .sc.active.visible`), Living Bridges, Stats, Instrument/Geography grids, Bani Gurus, Master Lineage D3 tree, Lineage drawer, Kshetra Leaflet map, pilgrimage routes, pilgrim planner.

#### SPA screen IDs (toggled by `showSc(id)`)

| ID | Screen |
|---|---|
| `#sl` | Landing — shown on page load |
| `#ss` | Stats/Explore — loaded lazily on first visit via `loadStats()` |
| `#slin` | Lineage drawer — D3 tree centred on a selected artist |

Inside `#ss`, tabs switch `view-panel` elements via `switchView(name, btn)`:

| ID | Panel |
|---|---|
| `#view-overview` | Category tile grids (SAD + PRA arrays) |
| `#view-instruments` | Instrument breakdown |
| `#view-geography` | Country breakdown |
| `#view-lineages` | Bani Guru cards |

LIVING BRIDGES and KSHETRA KRITI MAP navigate externally to `bridges.html` and `kshetra.html`.

#### Key function: `openLin(name, role, country)`

Navigates to `#slin` and builds the D3 lineage tree. **Looks up artists by `full_name`, not by ID.** Called from drill-down table rows, Bani Guru cards, and Living Bridges cards. When adding any new list that should open the lineage drawer, call `openLin(fullName, role, country)`.

#### Category tile arrays: `SAD` and `PRA`

Defined in `parampara-data.js`. Each entry is `{ k, l, e, ic, q, dr }` where `q` is an async count function. Tiles with count < `MIN_ACTIVE` (3) render as "Coming soon" and are non-clickable. All `PRA` (Pratisthana path) tiles currently show "Coming soon" because entity counts are below the threshold.

### 2. Standalone pages

`artist.html`, `bridges.html`, `kshetra.html`, `lineage.html` each embed their own self-contained `<script>` block with a fresh Supabase client. They load only the CDN libraries they need (D3 for artist, Leaflet for kshetra). These pages **duplicate** some logic from `parampara-ui.js` — when fixing a bug, check both.

`artist.html` takes an `?id=<profile_id>` query parameter and renders a D3 lineage tree centred on that artist: ancestors above (recursively up to 4 levels), shishyas below. Clicking a node opens a modal with **VIEW FULL PAGE** (routes back to `artist.html?id=...`) and **CLOSE**. If `?id` is absent the page shows an empty state.

`auth.html`, `covenant.html`, `home.html` each embed their own scripts with no shared JS files.

#### `profile.html` — standalone profile wizard

`profile.html` (1115 lines) is a **standalone 7-step wizard**, not a SPA. It uses **Crimson Text** as the primary font and its own CSS variable set (`--gold`, `--gold-light`, `--bg`, `--card`, `--input-bg`, `--border`, `--border-active`) — **distinct from `parampara.css`**. Steps are `div.step` elements toggled by adding/removing `active`. Step IDs: `#step-1` through `#step-7`, plus `#step-review` and `#step-view`. `#step-view` is the read-only profile display mode.

#### Navigation flow

```
auth.html → covenant.html → home.html
home.html → index.html          (Statistics / explore)
home.html → lineage.html        (Lineage table)
home.html → bridges.html        (Living Bridges)
home.html → kshetra.html        (Kshetra-Kriti Map)
home.html → profile.html        (My Profile wizard)
lineage.html → artist.html?id=  (Artist page)
index.html  → artist.html?id=   (via goToArtist())
```

## Supabase

Both code patterns use the same project (`enxhnemcgbicfxzrfveh.supabase.co`) and anon key. The `db` client in `parampara-data.js` and the inline clients in standalone pages all query as anon (no auth session attached). Auth sessions live only in `auth.html`'s separate client.

### Tables used

| Table | Key columns | Notes |
|---|---|---|
| `profiles` | `id`, `auth_id`, `full_name`, `primary_role`, `current_country`, `instrument_aliases` (JSONB array), `is_deceased`, `covenant_accepted`, `instrument_maker` | `instrument_aliases` comes back as a JS array from Supabase — handle both array and JSON string forms |
| `guru_shishya_lineage` | `guru_id`, `shishya_id`, `discipline`, `handshake_status` | `discipline='Heritage'` = inherited/indirect lineage; direct training relationships may also use `'Heritage'` — do **not** assume neq Heritage excludes only ceremonial ties |
| `badges` | `id`, `code` | Look up by `code='living_bridge'` to get the badge ID |
| `profile_badges` | `profile_id`, `badge_id` | Join to find badge holders |
| `entities` | `id`, `category` | Used for stats counting |
| `kshetras`, `compositions`, `composition_kshetra`, `pilgrimage_routes` | various | Used by kshetra map only |

## CSS design tokens

Defined as CSS custom properties on `:root` in `parampara.css` and inlined in standalone pages:

| Variable | Value | Usage |
|---|---|---|
| `--iv` | `#F2EBD9` | Ivory page background |
| `--ivm` | `#EAE0C8` | Muted ivory |
| `--g` | `#7A5C10` | Gold — primary text, borders, buttons |
| `--gl` | `#C4A044` | Gold light — accents, icons |
| `--gb` | `#D4AD48` | Gold bright — gradients |
| `--br` | `#2E1F04` | Deep brown — headings |
| `--brm` | `#4A3010` | Mid brown |
| `--txl` | `#8A7040` | Light text, labels |
| `--tl` | `#2A6060` | Teal — shishya/secondary links |
| `--bo` | `rgba(122,92,16,0.15)` | Default border |
| `--bom` | `rgba(122,92,16,0.30)` | Medium border |

## Typography

Three Google Fonts loaded in all pages except `profile.html`:
- **Cinzel** — all-caps labels, nav, buttons (always paired with `letter-spacing`)
- **Cormorant Garamond** — display headings, large italic text
- **EB Garamond** — body text, italic copy

`profile.html` uses **Crimson Text** instead and its own CSS variable set — do not apply `parampara.css` variables there.

## Key patterns and gotchas

- **`instrument_aliases` parsing** — Supabase returns JSONB as a JS array, but older rows may be stored as a JSON string. Always guard: `if (typeof a === 'string') { try { a = JSON.parse(a); } catch {} }`.
- **Living Bridge badge** — `parampara-ui.js` looks up the badge dynamically via `badges.code='living_bridge'`. `bridges.html` hardcodes the badge UUID. Both point to the same record.
- **Historical gurus** — classified by `is_deceased: true` on the guru's profile, not by discipline value. The `.neq('discipline','Heritage')` filter in some versions of the bridges code excludes all lineage rows for most artists — remove it.
- **`overflow: hidden` on card elements** — in CSS grid with default `align-items: stretch`, this clips card body content when cards in the same row have different heights. Use `align-self: start` on cards instead.
- **Duplicate feature code** — Living Bridges, Kshetra map, and Lineage tree each appear in both a standalone `.html` file and inside `parampara-ui.js`. Fixes must be applied to both copies.
- **Duplicate `cntKala` in `parampara-data.js`** — there are two functions named `cntKala` (lines 87 and 91). The second silently overrides the first. The live version counts non-deceased Vocalists and Instrumentalists. Do not add a third.
- **No RLS session on data queries** — the shared `db` client queries as anon. Authenticated users in the Next.js rebuild (`/workspaces/parampara-next`) attach a session, which can cause different RLS results for the same query.
- **`openLin` uses name, not ID** — the lineage drawer looks up profiles by `full_name`. If an artist has a duplicate name, the wrong record may be shown. `artist.html?id=` is more reliable for deep-linking to a specific artist.
