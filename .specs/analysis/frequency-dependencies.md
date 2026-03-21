# Frequency Dependencies Analysis

Analysis of all files that use `frequency` or `completedDays` to identify missing dependencies for the `periodDays` feature.

## Summary

**Critical missing updates:** 8 files
**Files already in design:** 9 files
**Total files requiring changes:** 17 files

## Files Already Covered in Design ✓

1. `src/utils/checkHabitCompletion.js` - Add periodDays parameter
2. `src/utils/getStreaks.js` - Add periodDays parameter, rolling window logic
3. `src/utils/initHabits.js` - Migration: add periodDays: 1
4. `src/utils/habitsReducer.js` - Add periodDays to newHabit object
5. `src/utils/removeIncompleteFirstDay.js` - Add periodDays parameter
6. `src/utils/removeIncompleteDays.js` - Add periodDays parameter
7. `src/components/HabitEditor/FrequencyBlock.jsx` - UI for periodDays
8. `src/components/Habit/Habit.jsx` - Pass periodDays through props
9. `src/components/Habit/HabitHeader.jsx` - Rolling window for progress

## Critical Missing Updates

### 1. `src/utils/achievementsReducer.js` ⚠️

**Issue:** All achievement calculations use `frequency` but don't pass `periodDays`

**Locations:**
- Line 50: `getStreaks(h.completedDays, h.frequency)` → needs `h.periodDays`
- Line 59: `getCompletionGaps(h.completedDays, h.frequency)` → needs `h.periodDays`
- Line 68: `getCompletionGaps(h.completedDays, h.frequency)` → needs `h.periodDays`
- Line 99: `checkHabitCompletion(h.completedDays, h.frequency, creationDate)` → needs `h.periodDays`
- Line 126: `getStreaks(h.completedDays, h.frequency)` → needs `h.periodDays`
- Line 153: `removeIncompleteFirstDay(h.completedDays, h.frequency)` → needs `h.periodDays`
- Line 170: `getStreaks(h.completedDays, h.frequency)` → needs `h.periodDays`
- Line 193: `getStreaks(h.completedDays, h.frequency)` → needs `h.periodDays`
- Line 231: `removeIncompleteFirstDay(h.completedDays, h.frequency)` → needs `h.periodDays`
- Line 259: `removeIncompleteFirstDay(h.completedDays, h.frequency)` → needs `h.periodDays`
- Line 293: `removeIncompleteFirstDay(h.completedDays, h.frequency)` → needs `h.periodDays`

**Fix:** Pass `h.periodDays || 1` to all function calls (defaults to 1 for backward compatibility)

### 2. `src/utils/editHabit.js` ⚠️

**Issue:** Only checks if `frequency` changed, doesn't check `periodDays`

**Current logic (Line 11):**
```javascript
const frequencyWasChanged = habit.frequency !== updatedHabit.frequency;
```

**Problem:** If user changes from "3 times/1 day" to "3 times/7 days", frequency unchanged but periodDays changed. The `updateCompletedDays` won't be called.

**Fix:**
```javascript
const frequencyWasChanged =
  habit.frequency !== updatedHabit.frequency ||
  habit.periodDays !== updatedHabit.periodDays;
```

### 3. `src/utils/updateCompletedDays.js` ⚠️

**Issue:** Updates all past progress values to new frequency when frequency changes. Doesn't handle periodDays changes.

**Current logic (Line 5-10):**
```javascript
return completedDays.map(
  (day) => (
    day.date === getFormattedDate(new Date()) && day.progress < newFrequency
      ? day
      : { ...day, progress: newFrequency }
  )
);
```

**Problem:** This makes sense for daily habits (filling in all past days to match new frequency), but with periodDays this is questionable. If changing from "3/day" to "2/week", should all past days be set to progress: 2?

**Recommendation:** This function might need rethinking or removal. With rolling windows, historical progress values are less meaningful when the period changes. Possibly just leave historical data as-is.

### 4. `src/utils/getCompletionCountPerDay.js` ⚠️

**Issue:** Counts completed days by checking `day.progress < frequency`

**Current logic (Line 5):**
```javascript
if (day.progress < frequency) continue;
```

**Problem:** With `periodDays > 1`, this check is wrong. A day with progress: 1 might contribute to a complete period even if frequency is 3.

**Fix:** This needs rolling window logic. A day should count if it's part of ANY complete period. Alternatively, for statistics purposes, just count all days with progress > 0 regardless of frequency/periodDays.

**Recommendation:** For weekday statistics, count any day where `day.progress > 0` (user did the habit that day), regardless of whether it completed a period.

### 5. `src/utils/getCompletionCountPerMonth.js` ⚠️

**Issue:** Same as getCompletionCountPerDay

**Current logic (Line 8):**
```javascript
if (day.progress < frequency) continue;
```

**Fix:** Count any day where `day.progress > 0`

### 6. `src/components/HabitEditor/HabitEditor.jsx` ⚠️

**Issue:** FrequencyBlock doesn't receive currentPeriodDays

**Current (Line 96-98):**
```javascript
<FrequencyBlock
  {...{ currentFrequency: habit?.frequency }}
/>
```

**Fix:**
```javascript
<FrequencyBlock
  currentFrequency={habit?.frequency}
  currentPeriodDays={habit?.periodDays}
/>
```

