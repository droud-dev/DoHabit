---
name: Flexible Habit Frequency Tracking
description: Implementing "X times per Y days" rolling window habit tracking for React PWAs with backward compatibility
topics: habit-tracking, rolling-window, flexible-frequency, react, streak-calculation, date-handling
created: 2026-03-21
updated: 2026-03-21
scratchpad: .specs/scratchpad/3e0728c1.md
---

# Flexible Habit Frequency Tracking

## Overview

Flexible habit frequency tracking extends basic daily habit tracking to support "X times per Y days" patterns (e.g., "exercise 3 times per week" or "visit museum 2 times per month"). This skill covers the rolling window algorithm, streak calculation for variable periods, UTC-aware date handling, and dual-control UI patterns, validated by industry-leading implementations like Loop Habit Tracker.

Core concept: Instead of requiring specific days, track whether user achieves target completions within a sliding time window.

---

## Key Concepts

- **Rolling Window**: Fixed-length time period that slides forward daily. Each day, recalculate total completions within window.
- **Numerator/Denominator Pattern**: Frequency represented as "X times (numerator) per Y days (denominator)" - industry standard used by Loop, Streaks, Habitify.
- **On-Track Logic**: A day is "on track" if rolling window ending on that day meets or exceeds target frequency.
- **Consecutive On-Track Streaks**: Streak counts consecutive days where rolling window met target, not just days with completions.
- **Optional Field Pattern**: Add `periodDays` field with default value 1 for backward compatibility with existing daily habits.
- **UTC Date Handling**: Store dates as ISO strings (YYYY-MM-DD) to avoid timezone drift in habit completion tracking.

---

## Documentation & References

