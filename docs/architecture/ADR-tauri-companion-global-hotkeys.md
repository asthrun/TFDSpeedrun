# ADR — Tauri Companion for Global Hotkeys

**Status:** Accepted  
**Date:** 2026-09-02  
**Decision area:** Desktop companion / global hotkeys / local integration

## Context

TFDSpeedrun is primarily a web application. A normal browser page cannot reliably receive keyboard input while another application, such as a game, has focus. This prevents website-only global hotkeys from being used for timer actions such as Split, Pause, Undo Split, Skip Split and Reset.

Global hotkeys are important for a speedrun timer, but asking users to install a desktop component creates an additional security and trust responsibility. The companion must not behave like a keylogger, must not unnecessarily access account data, and must not create uncontrolled network or background activity.

The companion should also behave predictably when the TFDSpeedrun website is closed, the local connection is lost, or the companion itself is exited.

## Decision

TFDSpeedrun will use a small **Tauri Companion** as the preferred architecture for future global hotkey support.

The companion is a passive, local input bridge. It does not own timer state and does not perform TFDSpeedrun business logic. The website and existing Run Engine remain the source of truth.

```text
Keyboard
   ↓
Tauri Companion
   ↓
Local authenticated connection
   ↓
TFDSpeedrun Web App
   ↓
Run Engine
   ↓
Comparison Engine
   ↓
Presentation
```

The companion only reports an allowed timer command. The Run Engine decides whether that command is valid in the current timer state.

## Security principles

### 1. Passive by default

The companion does not contact TFDSpeedrun servers, Supabase or the website on its own.

The website initiates the local connection to the companion.

When no valid local TFDSpeedrun connection exists, the companion has no effect on the timer.

### 2. No keylogging

The companion must not capture, record, store or transmit arbitrary keyboard input.

Where supported, only explicitly configured global hotkeys are registered with the operating system.

The implementation should avoid generic low-level keyboard hooks unless there is no viable alternative.

### 3. Whitelisted commands only

The companion exposes only a small, fixed set of timer commands:

```text
start_split
pause_resume
undo_split
skip_split
reset
```

The companion must not expose generic code execution, shell commands, arbitrary URL opening, filesystem access or arbitrary database/network operations to the web application.

### 4. No account secrets

The companion does not store or require Supabase passwords, Supabase secret/service keys, browser cookies, permanent authentication tokens or TFDSpeedrun account credentials.

Account authentication remains in the web application.

### 5. Local communication only

Communication between the website and companion is local to the user's computer, for example through a local WebSocket endpoint.

`localhost` alone is not considered sufficient authentication. The local protocol must include an explicit trust/pairing or session mechanism so unrelated websites cannot control or impersonate TFDSpeedrun.

### 6. Companion does not own timer state

A hotkey press is an input event, not an instruction to mutate timer state directly.

```text
F1 pressed
   ↓
Companion reports "start_split"
   ↓
Run Engine checks current state
   ↓
Run Engine accepts or rejects action
```

This preserves existing timer rules regardless of whether input comes from an on-screen button or the companion.

## Connection lifecycle

The companion uses explicit states:

```text
DISCONNECTED
- no active TFDSpeedrun web connection
- timer hotkeys inactive

CONNECTED
- local TFDSpeedrun client authenticated
- communication channel available

ARMED
- timer hotkeys enabled for the active connection
- only configured hotkeys are registered/processed
```

If the website is closed or the local connection is lost:

```text
Local connection lost
        ↓
Companion becomes DISCONNECTED
        ↓
Timer hotkeys are deactivated
```

The companion must not automatically open TFDSpeedrun, attempt uncontrolled reconnect loops, or repeatedly contact the production website.

## System tray behavior

The companion normally runs as a small system-tray application.

```text
TFDSpeedrun Companion
──────────────────────
Open TFDSpeedrun
──────────────────────
Status: Connected
Hotkeys: Enabled ✓
──────────────────────
Start with Windows ✓
──────────────────────
Close Companion
```

### Open TFDSpeedrun

This action opens only the fixed official TFDSpeedrun URL in the user's default browser. It is not a generic URL launcher.

### Hotkeys: Enabled

Users can temporarily disable all global hotkeys without closing the companion.

### Start with Windows

Optional and user-controlled. Starting with Windows does not imply connecting to TFDSpeedrun or enabling timer actions.

### Close Companion

`Close Companion` means the entire companion shuts down.

```text
Disable/unregister global hotkeys
        ↓
Close local communication listener
        ↓
Stop background tasks
        ↓
Remove tray icon
        ↓
Exit process
```

The implementation should not search the operating system for every process with the same executable name and kill them.

Instead, the companion will be designed as a **single-instance application**. A second launch should detect the existing instance and exit or activate that instance.

## Windows and antivirus considerations

The companion should minimize characteristics commonly associated with suspicious background software.

Therefore:

- no administrator privileges by default;
- no kernel drivers;
- no background Windows service unless a future requirement explicitly justifies it;
- no arbitrary keyboard capture;
- no hidden persistent network activity;
- no self-modifying behavior;
- minimal filesystem permissions;
- minimal native capabilities;
- transparent tray status.

For public distribution, TFDSpeedrun should use signed release binaries so users and Windows can verify the publisher and binary integrity.

The companion should be open source where practical so its behavior can be independently inspected.

## User-facing privacy statement

The implementation must be compatible with a clear statement such as:

> TFDSpeedrun Companion only listens for the hotkeys you configure. It does not record keyboard input, store keystrokes, or send keyboard data over the internet.

This statement should only be published if it remains technically true.

## Consequences

### Positive

- Enables real global hotkeys while a game has focus.
- Preserves TFDSpeedrun as a web-first application.
- Reuses the existing Run Engine and timer semantics.
- Keeps account authentication out of the native companion.
- Keeps the security surface relatively small.
- Tauri is suitable for a lightweight tray utility while a game and OBS may also be running.
- Leaves open a future path toward a fuller Tauri desktop client.

### Negative

- Users must install an additional executable.
- Windows SmartScreen or antivirus products may initially distrust a new, low-reputation binary.
- Local browser-to-companion authentication must be designed carefully.
- Release signing, update security and distribution become additional responsibilities.
- Global hotkey conflicts with games or other applications must be handled gracefully.

## Alternatives considered

### Browser-only keyboard listeners

Rejected for global hotkeys because the browser cannot reliably receive keyboard events while another application has focus.

### Browser extension

Not preferred. Native global hotkey support would likely still require an additional native component, increasing the number of moving parts.

### Electron

Viable, especially because TFDSpeedrun already uses TypeScript/React. Tauri is preferred for the companion because the intended application is small and should use as few resources as practical while games and OBS may also be running.

### Full desktop rewrite

Rejected for now. The current web application remains the primary TFDSpeedrun client. The companion solves only the missing native capability.

## Follow-up decisions

Before implementation, define:

1. the exact local communication protocol;
2. the trust/pairing mechanism between browser and companion;
3. the initial default hotkey set;
4. conflict handling when a hotkey cannot be registered;
5. whether hotkeys are registered only while ARMED or remain registered while CONNECTED;
6. secure update and code-signing strategy for public releases;
7. the exact single-instance behavior on Windows.
