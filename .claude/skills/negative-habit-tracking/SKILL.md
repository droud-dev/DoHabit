---
name: Negative Habit Tracking
description: Implementing inverted (reduction-goal) habit tracking — ceiling-based slip counting, render-layer inversion, and days-since-failure streak calculation
topics: habit-tracking, negative-habits, reduction-goals, render-inversion, streak-calculation, react, optional-fields
created: 2026-03-22
updated: 2026-03-22
scratchpad: .specs/scratchpad/d52f3356.md
---

# Negative Habit Tracking

## Overview

Negative habits track things the user wants to *limit or stop* (e.g. smoking, doom-scrolling). Each button tap logs a slip. `frequency` becomes the daily ceiling — staying under it is success; hitting it is failure. The inversion is handled entirely at the render layer; `checkHabitCompletion` and `updateHabitProgress` are unchanged. A new utility `getNegativeStreak` replaces `getStreaks` for these habits.

---

## Key Concepts

- **Ceiling semantics**: `progress >= frequency` still means `isCompleted = true`. For negative habits this means "ceiling hit = failure day". No change to `checkHabitCompletion`.
- **Render-layer inversion**: `showAsCompleted = isNegative ? !isCompleted : isCompleted`. Applied in Month.jsx and CompactCalendar.jsx. `isFrozen` still takes precedence.
- **Slip streak**: Streak = calendar days elapsed since the most recent ceiling-hit entry in `completedDays`. If never failed: days since `creationDate`.
- **Optional field pattern**: `isNegative?: boolean` — `undefined` = regular habit. No migration needed.
- **Prop chain**: `isNegative` flows automatically via spreads through HabitList → Habit → HabitHeader/HabitMenu. Must be explicitly added to the locally-constructed `calendarProps` object in Habit.jsx.

---

## Documentation & References

| Resource | Description | Link |
|----------|-------------|------|
| Design document | Authoritative spec for this feature | `.specs/plans/negative-habit-tracking.design.md` |
| checkHabitCompletion | Unchanged rolling window / daily completion check | `src/utils/checkHabitCompletion.js` |
| updateHabitProgress | Unchanged tap handler (works for negative by coincidence) | `src/utils/updateHabitProgress.js` |
| getStreaks | NOT used for negative habits — bypassed | `src/utils/getStreaks.js` |
| habitsReducer | Where newHabit is constructed; isProgressive is the boolean field pattern | `src/utils/habitsReducer.js` |
| ProgressiveBlock | Reference pattern: checkbox + hidden input + String() serialization | `src/components/HabitEditor/ProgressiveBlock.jsx` |

---

## Files Changed

| File | Change Type | Summary |
|------|-------------|---------|
| `src/utils/getNegativeStreak.js` | New | Days-since-last-failure utility |
| `src/components/Habit/Habit.jsx` | Modify | Add isNegative to calendarProps; conditional streak call |
| `src/components/Habit/HabitHeader.jsx` | Modify | isNegative prop; FaTimes at 100% |
| `src/components/Habit/Month.jsx` | Modify | isNegative prop; showAsCompleted logic |
| `src/components/Habit/CompactCalendar.jsx` | Modify | isNegative prop; showAsCompleted logic |
| `src/components/HabitEditor/IconBlock.jsx` | Modify | isNegative checkbox + hidden input + info text |
| `src/components/HabitEditor/HabitEditor.jsx` | Modify | Pass currentIsNegative to IconBlock |
| `src/utils/habitsReducer.js` | Modify | Add isNegative to newHabit |
| `src/components/Habit/Calendar.jsx` | No change | Uses `{...props}` spread to Month — isNegative flows through |
| `src/components/HabitList.jsx` | No change | Uses `{...h}` spread to Habit — isNegative flows through |

---

## Prop Chain Map

```
HabitList: {...h} spread → Habit gets isNegative automatically
  Habit → HabitHeader: {...props, colorPalette} → automatic
  Habit → HabitMenu: {...props} → automatic (no HabitMenu changes needed)
  Habit → calendarProps (local object): MUST add isNegative explicitly
    → CompactCalendar: add to destructure
    → Calendar: {...props} spread → Month gets it
      → Month: add to destructure + apply showAsCompleted
```