| Resource | Description | Link |
|----------|-------------|------|
| Loop Habit Tracker | Open-source Android habit tracker with proven flexible frequency implementation | [GitHub](https://github.com/iSoron/uhabits) |
| Streaks App | iOS habit tracker supporting "X times per week/month" | [Website](https://streaksapp.com/) |
| Habitify | Multi-platform habit tracker with custom schedules | [Website](https://habitify.me/) |
| MDN Date API | Official JavaScript Date documentation | [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) |
| Rolling Window Analysis | Time-series rolling window algorithm concepts | [QuestDB](https://questdb.com/glossary/rolling-window-analysis/) |

---

## Recommended Libraries & Tools

| Name | Purpose | Maturity | Notes |
|------|---------|----------|-------|
| Native Date API | Date arithmetic and comparisons | Stable | No library needed - built-in JavaScript |
| React 18.x | UI framework | Stable | For dual-control frequency/period UI |
| Zustand 5.x | State management | Stable | Optional field pattern for backward compat |

### Recommended Stack

For PWA habit trackers implementing flexible frequency:
- **Data Model**: frequency (number) + periodDays (number, default 1)
- **Storage**: localStorage with ISO date strings (YYYY-MM-DD)
- **Algorithm**: Rolling window sum with `isWithinPeriod()` helper
- **UI**: Dual increment/decrement controls for frequency and period
- **No external dependencies** - uses native JavaScript Date API

---

## Patterns & Best Practices

### Pattern 1: Rolling Window Calculation

**When to use**: Checking if habit is complete within flexible time period

**Trade-offs**:
- Pros: Simple to understand, matches user mental model, proven by industry
- Cons: Requires filtering array on each check (O(n) but n is small for habits)

**Example**:
```javascript
/**
 * Check if date falls within rolling window ending on endDate
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @param {Date} endDate - End of window
 * @param {number} periodDays - Window size in days
 */
function isWithinPeriod(date, endDate, periodDays) {
  const dayInMs = 24 * 60 * 60 * 1000;
  const windowStart = new Date(endDate - (periodDays * dayInMs));
  const targetDate = new Date(date);

  return targetDate >= windowStart && targetDate <= endDate;
}

// Usage: Calculate completion for "3 times per 7 days"
const totalProgress = completedDays
  .filter(d => isWithinPeriod(d.date, new Date(), 7))
  .reduce((sum, d) => sum + d.progress, 0);

const isComplete = totalProgress >= 3;
```

### Pattern 2: Consecutive On-Track Streak Calculation

**When to use**: Calculating streaks for flexible frequency habits

**Trade-offs**:
- Pros: Rewards consistency even when completion days vary, mathematically sound
- Cons: More complex than simple "consecutive completion days" logic

**Example**:
```javascript
/**
 * Check if rolling window ending on given day meets target
 */
function isOnTrack(endDate, completedDays, frequency, periodDays) {
  const totalProgress = completedDays
    .filter(d => isWithinPeriod(d.date, endDate, periodDays))
    .reduce((sum, d) => sum + d.progress, 0);

  return totalProgress >= frequency;
}

/**
 * Calculate streak as consecutive on-track days
 */
function calculateStreak(completedDays, frequency, periodDays) {
  if (completedDays.length === 0) return 0;

  const today = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  let streak = 0;

  // Start from today and count backwards
  let currentDate = today;

  while (isOnTrack(currentDate, completedDays, frequency, periodDays)) {
    streak++;
    currentDate = new Date(currentDate - oneDay);

    // Stop if we've gone too far back
    if (streak > completedDays.length * periodDays) break;
  }

  return streak;
}
```

### Pattern 3: Optional Field for Backward Compatibility

**When to use**: Adding flexible frequency to existing habit tracking app

**Trade-offs**:
- Pros: Zero migration code needed, old data works unchanged, gradual adoption
- Cons: Must handle undefined everywhere, validation needed

**Example**:
```javascript
// New habit with flexible frequency
{
  title: "Gym",
  frequency: 3,
  periodDays: 7,  // 3 times per week
  completedDays: []
}

// Old habit (still works)
{
  title: "Meditate",
  frequency: 1,
  // periodDays undefined = defaults to 1 (daily)
  completedDays: []
}

// Safe access pattern
function getEffectivePeriod(habit) {
  return habit.periodDays || 1; // Default to daily
}

// Usage in all calculations
const period = getEffectivePeriod(habit);
const isComplete = checkCompletion(completedDays, frequency, period);
```

### Pattern 4: UTC Date Handling for Consistency

**When to use**: All date storage and comparison operations

**Trade-offs**:
- Pros: Prevents timezone drift, consistent across user travel, DST-safe
- Cons: Slightly more verbose code, must remember to use UTC methods

**Example**:
```javascript
// CORRECT: Store as ISO date strings (no timezone info)
const completedDay = {
  date: '2026-03-21',  // YYYY-MM-DD format
  progress: 1
};

// CORRECT: Parse and compare using Date objects
const targetDate = new Date(completedDay.date);
const today = new Date();

// INCORRECT: Storing Date objects or timestamps
// Causes timezone issues when user travels or DST changes
const badExample = {
  date: new Date(),  // Avoid - has timezone
  timestamp: Date.now()  // Avoid - has timezone
};

// For date arithmetic, use UTC methods if needed
function addDays(dateStr, days) {
  const date = new Date(dateStr);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
}
```

### Pattern 5: Dual Control UI

**When to use**: User interface for setting frequency and period

**Trade-offs**:
- Pros: Clear mental model, follows industry UX patterns, flexible
- Cons: Takes more screen space than single control

**Example**:
```jsx
function FrequencyControls({ frequency, periodDays, onChange }) {
  return (
    <div className={styles.controls}>
      {/* Frequency controls */}
      <button
        onClick={() => onChange('frequency', frequency - 1)}
        disabled={frequency <= 1}
        aria-label="Decrease frequency"
      >
        -
      </button>

      <div className={styles.value}>
        <input
          type="number"
          value={frequency}
          readOnly
          tabIndex={-1}
        />
        <span>times</span>
      </div>

      <button
        onClick={() => onChange('frequency', frequency + 1)}
        disabled={frequency >= 6}
        aria-label="Increase frequency"
      >
        +
      </button>

      <span className={styles.separator}>/</span>

      {/* Period controls */}
      <button
        onClick={() => onChange('period', periodDays - 1)}
        disabled={periodDays <= 1}
        aria-label="Decrease period"
      >
        -
      </button>

      <div className={styles.value}>
        <input
          type="number"
          value={periodDays}
          readOnly
          tabIndex={-1}
        />
        <span>day{periodDays !== 1 ? 's' : ''}</span>
      </div>

      <button
        onClick={() => onChange('period', periodDays + 1)}
        disabled={periodDays >= 90}
        aria-label="Increase period"
      >
        +
      </button>
    </div>
  );
}
```

---

## Similar Implementations

### Loop Habit Tracker (Android - Open Source)

- **Source**: GitHub iSoron/uhabits, 6K+ stars
- **Approach**:
  - `Frequency` class with numerator/denominator
  - Rolling sum tracks completions within denominator period
  - Doubles numerator/denominator for non-daily habits (smoothing)
  - Streak calculation filters timestamps for consecutive days
- **Applicability**: HIGH - exact model match, proven at scale, open source for reference

### Streaks (iOS - Commercial)

- **Source**: Streaks App, Apple Design Award winner
- **Approach**:
  - "Certain number of days per week or month" setting
  - Single-tap completion tracking
  - Widget support for quick access
- **Applicability**: MEDIUM - validates UX pattern, but proprietary implementation

### Habitify (Multi-platform - Commercial)

- **Source**: Habitify.me, 1M+ users
- **Approach**:
  - Custom schedules including flexible frequencies
  - Daily/weekly/monthly views
  - Cross-platform sync (uses backend)
- **Applicability**: MEDIUM - validates feature value, but requires backend

---

## Common Pitfalls & Solutions

| Issue | Impact | Solution |
|-------|--------|----------|
| **Using local time methods** | Timezone drift when user travels or DST changes | Store dates as ISO strings (YYYY-MM-DD), use Date objects only for arithmetic |
| **Forgetting to default periodDays** | Crashes on old habits missing field | Always use `habit.periodDays || 1` or add migration |
| **O(n²) performance from nested loops** | Slow with many habits/entries | Single filter + reduce pass per calculation, avoid nested iteration |
| **Streak calculation off-by-one errors** | Incorrect streak counts | Carefully test: first day, last day, today incomplete, exactly at window edge |
| **Not handling incomplete current day** | Streaks break prematurely today | Remove incomplete first day before streak calculation |
| **Hardcoding daily assumptions** | Breaks when periodDays > 1 | Use periodDays parameter in ALL date calculations |
| **Month/year boundary bugs** | Wrong window size across boundaries | Use Date API arithmetic, not manual day counting |
| **Missing accessibility labels** | Screen readers can't announce changes | Add aria-label to all controls, aria-live for dynamic updates |

---

## Recommendations

1. **Use numerator/denominator (frequency/periodDays) pattern**: Validated by Loop Habit Tracker (6K+ GitHub stars) and used by Streaks, Habitify. Simple, flexible, proven at scale.

2. **Store dates as ISO strings (YYYY-MM-DD)**: Avoids timezone issues. Parse to Date objects only when needed for arithmetic. Test midnight, DST transitions.

3. **Implement rolling window with filter + reduce**: For typical habit data (<365 entries), performance is negligible. Single-pass optimization unnecessary unless profiling shows issue.

4. **Calculate streaks as "consecutive on-track days"**: Extension of standard streak logic. Each day checks if rolling window meets target. More meaningful for flexible frequency than counting completion days.

5. **Default periodDays to 1 for backward compatibility**: Makes field optional. Old habits (daily) work unchanged. New habits can set custom periods.

6. **Use dual controls for frequency/period UI**: Industry standard pattern (Loop, Streaks). Clear mental model. Ensure accessibility (aria-labels, disabled states).

7. **Test edge cases thoroughly**: Month boundaries, leap years, DST transitions, first day of habit, incomplete current day, exactly at period limit.

---

## Implementation Guidance

### Installation

No external dependencies required. Uses native JavaScript Date API.

```bash
# Already in project (if using React)
# No additional packages needed
```

### Configuration

Schema extension - add to habit object:

```javascript
// Habit data model
{
  title: string,           // Existing
  frequency: number,       // Existing (1-6)
  periodDays: number,      // NEW (1-90, default 1)
  completedDays: [         // Existing
    { date: 'YYYY-MM-DD', progress: number }
  ]
}
```

### Integration Points

1. **Data layer**: Add `periodDays` field to habit schema, default to 1 on load
2. **Utilities**: Create `isWithinPeriod.js`, update `checkHabitCompletion.js`, `getStreaks.js`
3. **Components**: Update `FrequencyBlock.jsx` with dual controls, `HabitHeader.jsx` for display
4. **State**: Pass `periodDays` through all completion/streak calculations
5. **Migration**: Add `if (!habit.periodDays) habit.periodDays = 1;` to init function

---

## Code Examples

### Example 1: Core Rolling Window Function

```javascript
// utils/isWithinPeriod.js

/**
 * Checks if a date falls within a rolling time window
 *
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @param {Date} endDate - End of the rolling window
 * @param {number} periodDays - Window size in days (1-90)
 * @returns {boolean} True if date is within window
 *
 * Example:
 *   isWithinPeriod('2026-03-15', new Date('2026-03-21'), 7)
 *   // Returns true - Mar 15 is within 7 days before Mar 21
 */
function isWithinPeriod(date, endDate, periodDays) {
  const dayInMs = 24 * 60 * 60 * 1000;
  const windowStart = new Date(endDate.getTime() - (periodDays * dayInMs));
  const targetDate = new Date(date);

  return targetDate >= windowStart && targetDate <= endDate;
}

export default isWithinPeriod;
```

### Example 2: Completion Check with Rolling Window

```javascript
// utils/checkHabitCompletion.js
import isWithinPeriod from './isWithinPeriod';

/**
 * Checks if habit is complete for given date(s)
 *
 * For daily habits (periodDays=1): checks single day
 * For flexible habits: checks rolling window ending on latest date
 */
function checkHabitCompletion(completedDays, frequency, periodDays, ...dates) {
  if (dates.length === 0) return false;

  // Use latest date as end of window
  const endDate = new Date(Math.max(...dates.map(d => new Date(d))));

  // Sum progress within rolling window
  const totalProgress = completedDays
    .filter(d => isWithinPeriod(d.date, endDate, periodDays))
    .reduce((sum, d) => sum + d.progress, 0);

  return totalProgress >= frequency;
}

export default checkHabitCompletion;
```

### Example 3: Streak Calculation for Flexible Frequency

```javascript
// utils/getStreaks.js
import isWithinPeriod from './isWithinPeriod';

function getStreaks(completedDays, frequency, periodDays) {
  // Remove incomplete first day (if today is not complete)
  completedDays = removeIncompleteFirstDay(completedDays, frequency, periodDays);

  if (completedDays.length === 0) {
    return { currentStreak: 0, longestStreak: 0, allStreaks: [] };
  }

  const oneDay = 24 * 60 * 60 * 1000;
  const allStreaks = [];
  let currentSeries = 1;
  let streakEnd = completedDays[0].date;

  // Check each day if rolling window meets target
  for (let i = 0; i < completedDays.length; i++) {
    const dayOne = new Date(completedDays[i].date);
    const dayTwo = completedDays[i + 1] ? new Date(completedDays[i + 1].date) : null;

    // Check if both days are "on track"
    const dayOneOnTrack = isOnTrack(dayOne, completedDays, frequency, periodDays);
    const dayTwoOnTrack = dayTwo ? isOnTrack(dayTwo, completedDays, frequency, periodDays) : false;

    // Streak continues if consecutive AND both on track
    const isConsecutive = dayTwo && (dayOne - dayTwo) / oneDay === 1;

    if (isConsecutive && dayOneOnTrack && dayTwoOnTrack) {
      currentSeries++;
    } else {
      // End of streak - record it
      allStreaks.push({
        length: currentSeries,
        start: completedDays[i].date,
        end: streakEnd
      });

      currentSeries = 1;
      streakEnd = completedDays[i + 1]?.date;
    }
  }

  const today = new Date();
  const lastDay = new Date(completedDays[0]?.date);
  const daysSinceLastCompletion = Math.floor((today - lastDay) / oneDay);

  return {
    allStreaks,
    longestStreak: Math.max(...allStreaks.map(s => s.length)),
    currentStreak: daysSinceLastCompletion > 1 ? 0 : allStreaks[0]?.length || 0
  };
}

/**
 * Check if rolling window ending on date meets target
 */
function isOnTrack(endDate, completedDays, frequency, periodDays) {
  const totalProgress = completedDays
    .filter(d => isWithinPeriod(d.date, endDate, periodDays))
    .reduce((sum, d) => sum + d.progress, 0);

  return totalProgress >= frequency;
}

function removeIncompleteFirstDay(completedDays, frequency, periodDays) {
  if (completedDays.length === 0) return [];

  const firstDay = completedDays[0];
  const today = new Date();
  const isToday = firstDay.date === today.toISOString().split('T')[0];

  if (isToday && !isOnTrack(today, completedDays, frequency, periodDays)) {
    return completedDays.slice(1); // Remove incomplete first day
  }

  return completedDays;
}

export default getStreaks;
```

### Example 4: Migration for Existing Habits

```javascript
// utils/initHabits.js

function initHabits() {
  let habits = getFromLocalStorage('habits', []);

  // Migrate: add periodDays to old habits
  habits = habits.map(habit => {
    if (!habit.periodDays) {
      return {
        ...habit,
        periodDays: 1  // Default to daily
      };
    }
    return habit;
  });

  saveToLocalStorage('habits', habits);
  return habits;
}

export default initHabits;
```

### Example 5: FrequencyBlock Component Update

```javascript
// components/HabitEditor/FrequencyBlock.jsx
import { useState } from 'react';
import styles from './FrequencyBlock.module.css';

function FrequencyBlock({ currentFrequency, currentPeriodDays }) {
  const [frequency, setFrequency] = useState(currentFrequency || 1);
  const [periodDays, setPeriodDays] = useState(currentPeriodDays || 1);

  const handleClick = (type, direction) => {
    if (type === 'frequency') {
      setFrequency(curr => {
        if (direction === 'decrease') return Math.max(1, curr - 1);
        if (direction === 'increase') return Math.min(6, curr + 1);
        return curr;
      });
    } else if (type === 'period') {
      setPeriodDays(curr => {
        if (direction === 'decrease') return Math.max(1, curr - 1);
        if (direction === 'increase') return Math.min(90, curr + 1);
        return curr;
      });
    }
  };

  return (
    <section>
      <div className={styles.header}>
        <h3>Frequency</h3>
      </div>

      <div className={styles.content}>
        {/* Frequency controls */}
        <button
          onClick={() => handleClick('frequency', 'decrease')}
          disabled={frequency <= 1}
          aria-label="Decrease frequency"
          className={styles.btn}
        >
          -
        </button>

        <div className={styles.left}>
          <input
            type="number"
            name="frequency"
            value={frequency}
            readOnly
            tabIndex={-1}
            className={styles.input}
          />
          <div>times</div>
        </div>

        <button
          onClick={() => handleClick('frequency', 'increase')}
          disabled={frequency >= 6}
          aria-label="Increase frequency"
          className={styles.btn}
        >
          +
        </button>

        {/* Separator */}
        <div className={styles.separator}>/</div>

        {/* Period controls */}
        <button
          onClick={() => handleClick('period', 'decrease')}
          disabled={periodDays <= 1}
          aria-label="Decrease period"
          className={styles.btn}
        >
          -
        </button>

        <div className={styles.left}>
          <input
            type="number"
            name="periodDays"
            value={periodDays}
            readOnly
            tabIndex={-1}
            className={styles.input}
          />
          <div>day{periodDays !== 1 ? 's' : ''}</div>
        </div>

        <button
          onClick={() => handleClick('period', 'increase')}
          disabled={periodDays >= 90}
          aria-label="Increase period"
          className={styles.btn}
        >
          +
        </button>
      </div>
    </section>
  );
}

export default FrequencyBlock;
```

### Example 6: Performance Optimization (Optional)

```javascript
// Single-pass optimization (only if profiling shows need)

// BEFORE: Two array passes
const totalProgress = completedDays
  .filter(d => isWithinPeriod(d.date, endDate, periodDays))
  .reduce((sum, d) => sum + d.progress, 0);

// AFTER: Single pass
const totalProgress = completedDays.reduce((sum, d) => {
  return isWithinPeriod(d.date, endDate, periodDays)
    ? sum + d.progress
    : sum;
}, 0);

// Benchmark: For 365 entries, improvement is <1ms
// Only optimize if profiling shows bottleneck
```

---

## Sources & Verification

| Source | Type | Last Verified |
|--------|------|---------------|
| [Loop Habit Tracker (GitHub)](https://github.com/iSoron/uhabits) | Open Source | 2026-03-21 |
| [Streaks App](https://streaksapp.com/) | Commercial App | 2026-03-21 |
| [Habitify](https://habitify.me/) | Commercial App | 2026-03-21 |
| [Best Habit Tracker Apps - Zapier](https://zapier.com/blog/best-habit-tracker-app/) | Industry Review | 2026 |
| [Best Habit Tracking Apps - Reclaim](https://reclaim.ai/blog/habit-tracker-apps) | Industry Review | 2026 |
| [MDN Date API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) | Official Docs | Current |
| [Rolling Window Analysis - QuestDB](https://questdb.com/glossary/rolling-window-analysis/) | Technical Reference | 2026-03-21 |
| [JavaScript Performance Optimization - VIP JavaScript](https://vipjavascript.com/blog/javascript-performance-optimization) | Technical Guide | 2026 |
| [Timezone Handling - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset) | Official Docs | Current |
| Design Document | Project-specific | 2026-03-21 |

---

## Changelog

| Date | Changes |
|------|---------|
| 2026-03-21 | Initial creation for task: implement-flexible-habit-frequency.feature |

