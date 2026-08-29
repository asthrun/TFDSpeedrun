# Speedrun Timing Dashboard — Project Spec

## Overview
A standalone web app for logging speedrun timing, designed to be captured cleanly
via OBS Browser Source. Users have real accounts; all data is stored server-side,
private by default, and protected against unauthorized edits.

## Suggested Stack
- **Frontend**: Next.js (React)
- **Auth + Database**: Supabase (Postgres + built-in auth, Row Level Security
  enforced at the database level so users can only read/write their own data)
- **Hosting**: Vercel

## Suggested Data Model
- `users` — handled by Supabase Auth
- `game_profiles` — id, user_id, name (e.g. "Karel's Mothership Conquest")
- `categories` — id, game_profile_id, name (e.g. "Onslaught 4"), target_time_ms
  (custom compare-to / world-record time for this category)
- `sections` — id, category_id, name, order (fixed, not user-reorderable)
- `runs` — id, category_id, user_id, started_at, completed_at, is_valid
- `run_splits` — run_id, section_id, time_ms
- `share_sessions` — id, user_id, category_id, token (unguessable), created_at,
  expires_at, closed_at (auto-closes 15 min after the last recorded split;
  grants write access to exactly one other registered user)

Analytics (Best of, Sum of Best, deltas) should be derived client-side or via
queries from `run_splits` — not stored as precomputed values.

---

## Feature List

### Timer & Sections
- [MVP] Start/Stop/Split/Reset timer, keyboard shortcut for split
  - [MVP] Configurable keyboard shortcuts for timer actions, allow empty field
  - [MVP] Keyboard shortcuts are empty by default
  - [MVP] Start/Stop/Split/Reset/Undo also appear as on-screen buttons
  - [MVP] Start always starts a new run; accidental starts are recoverable via Undo
- [MVP] User can rename sections — per-user, saved to account
- [MVP] Run validity: valid only when all sections have a time; invalid if reset
  or stopped early by the user, or if not all sections have a time
- [MVP] Keyboard shortcut for "next section" (for recovering from a missed split)
- [MVP] Timer format: mm:ss.SSS
- [MVP] User can create a new game profile with its own sections (distinct
  speedrun categories/game modes, e.g. "Karel's Mothership Conquest" vs
  "Onslaught 4")
- [MVP] Section order is fixed once created — no reordering (run order like
  A → B → C should not be rearrangeable)
- [MVP] Undo button/shortcut for accidental reset or split
- [MVP] Delete a run or a game profile
- [MVP] Custom "compare to time" (e.g. world record / target time) — saved per
  category within a game profile
- [MVP] Compare current section against previous personal best OR the custom
  target time
- [Later] Pause/resume (for cutscenes or other significant non-gameplay time)
- [Later] Sound effects on world record / personal best

### Analytics (toggleable)
- [MVP] Checkbox: "Best of" per section — per-run-layout, on/off state saved
  per user
- [MVP] Checkbox: "Sum of Best" (sum of best sections across all recorded,
  valid runs)
  - [Later] Include best sections from invalid runs that aren't significant
    outliers
- [MVP] Checkbox: delta between current section and previous personal best of
  the same section
  - [MVP] Color coding: green = improvement, red = worse, gold = best recorded
  - [Later] Light red for a worse time that's close to a green time
- [MVP] Checkbox: delta between sections within the same run
- [MVP] Run history / list view — browse past runs, read-only

### Appearance / OBS
- [MVP] Chromakey background color picker (hex input) — per-user setting
- [MVP] Transparent background mode for OBS Browser Source
- [MVP] Font size scale for readability at stream resolution
- [MVP] Font selection
- [MVP] Timer state must survive an accidental browser refresh/reload
- [Later] Colorblind mode
- [Later] Corner style (rounded/straight), border on/off, drop shadow on/off
- [Later] Transparency control for the analytics background panel

### Account & Data
- [MVP] Sign up / log in / log out
- [MVP] Forgot password / reset password / magic link
- [MVP] All splits and settings tied to the logged-in user, private by default
- [MVP] Export all splits and related data to .csv
- [MVP] "Referee" sharing via session-scoped write-access token:
  - User explicitly starts a "session" (separate from run start/stop)
  - Generates an unguessable, session-specific token
  - Token can be shared with exactly one other **registered** user, granting
    them write access to enter times
  - Token closes when the user explicitly ends the session, or automatically
    after 15 minutes with no recorded splits
- [MVP] No read-only/viewer-only public access token — not needed (OBS capture
  uses the runner's own logged-in dashboard)
- [Later] Import .csv and saved settings

---

## Security Notes for Implementation
- Enforce data access with Postgres Row Level Security, not just frontend
  checks — a user's rows should be unreadable/unwritable by anyone else at the
  database level.
- Share-session tokens must be cryptographically random (unguessable) and
  scoped to a single category/session, not a general-purpose account credential.
- Rate-limit login attempts given password + magic-link auth is offered.
