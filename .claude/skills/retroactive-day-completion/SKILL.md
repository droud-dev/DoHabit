---
name: Retroactive Day Completion
description: Implementing clickable calendar cells that retroactively mark/unmark arbitrary past days in React habit tracking apps
topics: habit-tracking, calendar-interaction, retroactive-completion, react-state, reducer-pattern, date-handling
created: 2026-03-22
updated: 2026-03-22
scratchpad: .specs/scratchpad/68641265.md
---

# Retroactive Day Completion

## Overview

This skill covers replacing a hardcoded "Do yesterday" button with a flexible retroactive completion system. Users click any past calendar cell to select a date, then use the habit menu to toggle completion for that specific date. The pattern requires coordinating state across Habit → Calendar → Month (cell click) and Habit → HabitMenu (selected date display and dispatch).

---

## Key Concepts

- **selectedDate state**: Held in `Habit.jsx`, defaulting to `yesterday`. Drives the menu button label and dispatch payload.
- **Cell click guard**: Only real (non-padding) cells on non-future dates are interactive. Requires `e.stopPropagation()` to prevent the parent Habit `onClick` from also firing.
- **Sorted insertion**: `completedDays` is sorted newest-first. New entries are inserted using `findIndex(d => d.date < dateString)`, then `splice` at that index (or `push` if none found).
- **Achievement flag preservation**: `entryFlags: { isCompYdayBtnUsed: true }` is included only when `selectedDate` equals `yesterday`. The new utility accepts `entryFlags` as an optional param; callers decide when to set it.
- **Dynamic button label**: "Do/Undo" prefix + "today" / "yesterday" / locale date string based on `selectedDate` comparison.
- **Reset on close**: When the menu closes (`onShowMenu(-1)`), `selectedDate` resets to `yesterday` in `Habit.jsx` before the call propagates up.

---

## Documentation & References

| Resource | Description | Link |
|----------|-------------|------|
| Design document | Authoritative spec for this feature | `.specs/plans/retroactive-day-completion.design.md` |
| checkHabitCompletion | Rolling window / daily completion check | `src/utils/checkHabitCompletion.js` |
| toggleCompleteYeserday | Old utility being superseded | `src/utils/toggleCompleteYeserday.js` |
| habitsReducer | Reducer that orchestrates all habit state changes | `src/utils/habitsReducer.js` |
| Month.jsx | Calendar grid rendering, source of cell click | `src/components/Habit/Month.jsx` |
| Calendar.jsx | Prop passthrough from Habit to Month via spread | `src/components/Habit/Calendar.jsx` |
| Habit.jsx | selectedDate state owner | `src/components/Habit/Habit.jsx` |
| HabitMenu.jsx | Displays and dispatches for selectedDate | `src/components/Habit/HabitMenu.jsx` |

---

## Files Changed

| File | Change Type | Summary |
|------|-------------|---------|
| `src/utils/toggleDayCompletion.js` | New | Replaces toggleCompleteYeserday; accepts date string + optional entryFlags |
| `src/utils/toggleCompleteYeserday.js` | Deleted | Superseded |
| `src/utils/habitsReducer.js` | Modified | Swap import and case; new case signature |
| `src/components/Habit/Habit.jsx` | Modified | Add selectedDate state, handleCellClick, handleShowMenu wrapper |
| `src/components/Habit/HabitMenu.jsx` | Modified | Dynamic button; remove isTodayCompleted/isYesterdayCompleted/todayProgress; keep progressive props |
| `src/components/Habit/Month.jsx` | Modified | onClick with cell guard |

---

## Patterns & Best Practices

### Pattern 1: Sorted Insertion into Newest-First Array

**When to use**: Inserting a new completion entry without full re-sort.

**Trade-offs**: O(n) scan but n is small for habits. Maintains sort order.

**Example**:
```javascript
function toggleDayCompletion(habits, habitTitle, dateString, isCompleted, frequency, entryFlags = {}) {
    return habits.map((habit) => {
        if (habit.title !== habitTitle) return habit;
        let completedDays = [...habit.completedDays];

        if (isCompleted) {
            completedDays = completedDays.filter((d) => d.date !== dateString);
        } else {
            const entry = { date: dateString, progress: frequency, ...entryFlags };
            const insertIdx = completedDays.findIndex((d) => d.date < dateString);
            insertIdx === -1
                ? completedDays.push(entry)
                : completedDays.splice(insertIdx, 0, entry);
        }

        return { ...habit, completedDays };
    });
}
```

