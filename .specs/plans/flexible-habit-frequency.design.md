# Flexible Habit Frequency Design

## Overview

Extend DoHabit to support flexible habit tracking beyond daily frequency. Instead of only "X times per day", support "X times per Y days" (e.g., "weightlifting 2 times per 7 days", "museum visit 3 times per 30 days").

Default behavior remains "1 time per 1 day" (daily tracking), preserving current functionality.

## Goals

- Support flexible frequency: "X times per Y days"
- Maintain backward compatibility with existing habits
- Keep implementation simple with unified logic
- Enable future expansion to more complex tracking patterns

## Data Model

### Habit Structure

**Current:**
```javascript
{
  title: "Pushups",
  frequency: 3,  // 3 times per day
  completedDays: [
    { date: '2025-03-20', progress: 2 },
    { date: '2025-03-19', progress: 3 }
  ]
}
```

**New:**
```javascript
{
  title: "Pushups",
  frequency: 3,      // 3 times
  periodDays: 7,     // per 7 days
  completedDays: [
    { date: '2025-03-20', progress: 2 },
    { date: '2025-03-19', progress: 3 }
  ]
}
```

### Field Definitions

- `frequency`: Number of completions required (1-6)
- `periodDays`: Number of days in the tracking period (1-90)
- `completedDays`: Array of `{date, progress}` - unchanged

### Migration

Migration adds `periodDays: 1` to existing habits during initialization in `initHabits.js`. Preserves all data and maintains identical behavior.

## Completion Logic

### Unified Calculation

Replace single-day completion check with rolling window sum:

```javascript
// Works for all cases: daily (1/1) or flexible (X/Y)
const totalProgress = completedDays
  .filter(d => isWithinPeriod(d.date, endDate, periodDays))
  .reduce((sum, d) => sum + d.progress, 0);

const isComplete = totalProgress >= frequency;
```

### Examples

**Daily habit (1 time per 1 day):**
- Window size: 1 day (today only)
- Need: 1 click today
- If clicked once: complete ✓

**Multi-daily (3 times per 1 day):**
- Window size: 1 day (today only)
- Need: 3 clicks today
- If clicked 3 times: complete ✓

**Weekly habit (2 times per 7 days):**
- Window size: 7 days (rolling)
- Need: 2 total clicks in last 7 days
- Could be: 2x Monday, or 1x Mon + 1x Wed, or any combination

### Helper Function

New utility: `isWithinPeriod(date, endDate, periodDays)`

```javascript
function isWithinPeriod(date, endDate, periodDays) {
  const dayInMs = 24 * 60 * 60 * 1000;
  const windowStart = new Date(endDate - (periodDays * dayInMs));
  const targetDate = new Date(date);

  return targetDate >= windowStart && targetDate <= endDate;
}
```

## UI Changes

### FrequencyBlock Component

**Current UI:**
```
[1] / Day
[-] [+]
```

**New UI:**
```
[-] [2 times] [+]  /  [-] [7 days] [+]
```

**Structure:**
```jsx
<section>
  <div className={styles.header}>
    <h3>Frequency</h3>
  </div>

  <div className={styles.content}>
    {/* Frequency controls */}
    <button onClick={() => handleClick('frequency', 'decrease')}
      disabled={frequency <= 1}>
      -
    </button>

    <div className={styles.left}>
      <input type="number" name="frequency" id="frequency"
        className={styles.input}
        value={frequency}
        tabIndex={-1}
        readOnly
      />
      <div>times</div>
    </div>

    <button onClick={() => handleClick('frequency', 'increase')}
      disabled={frequency >= 6}>
      +
    </button>

    {/* Separator */}
    <div className={styles.separator}>/</div>

    {/* Period controls */}
    <button onClick={() => handleClick('period', 'decrease')}
      disabled={periodDays <= 1}>
      -
    </button>

    <div className={styles.left}>
      <input type="number" name="periodDays" id="periodDays"
        className={styles.input}
        value={periodDays}
        tabIndex={-1}
        readOnly
      />
      <div>day{periodDays !== 1 ? 's' : ''}</div>
    </div>

    <button onClick={() => handleClick('period', 'increase')}
      disabled={periodDays >= 90}>
      +
    </button>
  </div>
</section>
```