---

## Patterns & Best Practices

### Pattern 1: Render-Layer Inversion

**When to use**: Flipping success/failure semantics without touching data/calculation layer.

**Trade-offs**: Clean separation of data and presentation. Calculation layer stays testable and unchanged. Risk: must apply inversion consistently in ALL rendering paths (Month AND CompactCalendar).

**Example**:
```javascript
// In Month.jsx and CompactCalendar.jsx
// Compute showAsCompleted before the day rendering
const showAsCompleted = isNegative ? !isCompleted : isCompleted;

// Then in style:
backgroundColor: isFrozen ? softenedColor : showAsCompleted ? baseColor : darkenedColor
```

### Pattern 2: Days-Since-Last-Failure Streak

**When to use**: Tracking abstinence streaks for negative/reduction habits.

**Trade-offs**: Simpler than rolling-window streak; no consecutive-day logic needed. Works correctly with newest-first `completedDays` array.

**Example**:
```javascript
// src/utils/getNegativeStreak.js
import getFormattedDate from './getFormattedDate';

function getNegativeStreak(completedDays, frequency, creationDate) {
    // completedDays is sorted newest-first — .find() returns most recent failure
    const lastFailure = completedDays.find((d) => d.progress >= frequency);

    const today = new Date(getFormattedDate(new Date()));

    if (!lastFailure) {
        // Never hit ceiling — streak from creation date
        const created = new Date(getFormattedDate(new Date(creationDate)));
        return Math.round((today - created) / (24 * 60 * 60 * 1000));
    }

    const failDate = new Date(lastFailure.date);
    return Math.round((today - failDate) / (24 * 60 * 60 * 1000));
    // 0 = ceiling hit today, 1 = yesterday, etc.
}

export default getNegativeStreak;
```

### Pattern 3: Conditional Streak Dispatch in Habit.jsx

**When to use**: Habit component needs different streak logic per habit type.

**Trade-offs**: One branch per habit type. Keep each case in its own utility.

**Example**:
```javascript
// In Habit.jsx — replace the single getStreaks call
import getNegativeStreak from '../../utils/getNegativeStreak';

// Inside Habit(), destructure isNegative and creationDate from props:
const { currentStreak } = isNegative
    ? { currentStreak: getNegativeStreak(completedDays, frequency, creationDate) }
    : getStreaks(completedDays, frequency, periodDays);
```

### Pattern 4: Optional Boolean Field via Hidden Input

**When to use**: Adding a new boolean editor field using the existing form-data pattern (mirrors ProgressiveBlock).

**Trade-offs**: Consistent with existing editor pattern. HabitEditor reads all fields from `e.target` (the form DOM element) via `data.fieldName.value`.

**Example**:
```javascript
// In IconBlock.jsx — add state and hidden input
const [isNegative, setIsNegative] = useState(currentIsNegative || false);

// Checkbox:
<input
    type="checkbox"
    id="isNegativeToggle"
    checked={isNegative}
    onChange={() => setIsNegative((prev) => !prev)}
/>
<label htmlFor="isNegativeToggle">
    Reduction habit (limit/stop)
</label>
<small>
    This habit is successful when NOT tracked — each tap logs a slip against your daily limit.
</small>

// Hidden input at end of component:
<input type="hidden" name="isNegative" value={String(isNegative)} />
```

```javascript
// In HabitEditor.jsx — pass prop to IconBlock:
<IconBlock
    {...{ habits, currentIconTitle: habit?.iconTitle, currentIsNegative: habit?.isNegative }}
/>
```

```javascript
// In habitsReducer.js newHabit object — mirrors isProgressive pattern:
isNegative: data.isNegative?.value === 'true',
```

### Pattern 5: HabitHeader Icon Swap at 100%

**When to use**: Different icon for completion vs ceiling-hit.

**Example**:
```jsx
// In HabitHeader.jsx — add FaTimes import and isNegative to destructure
import { FaCheck } from "react-icons/fa";
import { FaTimes } from "react-icons/fa";

// Replace the icon section:
{progressPercentage === 100
    ? (isNegative ? <FaTimes /> : <FaCheck />)
    : <strong>{progressPercentage}%</strong>}
```