### Pattern 2: Calendar Cell Click Guard

**When to use**: Adding interactivity to a calendar grid where padding and future cells must be inert.

**Trade-offs**: Simple boolean guards; stopPropagation is essential to isolate cell click from parent container click.

**Example**:
```javascript
// Inside Month.jsx days.map, on the span element:
onClick={(e) => {
    if (index >= shift && dates[index] <= today) {
        e.stopPropagation();
        onCellClick(dates[index]);
    }
}}
```

`dates[index]` is already a `Date` object from the existing array. `today` is `new Date()` within the component.

### Pattern 3: selectedDate State with Reset on Menu Close

**When to use**: When a selection made in a child affects a menu that can be closed.

**Trade-offs**: Local state in `Habit.jsx` is simpler than lifting to global store. Reset on close prevents stale selection on reopen.

**Example**:
```javascript
// In Habit.jsx
const [selectedDate, setSelectedDate] = useState(yesterday);

const handleCellClick = (date) => {
    setSelectedDate(date);
    onShowMenu(index);  // open the menu
};

const handleShowMenu = (i) => {
    if (i === -1) setSelectedDate(yesterday);  // reset on close
    onShowMenu(i);
};

// Pass to Calendar's local props object (explicitly, not via spread)
const calendarProps = { colorPalette, completedDays, frequency, periodDays, onCellClick: handleCellClick };

// Pass handleShowMenu to HabitMenu instead of onShowMenu
```

### Pattern 4: Dynamic Button Label from selectedDate

**When to use**: Menu button text that changes based on which date is selected.

**Trade-offs**: Three label variants require two date comparisons. `toLocaleDateString` handles the fallback naturally.

**Example**:
```javascript
// In HabitMenu.jsx
const isSelectedCompleted = checkHabitCompletion(completedDays, frequency, periodDays, selectedDate);

const todayStr = getFormattedDate(new Date());
const yesterdayStr = getFormattedDate(yesterday);
const selectedStr = getFormattedDate(selectedDate);

const isSelectedToday = selectedStr === todayStr;
const isSelectedYesterday = selectedStr === yesterdayStr;

const dateLabel = isSelectedToday ? 'today'
    : isSelectedYesterday ? 'yesterday'
    : selectedDate.toLocaleDateString('en', { month: 'short', day: 'numeric' });

const buttonLabel = (isSelectedCompleted ? 'Undo ' : 'Do ') + dateLabel;

// Dispatch:
const entryFlags = isSelectedYesterday ? { isCompYdayBtnUsed: true } : {};
habitsDispatch({
    type: 'toggleDayCompletion',
    habitTitle: title,
    date: selectedStr,
    isCompleted: isSelectedCompleted,
    frequency,
    entryFlags,
});
```

### Pattern 5: Prop Passthrough via Explicit Object in Calendar

