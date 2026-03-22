---
name: Progressive Habit Stages
description: Implementing stage-based habit progression with minimal complexity for React/Zustand apps
topics: habit-tracking, progressive-features, react, zustand, localstorage, behavioral-science
created: 2026-03-21
updated: 2026-03-21
scratchpad: .specs/scratchpad/9c397a21.md
---

# Progressive Habit Stages

## Overview

Progressive habits allow users to gradually increase habit difficulty through stages (e.g., "Read 1 page" → "Read 2 pages" → "Read 3 pages"). This skill covers implementation patterns for adding stage-based progression to habit tracking apps with minimal complexity, focusing on React/Zustand state management and localStorage persistence. Based on Atomic Habits behavioral science principles and 2026 best practices.

---

## Key Concepts

- **Progressive Stages**: Linear progression system where habit difficulty increases incrementally (stage 1 → 2 → 3)
- **Effective Frequency**: Calculated target based on current stage: `baseFrequency + (currentStage - 1) * increment`
- **Progression Modes**: Manual (button), time-based (every N days), count-based (every N completions)
- **Backward Compatibility**: Optional fields pattern - undefined stage fields = non-progressive habit
- **Atomic Habits Philosophy**: "1% better every day" with ridiculously small initial steps that compound over time

---

## Documentation & References