**CSS Updates:**
```css
/* FrequencyBlock.module.css additions */
.separator {
  display: flex;
  align-items: center;
  padding: 0 0.5rem;
}

/* .content already exists with display: flex, gap: 0.4rem */
/* .left already exists for input+label grouping */
/* .btn and .input already exist */
```

**State Management:**
```javascript
const [frequency, setFrequency] = useState(currentFrequency || 1);
const [periodDays, setPeriodDays] = useState(currentPeriodDays || 1);

const handleClick = (type, dir) => {
  if (type === 'frequency') {
    setFrequency(curr => {
      if (dir === 'decrease') return Math.max(1, curr - 1);
      if (dir === 'increase') return Math.min(6, curr + 1);
      return curr;
    });
  } else if (type === 'period') {
    setPeriodDays(curr => {
      if (dir === 'decrease') return Math.max(1, curr - 1);
      if (dir === 'increase') return Math.min(90, curr + 1);
      return curr;
    });
  }
};
```

**Limits:**
- Frequency: 1-6 (maintains current max)
- Period: 1-90 days (reasonable range for habits)

### Display Updates

**HabitHeader progress button:**

Maintains percentage display for consistency:

```javascript
// Calculate progress percentage
const numerator = completedDays
  .filter(d => isWithinPeriod(d.date, new Date(), periodDays))
  .reduce((sum, d) => sum + d.progress, 0);

const progressPercentage = Math.floor((numerator / frequency) * 100);

// Display (unchanged)
{progressPercentage === 100 ? <FaCheck /> : <strong>{progressPercentage}%</strong>}
```

**ProgressBar component:**

Remains unchanged. Shows only when `frequency > 1`, behaves identically regardless of `periodDays`.

## Streak Calculation

### Updated Logic

**Current approach:**
- Counts consecutive days where `day.progress >= frequency`
- Breaks if gap exceeds 1 day

**New approach:**
- Checks if rolling window ending on each day meets target
- Counts consecutive days where window is "on track"

```javascript
function getStreaks(completedDays, frequency, periodDays) {
  // Remove incomplete first day (same as current)
  completedDays = removeIncompleteFirstDay(completedDays, frequency, periodDays);

  if (completedDays.length === 0) {
    return { currentStreak: 0, longestStreak: 0, allStreaks: [] };
  }

  const oneDay = 24 * 60 * 60 * 1000;
  const allStreaks = [];
  let currentSeries = 1;
  let streakEnd = completedDays[0].date;

  // Iterate through days
  for (let i = 0; i < completedDays.length; i++) {
    const dayOne = new Date(completedDays[i].date);
    const dayTwo = new Date(completedDays[i + 1]?.date);

    // Check if both days are "on track"
    const dayOneOnTrack = isOnTrack(dayOne, completedDays, frequency, periodDays);
    const dayTwoOnTrack = isOnTrack(dayTwo, completedDays, frequency, periodDays);

    // Streak continues if consecutive AND both on track
    if ((dayOne - dayTwo) / oneDay === 1 && dayOneOnTrack && dayTwoOnTrack) {
      currentSeries++;
    } else {
      allStreaks.push({
        length: currentSeries,
        start: completedDays[i].date,
        end: streakEnd
      });

      currentSeries = 1;
      streakEnd = completedDays[i + 1]?.date;
    }
  }

  const today = new Date(getFormattedDate(new Date()));
  const lastDay = new Date(completedDays[0]?.date);

  return {
    allStreaks,
    longestStreak: Math.max(...allStreaks.map(s => s.length)),
    currentStreak: (today - lastDay) / oneDay > 1 ? 0 : allStreaks[0].length
  };
}

function isOnTrack(endDate, completedDays, frequency, periodDays) {
  const totalProgress = completedDays
    .filter(d => isWithinPeriod(d.date, endDate, periodDays))
    .reduce((sum, d) => sum + d.progress, 0);

  return totalProgress >= frequency;
}
```

### Examples

**Daily habit (1/1):**
- Monday: click once → on track
- Tuesday: click once → on track
- Wednesday: no click → not on track
- Streak: 2 days

**Weekly habit (2/7):**
- Week 1: Mon (1 click), Wed (1 click) → every day in week on track
- Week 2: Mon (1 click), Thu (1 click) → every day in week on track
- Week 3: no clicks → not on track
- Streak: ~14 days (ends when rolling window drops below target)