**When to use**: When Calendar constructs a local props object (not spreading Habit's own props).

**Trade-offs**: Calendar does NOT use `{...props}` from Habit directly; it builds its own object. Month uses spread from Calendar, so anything added to Calendar's object reaches Month automatically.

**Example**:
```javascript
// In Habit.jsx - the calendar useMemo
const calendarProps = {
    colorPalette,
    completedDays,
    frequency,
    periodDays,
    onCellClick: handleCellClick,   // Add this
};

return settings.calendarView === 'compact' ? (
    <CompactCalendar {...calendarProps} />
) : (
    <Calendar {...calendarProps} />
);
```

---

## Compatibility Notes

### Flexible Habit Frequency (periodDays)
`checkHabitCompletion` signature is `(completedDays, frequency, periodDays, ...dates)`. `periodDays` is already available in `HabitMenu` props (passed for Statistics). Pass it as the third argument when computing `isSelectedCompleted`.

### Progressive Habits (Next Stage button)
`HabitMenu` has `isProgressive, progressionMode, currentStage, stages` props and a "Next Stage" button in the buttons array. When adapting the Do/Undo button logic:
- Do NOT remove these props from destructuring
- Do NOT replace the buttons array — insert the adapted Do/Undo button entry at position 0 alongside the existing entries
- `showNextStageButton` logic (`currentStage < stages.length - 1`) remains unchanged

---

## Common Pitfalls & Solutions

| Issue | Impact | Solution |
|-------|--------|----------|
| Forgetting `e.stopPropagation()` in Month cell | High - Habit onClick fires too, opening menu wrong | Always call stopPropagation before onCellClick |
| onCellClick not in Calendar's local props object | High - prop never reaches Month | Add explicitly to the locally-constructed props object in Habit.jsx's useMemo |
| Not resetting selectedDate on menu close | Medium - reopening menu shows stale date | Intercept onShowMenu(-1) in Habit.jsx handleShowMenu wrapper |
| Passing isTodayCompleted/isYesterdayCompleted still to HabitMenu | Medium - dead props, confusing | Remove from HabitMenu destructure and from Habit.jsx spread to HabitMenu |
| Setting isCompYdayBtnUsed for all dates | Low - breaks achievement #16 semantics | Only include flag when selectedStr === yesterdayStr |
| Breaking progressive habit "Next Stage" button | High - removes previous feature | Keep isProgressive/progressionMode/currentStage/stages in HabitMenu props |
| Removing `periodDays` from HabitMenu | High - Statistics route and checkHabitCompletion call break | Keep periodDays in HabitMenu props |
| Using local Date comparison (not string) | Medium - timezone issues at midnight | Use getFormattedDate() strings for equality checks |
| Clicking future dates | Low - allows completing future days | Guard: `dates[index] <= today` (Date comparison is safe here) |

---

## Recommendations

1. **Keep toggleDayCompletion pure**: Accept `entryFlags` as optional param; callers decide the flag values. Avoids date logic inside the utility.

2. **selectedDate as Date object, compare as strings**: Store `selectedDate` as a `Date` object (for `toLocaleDateString`), but compare using `getFormattedDate()` strings (for accuracy and timezone safety).

3. **Wrap onShowMenu in Habit.jsx**: Do not add reset logic in HabitMenu — Habit owns the state, Habit resets it.

4. **Update reducer tests**: `habitsReducer.test.js` likely has tests for `toggleCompleteYeserday`. These will need to be replaced/updated for `toggleDayCompletion` when the case is removed.

5. **CompactCalendar gets onCellClick but ignores it**: Design says compact view has no cell interaction changes. The prop will be present in CompactCalendar's props but unused — that is fine.

---

## Implementation Guidance

### Installation

No new dependencies. Uses existing React, Zustand, and project utilities.

### New Utility

```bash
# Create new file
touch src/utils/toggleDayCompletion.js

# Delete old file after reducer is updated
rm src/utils/toggleCompleteYeserday.js
```

### Reducer Case

```javascript
// habitsReducer.js - remove:
import toggleCompleteYeserday from './toggleCompleteYeserday';
// case 'toggleCompleteYeserday': ...

// add:
import toggleDayCompletion from './toggleDayCompletion';
// case 'toggleDayCompletion':
//   habits = toggleDayCompletion(habits, habitTitle, action.date, action.isCompleted, action.frequency, action.entryFlags);
//   break;
```

### State in Habit.jsx

```javascript
// Add to imports:
import { useMemo, useRef, useState } from 'react';

// Add before return:
const [selectedDate, setSelectedDate] = useState(yesterday);

const handleCellClick = (date) => {
    setSelectedDate(date);
    onShowMenu(index);
};

const handleShowMenu = (i) => {
    if (i === -1) setSelectedDate(yesterday);
    onShowMenu(i);
};
```

### HabitMenu Props to Remove

```javascript
// Remove from HabitMenu destructure:
isTodayCompleted, isYesterdayCompleted, todayProgress

// Remove from Habit.jsx spread to HabitMenu:
isTodayCompleted, isYesterdayCompleted, todayProgress
// (these are no longer computed or passed)
```

---

## Sources & Verification

| Source | Type | Last Verified |
|--------|------|---------------|
| `/src/utils/toggleCompleteYeserday.js` | Codebase | 2026-03-22 |
| `/src/utils/checkHabitCompletion.js` | Codebase | 2026-03-22 |
| `/src/utils/habitsReducer.js` | Codebase | 2026-03-22 |
| `/src/components/Habit/Habit.jsx` | Codebase | 2026-03-22 |
| `/src/components/Habit/HabitMenu.jsx` | Codebase | 2026-03-22 |
| `/src/components/Habit/Month.jsx` | Codebase | 2026-03-22 |
| `/src/components/Habit/Calendar.jsx` | Codebase | 2026-03-22 |
| `.specs/plans/retroactive-day-completion.design.md` | Design doc | 2026-03-22 |

---

## Changelog

| Date | Changes |
|------|---------|
| 2026-03-22 | Initial creation for task: implement-retroactive-day-completion.feature |
