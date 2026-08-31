# ADR-004: Timer v1 Data Model

Status: Accepted  
Date: 2026-08-31

## Context

The Timer is the core feature of TFDSpeedrun. Timer v1 introduces comparison modes, custom target splits, attempt tracking, user-facing profile information, pause/resume behavior, and a larger settings model.

The existing database model was primarily designed around completed run history. Several Timer v1 concepts have different lifecycles and responsibilities and should therefore not automatically be stored as part of a run or user settings.

The data model should also preserve the existing ownership model in which user-owned records are protected through `user_id`, composite foreign keys, and Row Level Security.

## Decision

### Category-specific comparison mode

The active comparison mode is stored on `categories.compare_mode`.

Supported values are:

- `personal_best`
- `custom_target`
- `latest_run`
- `worst_run`

Comparison mode belongs to a Category rather than global user settings because the desired comparison can differ between speedrun categories.

The default is `personal_best`.

### Attempt count

Each Category stores an `attempt_count`.

An attempt starts when the user starts the Timer.

The counter:

- increments on Start;
- is not decremented by Reset;
- is not decremented by Skip Split;
- is not decremented by Undo Split;
- is not decremented when a historical run is deleted;
- increments even when incomplete runs are not saved to History.

This means attempt count is independent from the number of records in the `runs` table.

Existing categories are initially backfilled using their existing run count. This is an approximation because historical unsaved attempts cannot be reconstructed.

### Custom target splits

Custom comparison targets are stored separately in `custom_target_splits`.

Each record belongs to:

- a user;
- a Category;
- a Section.

`time_ms` represents the cumulative target split time at the end of the Section, not the duration of the individual segment.

Custom targets are not stored directly on `sections` because Sections describe the structure of a run, while target times are comparison data.

Composite foreign keys ensure that the Category, Section, and user ownership remain consistent.

### User profiles

Public user-facing profile information is stored in `user_profiles`.

Timer v1 initially supports:

- `display_name`
- `created_at`
- `updated_at`

`display_name` is optional and non-unique.

Authentication information such as email addresses remains in Supabase Auth and is not used as a public fallback. If no display name exists, the application can use a privacy-safe generic label such as `Runner`.

User profile information is kept separate from `user_settings` because profile identity and application preferences have different responsibilities.

### Pause state

Pause state is not persisted as part of run history.

Runtime Timer state may contain:

- `startedAt`
- `pausedAt`
- `totalPausedMs`
- Timer status

Elapsed time is calculated from the Timer's runtime state. Stored split times already contain the corrected elapsed Timer value.

Pause state may be persisted in the client's live-run recovery state so that a page refresh can restore a paused Timer, but pause events do not require database columns in `runs`.

### Existing user settings

Existing Timer-related fields in `user_settings` are not removed during the initial Timer v1 data-model migration.

The migration follows an additive approach:

1. add the new schema;
2. migrate existing data where possible;
3. migrate application code;
4. remove obsolete fields only after the new implementation has been deployed and tested.

This prevents the database migration from breaking the existing application before Timer v1 code is ready.

## Rationale

The model separates data by responsibility:

```text
AUTH / PROFILE
├─ auth.users
└─ user_profiles

USER PREFERENCES
└─ user_settings

RUN STRUCTURE
├─ game_profiles
├─ categories
└─ sections

COMPARISON DATA
└─ custom_target_splits

RUN HISTORY
├─ runs
└─ run_splits

This avoids turning user_settings, sections, or runs into general-purpose storage for unrelated Timer concepts.

It also gives future Timer Engine and Comparison Engine code clear ownership boundaries.

Consequences

The application must increment categories.attempt_count when a Timer attempt starts.

Comparison Engine code must load the Category's compare_mode and obtain the appropriate comparison source.

Custom Target requires separate loading and updating of custom_target_splits.

The application must migrate away from the old global user_settings.compare_mode before that field can be removed.

Pause/resume implementation remains primarily a Timer Engine concern rather than a database concern.

The generated Supabase TypeScript definitions must be regenerated whenever the live schema changes.

Deferred

The following are deliberately outside Timer v1's data-model scope:

gamepad bindings;
per-profile or per-category appearance overrides;
historical pause-event storage;
unique public user handles;
referee/share sessions;
historical comparison behavior when Category Sections are changed;
advanced OBS layout configuration.