## File Changes

### New Files

**`src/utils/isWithinPeriod.js`:**
```javascript
function isWithinPeriod(date, endDate, periodDays) {
  const dayInMs = 24 * 60 * 60 * 1000;
  const windowStart = new Date(endDate - (periodDays * dayInMs));
  const targetDate = new Date(date);

  return targetDate >= windowStart && targetDate <= endDate;
}

export default isWithinPeriod;
```

### Modified Files

**`src/components/HabitEditor/FrequencyBlock.jsx`:**
- Add `periodDays` state
- Add second input group with +/- controls
- Update `handleClick` to manage both frequency and period
- Pass `periodDays` to form data

**`src/utils/checkHabitCompletion.js`:**
- Add `periodDays` parameter
- Replace single-day check with rolling window sum
- Use `isWithinPeriod` helper

**`src/utils/getStreaks.js`:**
- Add `periodDays` parameter
- Replace day-by-day completion check with `isOnTrack` function
- Update streak logic to use rolling windows

**`src/utils/initHabits.js`:**
- Add migration: `if (!h.periodDays) h.periodDays = 1;`
- Maintains backward compatibility

**`src/utils/habitsReducer.js`:**
- Add `periodDays: Number(data.periodDays.value)` to `newHabit` object
- Passes through to habit creation/editing

**`src/utils/removeIncompleteFirstDay.js`:**
- Add `periodDays` parameter
- Update to use rolling window check instead of single-day

**`src/utils/removeIncompleteDays.js`:**
- Add `periodDays` parameter
- Update to use rolling window check

**`src/components/Habit/Habit.jsx`:**
- Pass `periodDays` prop through component chain

**`src/components/Habit/HabitHeader.jsx`:**
- Use rolling window calculation for progress percentage
- Display remains unchanged (shows percentage)

**`src/css/FrequencyBlock.module.css`:**
- Add `.separator` style for "/" divider

## Testing Scenarios

### Migration
- [ ] Existing habits load with `periodDays: 1`
- [ ] Old daily habits (3x/day) work identically
- [ ] Upgrade preserves all data

### UI
- [ ] Frequency controls work (1-6 range)
- [ ] Period controls work (1-90 range)
- [ ] Display shows "1 day" vs "2 days" (plural)
- [ ] Layout wraps properly on mobile
- [ ] Form submission includes both values

### Completion Logic
- [ ] Daily habit (1/1): completes when clicked once
- [ ] Multi-daily (3/1): completes when clicked 3x today
- [ ] Weekly habit (2/7): completes when 2 clicks in 7 days
- [ ] Progress can accumulate across days in period
- [ ] Rolling window updates correctly each day

### Streak Calculation
- [ ] Daily streaks count consecutive complete days
- [ ] Weekly streaks count consecutive "on track" days
- [ ] Streak breaks when window falls below target
- [ ] Current streak displays correctly
- [ ] Longest streak tracks properly

### Edge Cases
- [ ] Handle habits created before migration
- [ ] Zero completed days (new habit)
- [ ] Period spans month boundaries
- [ ] Very long periods (30, 60, 90 days)
- [ ] Export/import preserves `periodDays`

## Future Enhancements

This design supports future expansion:

**Count mode selection:**
```javascript
habit.countMode = 'days' | 'completions';

// Current: count unique days
// Future: count total completions (sum of progress values)
```

**Spacing constraints:**
```javascript
habit.minDayGap = 2;  // Must have 2+ days between completions
```

**Period types:**
```javascript
habit.periodType = 'rolling' | 'fixed';

// Current: rolling window
// Future: fixed periods (weekly reset on Monday, monthly on 1st)
```

The data model (`completedDays` with progress values) supports all of these without schema changes.

## Implementation Notes

- Isolate all changes to frequency/period handling
- Preserve existing click behavior (increment progress)
- Leave achievement, diary, and archive features unchanged
- Export/import works automatically (optional field)
- Preserve all other habit properties (title, color, icon, order)

## Success Criteria

- Users can create "2 times per 7 days" habits
- Users can create "3 times per 30 days" habits
- Existing "3 times per day" habits continue working
- Progress percentage displays correctly
- Streaks calculate accurately
- Preserves existing data without breaking changes
- Clean, maintainable code with unified logic
