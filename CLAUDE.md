# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Static HTML/CSS/JS site — **no build step**. Deployed to GitHub Pages at `parampara-admin.github.io/Parampara/`. Edit files directly; changes take effect on push. There is no package.json, npm, or bundler.

## Two code patterns

### 1. `profile.html` — the SPA shell

`profile.html` (1115 lines) is a multi-screen single-page app. It loads `parampara.css`, Supabase JS v2, D3 v7, and Leaflet from CDN, then loads:

- **`parampara-data.js`** — creates the shared `db` Supabase client (anon key, no auth session), defines global constants (`FL` country-flag map, `INSTRUMENTS`, `KM_ROUTE_COLORS`, `KM_COMPOSERS`), and stat-counting async functions (`cntGuru`, `cntShishya`, `cntRole`, `cntKala`, `cntVadya`, `cntComp`, `cntEnt`).
- **`parampara-ui.js`** (1686 lines) — all UI logic: screen switching (`showSc(id)` toggles `.sc → .sc.active → .sc.active.visible`), Living Bridges, Stats, Instrument/Geography grids, Bani Gurus, Master Lineage D3 tree, Lineage drawer, Kshetra Leaflet map, pilgrimage routes, pilgrim planner.

### 2. Standalone pages

`artist.html`, `bridges.html`, `kshetra.html`, `lineage.html` each embed their own self-contained `<script>` block with a fresh Supabase client. They load only the CDN libraries they need (D3 for artist, Leaflet for kshetra). These pages **duplicate** some logic from `parampara-ui.js` — when fixing a bug, check both.

`index.html`, `auth.html`, `covenant.html`, `home.html` each embed their own scripts with no shared JS files.

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

Three Google Fonts loaded in all pages:
- **Cinzel** — all-caps labels, nav, buttons (always paired with `letter-spacing`)
- **Cormorant Garamond** — display headings, large italic text
- **EB Garamond** — body text, italic copy

## Key patterns and gotchas

- **`instrument_aliases` parsing** — Supabase returns JSONB as a JS array, but older rows may be stored as a JSON string. Always guard: `if (typeof a === 'string') { try { a = JSON.parse(a); } catch {} }`.
- **Living Bridge badge** — `parampara-ui.js` looks up the badge dynamically via `badges.code='living_bridge'`. `bridges.html` hardcodes the badge UUID. Both point to the same record.
- **Historical gurus** — classified by `is_deceased: true` on the guru's profile, not by discipline value. The `.neq('discipline','Heritage')` filter in some versions of the bridges code excludes all lineage rows for most artists — remove it.
- **`overflow: hidden` on card elements** — in CSS grid with default `align-items: stretch`, this clips card body content when cards in the same row have different heights. Use `align-self: start` on cards instead.
- **Duplicate feature code** — Living Bridges, Kshetra map, and Lineage tree each appear in both a standalone `.html` file and inside `parampara-ui.js`. Fixes must be applied to both copies.
- **No RLS session on data queries** — the shared `db` client queries as anon. Authenticated users in the Next.js rebuild (`/workspaces/parampara-next`) attach a session, which can cause different RLS results for the same query.
