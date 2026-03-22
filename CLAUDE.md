# DoHabit

PWA habit tracker. React 18, no backend, all data in localStorage. Deployed to CloudFlare Pages.

## Stack

- **Framework**: React 18 (Create React App)
- **State**: Zustand 5 — dispatch pattern via `habitsReducer`
- **Routing**: React Router — `/modal/*` routes for overlay views
- **Animation**: Framer Motion
- **Icons**: react-icons (md, fa, fa6, io)
- **CSS**: CSS Modules — all stylesheets in `src/css/`, NOT co-located with components

## File Layout

```
src/
  components/   # React components (subdirs per feature)
  css/          # All CSS modules (HabitMenu.module.css, etc.)
  db/           # Static data (achievements, icons, modal routes)
  hooks/        # Custom hooks
  stores/       # Zustand stores (one per domain)
  utils/        # Pure functions, one per file (reducers, calculations, init)
```

## State Pattern

All habit mutations go through the dispatcher:

```js
habitsDispatch({ type: 'progressStage', habitTitle: title });
// → habitsReducer → utility fn → saveToLocalStorage
```

To add an action: create util in `src/utils/`, import and add case in `habitsReducer.js`.

## Habit Data Model

```js
{
  title: string,           // Primary key (used as ID — changes are destructive)
  frequency: number,       // Target completions per periodDays (1–6)
  periodDays: number,      // Rolling window in days (default 1 = daily)
  completedDays: [{ date: 'YYYY-MM-DD', progress: number }],
  colorIndex: number,
  icon: string,

  // Progressive stages (optional — undefined means non-progressive):
  isProgressive: boolean,
  currentStage: number,    // 0-indexed
  stages: string[],        // Stage labels array
  progressionMode: 'manual' | 'time' | 'count',
  progressionValue: number,
  lastProgression: string, // 'YYYY-MM-DD'
}
```

## Code Style

- **Indentation**: tabs, not spaces (enforced by the original repo author)
- **Mobile-first**: the app is a PWA designed for mobile. Large-screen adaptation is intentionally minimal — don't add desktop-oriented layouts or assume wide viewports.
- **Components**: `function` keyword only — no arrow function components. Destructure props in the signature.
- **File extensions**: `.jsx` for components, `.js` for everything else.
- **Naming**: PascalCase for components and CSS modules; `use` prefix for hooks; `Store` suffix for Zustand stores; camelCase for utils.
- **Import grouping**: use section comments in this order: `// react`, `// router`, `// framer`, `// stores`, `// components`, `// utils`, `// icons`

## Known Bugs

- **`useIsInitialRender`** returns `isFirstRender.current` (a boolean), but its only consumer (`useAchievementsCheck`) accesses `.current` on that value — always `undefined`. The hook should return the ref object, not `ref.current`.

## Key Conventions

- **Backward compat**: new fields are optional. `undefined` = legacy behavior. No migration scripts.
- **Dates**: always `'YYYY-MM-DD'` strings. Never store Date objects or timestamps.
- **Title as ID**: habits keyed by title. Title changes require delete + recreate.
- **`frequency` is per `periodDays`**: never assume daily-only. Use `periodDays || 1` as default.
- **`colorPalette`**: most habit components receive `{ darkenedColor, ... }` for theming via `getColorPalette(colorIndex)`.

## Active Work

- **Flexible frequency** (`periodDays`): rolling window logic in utils, FrequencyBlock dual-control UI — implemented
- **Progressive habits**: `progressStage` in reducer + HabitMenu "Next Stage" button — done. HabitEditor stage config UI — pending

## Commands

```bash
npm start                 # dev server
npm test                  # jest
npx react-scripts build   # production build
```