### 7. `src/components/Habit/Month.jsx` ⚠️

**Issue:** checkHabitCompletion call missing periodDays

**Current (Line 49):**
```javascript
const checkedDates = checkHabitCompletion(completedDays, frequency, ...dates);
```

**Fix:**
```javascript
const checkedDates = checkHabitCompletion(completedDays, frequency, periodDays, ...dates);
```

**Note:** Needs `periodDays` prop passed from Habit → Calendar → Month

### 8. `src/components/Habit/CompactCalendar.jsx` ⚠️

**Issue:** checkHabitCompletion call missing periodDays

**Current (Line 23):**
```javascript
const checkedDates = checkHabitCompletion(completedDays, frequency, ...dates);
```

**Fix:**
```javascript
const checkedDates = checkHabitCompletion(completedDays, frequency, periodDays, ...dates);
```

**Note:** Needs `periodDays` prop passed from Habit → CompactCalendar

### 9. `src/components/Statistics/Statistics.jsx` ⚠️

**Issue:** getStreaks calls missing periodDays

**Current (Line 49-50):**
```javascript
const { currentStreak } = getStreaks(completedDays, frequency);
const { allStreaks, longestStreak } = getStreaks(selectedDays, frequency);
```

**Fix:**
```javascript
const { currentStreak } = getStreaks(completedDays, frequency, periodDays);
const { allStreaks, longestStreak } = getStreaks(selectedDays, frequency, periodDays);
```

**Note:** Needs `periodDays` from location.state (passed from HabitMenu)

## Files That DON'T Need Changes

### `src/utils/toggleCompleteYeserday.js`
- Sets `progress: frequency` when marking yesterday complete
- Works fine: just marks yesterday as having the full frequency
- Doesn't need periodDays

### `src/utils/getCompletionGaps.js`
- Already reads frequency, will need periodDays parameter for removeIncompleteFirstDay call
- Actually DOES need update - calls `removeIncompleteFirstDay` on line 9-11
- **Add to critical list**

## Additional Missing Dependency

### 10. `src/utils/getCompletionGaps.js` ⚠️

**Issue:** Calls removeIncompleteFirstDay without periodDays

**Current (Line 9-11):**
```javascript
if (completedDays[0]?.progress < frequency) {
  completedDays = completedDays.slice(1);
};
```

**Fix:** Should call `removeIncompleteFirstDay(completedDays, frequency, periodDays)` instead of manual slicing, OR add periodDays parameter to this function and update the check.

## Prop Threading Requirements

**Component hierarchy that needs periodDays:**

```
HabitEditor
  └─ FrequencyBlock (needs currentPeriodDays)

Habit (has periodDays)
  ├─ HabitHeader ✓ (already in design)
  ├─ Calendar
  │   └─ Month (needs periodDays)
  └─ CompactCalendar (needs periodDays)

HabitMenu
  └─ passes to Statistics via Link state (needs periodDays)

Statistics (needs periodDays from location.state)
```

## Updated File Count

**Total files needing changes: 19**

Original design covered: 9
Missing from design: 10

### New files to add to design:

1. `src/utils/achievementsReducer.js` - Pass periodDays to all completion checks
2. `src/utils/editHabit.js` - Check both frequency and periodDays changes
3. `src/utils/updateCompletedDays.js` - Needs rethinking for periodDays
4. `src/utils/getCompletionCountPerDay.js` - Change completion check logic
5. `src/utils/getCompletionCountPerMonth.js` - Change completion check logic
6. `src/utils/getCompletionGaps.js` - Add periodDays parameter
7. `src/components/HabitEditor/HabitEditor.jsx` - Pass currentPeriodDays to FrequencyBlock
8. `src/components/Habit/Month.jsx` - Add periodDays to checkHabitCompletion call
9. `src/components/Habit/CompactCalendar.jsx` - Add periodDays to checkHabitCompletion call
10. `src/components/Statistics/Statistics.jsx` - Add periodDays to getStreaks calls

## Data Flow Verification

**HabitMenu → Statistics:**
- HabitMenu passes state via Link (line 96-103)
- Needs to add `periodDays` to state object

**Habit → Calendars:**
- Habit.jsx passes props to Calendar/CompactCalendar
- Already passes `frequency`, needs to also pass `periodDays`

**HabitEditor → FrequencyBlock:**
- Currently only passes `currentFrequency`
- Needs to pass `currentPeriodDays`

## Testing Impact

Statistics calculations that need verification with periodDays:
- Weekday completion counts (getCompletionCountPerDay)
- Monthly completion counts (getCompletionCountPerMonth)
- All 26 achievement conditions (achievementsReducer)
- Streak calculations in statistics view
- Calendar day highlighting (Month, CompactCalendar)

## Recommendations

1. **Update design document** with all 10 missing files
2. **Reconsider `updateCompletedDays.js`** logic - may not make sense with periodDays
3. **Add integration tests** for achievements with periodDays > 1
4. **Statistics logic decision**: Should weekday/monthly stats count:
   - (A) Days that completed their period? (complex, needs rolling window)
   - (B) Any day where progress > 0? (simpler, more intuitive)

   Recommendation: Option B for simplicity

5. **Migration consideration**: Existing habits default to `periodDays: 1`, so all these functions need to handle `periodDays || 1` for backward compatibility
