# ADR — Separate timer semantics from presentation

## Status

Accepted

## Context

TFDSpeedrun contains several layers that work together to present a speedrun timer:

- the Run Engine tracks runtime state such as start, split, pause, resume, undo, skip, reset and finish;
- the Comparison Engine determines comparison meaning such as ahead, behind, gaining, losing, even and best segment;
- the website timer, OBS overlay and Appearance Preview all need to render those states consistently.

Without a clear boundary, visual decisions such as colors, gradients, text shadow, backgrounds or OBS-specific behavior could leak into timer or comparison logic. That would make the timer harder to maintain and could cause the website timer, OBS overlay and Appearance Preview to behave or look differently.

The project already centralizes presentation helpers in `src/lib/appearance.ts`, including semantic color mapping, timer background styling, split background styling, text styling and Total Timer gradient styling.

## Decision

Timer runtime logic and comparison logic must expose semantic state rather than visual styling.

Presentation of that semantic state is centralized in the presentation layer and shared by the website timer, OBS overlay and Appearance Preview.

The intended flow is:

```text
Run Engine
    ↓
Comparison / semantic state
    ↓
Presentation layer
    ↓
Website Timer / OBS Overlay / Appearance Preview
```

### Run Engine responsibilities

The Run Engine is responsible for runtime facts and behavior, including:

- timer status;
- elapsed time;
- split times;
- pause and resume behavior;
- undo and skip behavior;
- reset and finish behavior;
- run validity.

It must not decide presentation details such as colors, gradients or backgrounds.

### Comparison Engine responsibilities

The Comparison Engine is responsible for semantic comparison meaning, including:

- ahead;
- behind;
- even;
- gaining;
- losing;
- best segment;
- comparison source data.

It exposes meaning, not visual styling.

For example, `ahead + gaining` is a semantic result. The Comparison Engine does not decide that this should be green.

### Presentation layer responsibilities

The presentation layer translates semantic state into visual output.

`src/lib/appearance.ts` is the shared presentation layer for timer appearance.

It is responsible for concerns such as:

- semantic colors;
- primary and secondary text colors;
- Total Timer gradients;
- text shadow;
- timer background;
- split backgrounds;
- opacity;
- font-related presentation;
- paused presentation;
- best-segment presentation.

Visual mappings such as `ahead-gaining`, `ahead-losing`, `behind-gaining`, `behind-losing`, `best-segment` and `paused` belong here.

### Shared presentation

The website timer, OBS overlay and Appearance Preview should reuse the same presentation helpers wherever possible.

The Appearance Preview must not implement a second independent interpretation of timer appearance. It should consume the same presentation layer used by the real timer.

This prevents the preview from drifting away from the actual timer.

### OBS-specific behavior

OBS uses the shared presentation layer but may have output-specific presentation options.

Chroma Key is such an option.

Chroma Key applies only to the OBS overlay and must not change the normal website timer. Native transparency remains separate from the optional chroma compatibility mode.

### Timer Layout versus Appearance

Timer Layout and Appearance remain separate concepts.

Timer Layout determines **what is visible**, for example:

- Game Profile;
- Category;
- Compare To.

Appearance determines **how visible elements are rendered**, for example:

- colors;
- backgrounds;
- typography;
- opacity;
- gradients;
- text shadow.

The Appearance Preview may combine both so users can preview the resulting timer, but the underlying responsibilities remain separate.

## Consequences

### Positive

- Timer and comparison logic remain independent from visual design.
- The website timer, OBS overlay and Appearance Preview stay visually consistent.
- Appearance changes can be made without changing timer logic.
- New semantic states can be introduced without hardcoding UI colors into the Comparison Engine.
- OBS-specific presentation features can be added without affecting the normal website timer.
- Future presentation features have a clear architectural home.

### Trade-offs

- Presentation helpers must be kept sufficiently reusable for multiple consumers.
- Some UI components need to pass semantic state and appearance settings separately.
- Features that combine layout and appearance in a preview require care not to merge those responsibilities internally.

## Future guidance

When adding a timer-related feature:

1. Determine whether it represents runtime behavior, comparison meaning, layout, or presentation.
2. Keep runtime behavior in the Run Engine.
3. Keep comparison meaning in the Comparison Engine.
4. Keep visual interpretation in the presentation layer.
5. Reuse the presentation layer in the website timer, OBS overlay and Appearance Preview.
6. Keep output-specific behavior, such as OBS Chroma Key, explicitly scoped to that output.

Visual decisions should not leak back into timing or comparison logic.