| Resource | Description | Link |
|----------|-------------|------|
| Atomic Habits Summary | Behavioral science foundation for progressive habits | [jamesclear.com](https://jamesclear.com/atomic-habits-summary) |
| Zustand Docs | State management library used in implementation | [zustand.docs.pmnd.rs](https://zustand.docs.pmnd.rs/) |
| React localStorage Guide | Persisting state patterns by Josh Comeau | [joshwcomeau.com](https://www.joshwcomeau.com/react/persisting-react-state-in-localstorage/) |
| PWA Update Strategies | Data migration in Progressive Web Apps | [web.dev](https://web.dev/learn/pwa/update) |

---

## Recommended Libraries & Tools

| Name | Purpose | Maturity | Notes |
|------|---------|----------|-------|
| Zustand 5.x | State management | Stable | Minimal boilerplate, hook-based, supports middleware |
| React 18.x | UI framework | Stable | Concurrent features, hooks for state |
| localStorage API | Client-side persistence | Stable | Native browser API, 5-10MB limit |

### Recommended Stack

For PWA habit trackers without backend:
- **State**: Zustand with reducer pattern for complex state updates
- **Persistence**: localStorage with JSON serialization and migration on init
- **Data Schema**: Optional fields for backward compatibility, no explicit versioning needed

---

## Patterns & Best Practices

### Pattern 1: Optional Fields for Backward Compatibility

**When to use**: Adding new features to existing data schema without breaking old data

**Trade-offs**:
- Pros: No migration script needed, graceful degradation, old data works unchanged
- Cons: Must check for undefined everywhere, slightly verbose code

**Example**:
```javascript
// Habit object with optional progressive fields
const habit = {
  title: "Read daily",
  frequency: 1,
  completedDays: [],
  // Progressive fields (optional)
  currentStage: 1,           // undefined = non-progressive
  maxStage: 5,              // undefined = unlimited
  stageIncrement: 1,        // default 1 if undefined
  progressionMode: "manual", // "manual" | "time" | "count"
  progressionValue: 7,      // days/completions between auto-progression
  lastProgression: new Date()
};

// Safe access pattern
const effectiveFreq = habit.frequency +
  ((habit.currentStage || 1) - 1) * (habit.stageIncrement || 1);
```

### Pattern 2: Zustand Reducer with Action Types

**When to use**: Complex state updates that need validation and side effects

**Trade-offs**:
- Pros: Centralized logic, easy testing, automatic localStorage sync
- Cons: More boilerplate than direct setState

**Example**:
```javascript
// In habitsReducer.js
function habitsReducer(habits, action) {
  switch (action.type) {
    case 'progressStage':
      habits = progressStage(habits, action.habitTitle);
      break;
    // ... other cases
  }
  saveToLocalStorage('habits', habits);
  return habits;
}

// Usage in component
habitsDispatch({ type: 'progressStage', habitTitle: 'Read daily' });
```

### Pattern 3: Migration on Initialization

**When to use**: Adding new fields to localStorage schema without breaking existing users

**Trade-offs**:
- Pros: Runs automatically on app load, no user action needed
- Cons: Adds initialization time (negligible for small datasets)

**Example**:
```javascript
// In initHabits.js
function initHabits() {
  let habits = getFromLocalStorage('habits', []);

  // No explicit migration needed with optional fields
  // Old habits work as-is (undefined stage fields)
  // New habits will have stage fields set

  habits = habits.map(h => {
    // Optional: add defaults if you want to force upgrade
    if (h.someOldField && !h.currentStage) {
      return { ...h, currentStage: 1 };
    }
    return h;
  });

  return habits;
}
```

---

## Similar Implementations

### Example 1: Notion Habit Tracker Templates (2026)

- **Source**: Notion Marketplace habit trackers
- **Approach**: RPG-style progression (beginner → intermediate → expert → master), visual progress bars
- **Applicability**: Stage naming and visual indicators adaptable to React components

### Example 2: Asana Habit Tracker Template

- **Source**: Asana productivity templates
- **Approach**: Stage-based workflow (define → track → review → adjust)
- **Applicability**: Workflow concept applicable but project needs simpler linear progression

### Example 3: Atomic Habits Progression Mapping

- **Source**: James Clear's methodology
- **Approach**: Four-stage progression from "ridiculously easy" to "desired level", mastery-based advancement
- **Applicability**: Direct - forms theoretical foundation for implementation

---

## Common Pitfalls & Solutions

| Issue | Impact | Solution |
|-------|--------|----------|
| Breaking existing habits with required fields | High | Use optional fields (undefined checks everywhere) |
| Complex stage definitions (arrays, custom objects) | Medium | Use simple numeric fields with linear formula |
| Missing backward compatibility | High | Test with old localStorage data before release |
| Over-engineering progression logic | Medium | Start with manual mode only, add auto later |
| No user control over progression | Medium | Always provide manual override option |
| localStorage size bloat with stage metadata | Low | Keep stage fields minimal (few bytes per habit) |
| Forgetting to recalculate effective frequency | High | Create utility function, use in all display components |

---

## Recommendations

1. **Use Simple Linear Progression**: Avoid complex stage arrays or custom definitions. Use formula: `effectiveFrequency = baseFrequency + (currentStage - 1) * increment`

2. **Make Stages Optional**: Default all stage fields to undefined. Non-progressive habits work normally without any stage logic.

3. **Phase Implementation**: Phase 1 = manual progression button. Phase 2 = auto-progression (time/count). Reduces initial complexity.

4. **Follow Atomic Habits Principles**: Start "ridiculously small" (stage 1 should feel silly not to do), increment by small amounts (typically 1), compound over time.

5. **Provide Visual Feedback**: Display current stage prominently (badge, indicator), show target for current stage, celebrate stage advancement.

---

## Implementation Guidance

### Installation

No new dependencies required for basic progressive stages. Uses existing:
```bash
# Already in project
npm install zustand@^5.0.1
npm install react@^18.3.1
```

### Configuration

Schema extension (add to habit object type):
```javascript
// Optional progressive stage fields
currentStage?: number;        // Current stage (1-based), undefined = non-progressive
maxStage?: number;           // Max stage, undefined = unlimited
stageIncrement?: number;     // How much to add per stage, default 1
progressionMode?: 'manual' | 'time' | 'count';
progressionValue?: number;   // Days or completions for auto-progression
lastProgression?: Date;      // When last progressed
```

### Integration Points

1. **State Management** (habitsStore.js): No changes needed, uses existing Zustand store
2. **Reducer** (habitsReducer.js): Add 'progressStage' action case
3. **Utilities** (new files): calculateEffectiveFrequency.js, progressStage.js, checkAutoProgression.js
4. **Components**:
   - HabitEditor: Add optional stage configuration form fields
   - HabitHeader: Display stage indicator and current target
   - HabitMenu: Add "Next Stage" action button
   - Habit: Use calculateEffectiveFrequency for all frequency calculations

---

## Code Examples

### Example 1: Calculate Effective Frequency

```javascript
// utils/calculateEffectiveFrequency.js
/**
 * Calculates effective frequency for current stage
 * Formula: baseFrequency + (currentStage - 1) * increment
 */
function calculateEffectiveFrequency(habit) {
  if (!habit.currentStage) {
    return habit.frequency; // Non-progressive habit
  }

  const stage = habit.currentStage || 1;
  const increment = habit.stageIncrement || 1;

  return habit.frequency + (stage - 1) * increment;
}

export default calculateEffectiveFrequency;
```

### Example 2: Progress to Next Stage

```javascript
// utils/progressStage.js
function progressStage(habits, habitTitle) {
  return habits.map(habit => {
    if (habit.title !== habitTitle) return habit;
    if (!habit.currentStage) return habit; // Not progressive
    if (habit.maxStage && habit.currentStage >= habit.maxStage) {
      return habit; // Already at max
    }

    return {
      ...habit,
      currentStage: habit.currentStage + 1,
      lastProgression: new Date()
    };
  });
}

export default progressStage;
```

### Example 3: Reducer Integration

```javascript
// In habitsReducer.js
import progressStage from './progressStage';

function habitsReducer(habits, action) {
  switch (action.type) {
    case 'progressStage':
      habits = progressStage(habits, action.habitTitle);
      break;

    case 'addHabit':
      const newHabit = {
        title: action.data.title.value,
        frequency: Number(action.data.frequency.value),
        completedDays: [],
        // Optional stage fields
        currentStage: action.data.enableStages ? 1 : undefined,
        maxStage: action.data.maxStage ? Number(action.data.maxStage.value) : undefined,
        stageIncrement: action.data.stageIncrement ? Number(action.data.stageIncrement.value) : 1,
        progressionMode: action.data.progressionMode?.value || 'manual',
        lastProgression: action.data.enableStages ? new Date() : undefined
      };
      habits = [newHabit, ...habits];
      break;

    // ... other cases
  }

  saveToLocalStorage('habits', habits);
  return habits;
}

export default habitsReducer;
```

### Example 4: Display Stage in UI

```javascript
// In HabitHeader.jsx
import calculateEffectiveFrequency from '../../utils/calculateEffectiveFrequency';

function HabitHeader({ habit, colorPalette }) {
  const effectiveFreq = calculateEffectiveFrequency(habit);

  return (
    <div className={styles.header}>
      <div className={styles.titleRow}>
        <h2>{habit.title}</h2>
        {habit.currentStage && (
          <span
            className={styles.stageBadge}
            style={{ backgroundColor: colorPalette.primary }}
            aria-label={`Stage ${habit.currentStage} of ${habit.maxStage || 'unlimited'}`}
          >
            Stage {habit.currentStage}
            {habit.maxStage && `/${habit.maxStage}`}
          </span>
        )}
      </div>
      {habit.currentStage && (
        <p className={styles.stageTarget}>
          Current target: {effectiveFreq} times per day
        </p>
      )}
    </div>
  );
}
```

### Example 5: Stage Editor Form

```javascript
// In HabitEditor.jsx
const [enableStages, setEnableStages] = useState(
  isEditMode ? Boolean(habit?.currentStage) : false
);

return (
  <form>
    {/* ... existing fields ... */}

    <div className={styles.block}>
      <SectionHeader>Progressive Stages (Optional)</SectionHeader>

      <label>
        <input
          type="checkbox"
          checked={enableStages}
          onChange={(e) => setEnableStages(e.target.checked)}
        />
        Enable stage-based progression
      </label>

      {enableStages && (
        <>
          <label>
            Max Stage (leave empty for unlimited)
            <input
              type="number"
              name="maxStage"
              defaultValue={habit?.maxStage || ''}
              min="1"
              placeholder="e.g., 10"
            />
          </label>

          <label>
            Increment per stage
            <input
              type="number"
              name="stageIncrement"
              defaultValue={habit?.stageIncrement || 1}
              min="1"
              required
            />
          </label>

          <label>
            Progression mode
            <select
              name="progressionMode"
              defaultValue={habit?.progressionMode || 'manual'}
            >
              <option value="manual">Manual (button click)</option>
              <option value="time">Auto (every X days)</option>
              <option value="count">Auto (every X completions)</option>
            </select>
          </label>
        </>
      )}
    </div>
  </form>
);
```

### Example 6: Auto-Progression Check

```javascript
// utils/checkAutoProgression.js
/**
 * Checks if habit should auto-progress
 * Call this in updateHabitProgress or on app init
 */
function checkAutoProgression(habit) {
  if (!habit.currentStage || habit.progressionMode === 'manual') {
    return false;
  }

  if (habit.maxStage && habit.currentStage >= habit.maxStage) {
    return false; // Already at max
  }

  if (habit.progressionMode === 'time') {
    const daysSince = getDaysBetween(
      new Date(habit.lastProgression),
      new Date()
    );
    return daysSince >= (habit.progressionValue || 7);
  }

  if (habit.progressionMode === 'count') {
    const completionsSince = habit.completedDays.filter(
      day => new Date(day.date) > new Date(habit.lastProgression)
    ).length;
    return completionsSince >= (habit.progressionValue || 7);
  }

  return false;
}

function getDaysBetween(date1, date2) {
  const diffTime = Math.abs(date2 - date1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export default checkAutoProgression;
```

---

## Sources & Verification

| Source | Type | Last Verified |
|--------|------|---------------|
| [Atomic Habits Summary](https://jamesclear.com/atomic-habits-summary) | Official | 2026-03-21 |
| [Zustand Docs](https://zustand.docs.pmnd.rs/) | Official | 2026-03-21 |
| [React localStorage - Josh Comeau](https://www.joshwcomeau.com/react/persisting-react-state-in-localstorage/) | Tutorial | 2026-03-21 |
| [PWA Update Strategies](https://web.dev/learn/pwa/update) | Official | 2026-03-21 |
| [Habit Tracker Apps 2026](https://reclaim.ai/blog/habit-tracker-apps) | Industry | 2026-03-21 |
| DoHabit Codebase | Project | 2026-03-21 |

---

## Changelog

| Date | Changes |
|------|---------|
| 2026-03-21 | Initial creation for task: implement-progressive-habits.feature |