---

## Known Limitations (Out of Scope for v1)

| Area | Issue | Fix Approach |
|------|-------|-------------|
| **Achievements** | `achievementsReducer` calls `getStreaks` on all habits — counts consecutive slip days for negative. | Filter: `habits.filter(h => !h.isNegative)` in streak achievement cases (0–5, 11, 13, 15). Separate task. |
| **Statistics — Total Completed** | Shows slip days, not clean days. Labels semantically wrong. | Conditionally relabel or invert count. Deferred. |
| **Statistics — Longest Streak** | Uses `getStreaks` — wrong for negative habits. | Adapt `getNegativeStreak` for historical data. Deferred. |
| **HabitMenu labels** | "Do [date]" = log a slip — semantically accurate enough for v1. | No change needed; acceptable. |

---

## Common Pitfalls & Solutions

| Issue | Impact | Solution |
|-------|--------|----------|
| Forgetting to add isNegative to calendarProps in Habit.jsx | High — Month/CompactCalendar never see it | Calendar uses `{...props}` spread but calendarProps is a local object; must add explicitly |
| Applying showAsCompleted to text color too | Low — Design omits this; don't over-invert | Only apply to backgroundColor; leave `color:` line unchanged |
| Using `.find()` on ascending-sorted array | High — returns oldest failure, not most recent | completedDays is newest-first; `.find()` correctly returns most recent failure |
| creationDate type mismatch | Low | `new Date(creationDate)` handles both Date objects and ISO strings |
| Forgetting FaTimes import in HabitHeader | Medium — runtime error | Add `import { FaTimes } from "react-icons/fa"` |
| Not passing currentIsNegative to IconBlock from HabitEditor | Medium — always starts unchecked in edit mode | Add `currentIsNegative: habit?.isNegative` to IconBlock props in HabitEditor |

---

## Recommendations

1. **Do not touch checkHabitCompletion or updateHabitProgress**: They work correctly for negative habits as-is. The inversion is purely cosmetic.

2. **Apply showAsCompleted consistently in both calendar components**: Month.jsx and CompactCalendar.jsx both need the same change. Missing one breaks the compact/full toggle.

3. **Use Math.round for the streak day calculation**: Avoids off-by-one from sub-millisecond Date arithmetic differences.

4. **Follow the ProgressiveBlock hidden-input pattern exactly**: `String(isNegative)` → hidden input → reducer reads `.value === 'true'`. Already established convention in this codebase.

5. **File known limitations in the task issue tracker**: Achievements and Statistics bugs are real but well-contained. Tag them as a follow-up; don't try to fix in this PR.

---

## Sources & Verification

| Source | Type | Last Verified |
|--------|------|---------------|
| `.specs/plans/negative-habit-tracking.design.md` | Design document (authoritative) | 2026-03-22 |
| `src/utils/habitsReducer.js` | Codebase | 2026-03-22 |
| `src/components/Habit/Habit.jsx` | Codebase | 2026-03-22 |
| `src/components/Habit/HabitHeader.jsx` | Codebase | 2026-03-22 |
| `src/components/Habit/Month.jsx` | Codebase | 2026-03-22 |
| `src/components/Habit/CompactCalendar.jsx` | Codebase | 2026-03-22 |
| `src/components/Habit/Calendar.jsx` | Codebase | 2026-03-22 |
| `src/components/HabitList.jsx` | Codebase | 2026-03-22 |
| `src/components/Habit/HabitMenu.jsx` | Codebase | 2026-03-22 |
| `src/components/HabitEditor/IconBlock.jsx` | Codebase | 2026-03-22 |
| `src/components/HabitEditor/ProgressiveBlock.jsx` | Codebase | 2026-03-22 |
| `src/components/HabitEditor/HabitEditor.jsx` | Codebase | 2026-03-22 |
| `src/utils/getStreaks.js` | Codebase | 2026-03-22 |
| `src/utils/checkHabitCompletion.js` | Codebase | 2026-03-22 |
| `src/utils/updateHabitProgress.js` | Codebase | 2026-03-22 |

---

## Changelog

| Date | Changes |
|------|---------|
| 2026-03-22 | Initial creation for task: implement-negative-habit-tracking.feature |
