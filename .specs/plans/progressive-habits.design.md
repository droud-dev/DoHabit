# Progressive Habits Feature Design

## Overview

Extend DoHabit to support progressive habits - habits that advance through defined stages over time. For example: "Read 1 page" → "Read 2 pages" → "Read 3 pages". Users can progress automatically (based on completions or days) or manually.

## Goals

- Implement with minimum complexity
- Maintain backwards compatibility
- Preserve historical stage data
- Support manual and automatic progression

## Data Model

### Habit Object Changes

```javascript
{
  // Existing fields (unchanged)
  title: "Read daily",
  colorIndex: 0,
  iconTitle: "book",
  frequency: 1,  // keeps working for non-progressive habits
  completedDays: [...],
  creationDate: "...",

  // NEW: Optional progressive habit fields
  stages: {
    "stage-1": {
      description: "Read 1 page",
      order: 0
    },
    "stage-2": {
      description: "Read 2 pages",
      order: 1
    },
    "stage-3": {
      description: "Read 3 pages",
      order: 2
    }
  },
  currentStageId: "stage-1",
  progressionMode: "manual",  // "manual" | "completions" | "days"
  progressionThreshold: 7     // only used if mode is "completions" or "days"
}
```

### completedDays Changes

```javascript
completedDays: [
  {date: "2026-03-21", progress: 1, stageId: "stage-1"},  // NEW optional field
  {date: "2026-03-20", progress: 1}  // old entries without stageId still work
]
```

### Stage Structure

- **Key**: Unique ID (e.g., "stage-1", "stage-2")
- **description**: User-visible text (e.g., "Read 1 page")
- **order**: Numeric sort order (0, 1, 2...) - determines progression sequence

### Progression Modes

1. **manual**: User clicks "Next Stage" to advance
   - Optional: Disable button until threshold met when `progressionThreshold > 0`

2. **completions**: Auto-advance after N completions in current stage
   - Count: `completedDays.filter(d => d.stageId === currentStageId).length`

3. **days**: Auto-advance after N calendar days in current stage
   - Count: Days from first completion with `currentStageId` to today

### Backwards Compatibility

- Habits without `stages` behave as before
- Completions without `stageId` count as "no stage"
- Existing habits work without migration

### Graceful Fallbacks

- Treat non-existent `stageId` as `undefined`
- Default invalid `currentStageId` to first stage (or null)
- Equality checks filter out invalid stageIds

## Core Logic & Functions

### New Utilities

1. **getOrderedStages(stages)** - Sort stages by `order` and return array
   ```javascript
   // Input: {stages: {"id-1": {order: 1, ...}, "id-2": {order: 0, ...}}}
   // Output: [{id: "id-2", ...}, {id: "id-1", ...}]
   ```

2. **getCurrentStageCompletions(completedDays, stageId, mode)** - Count completions/days for current stage
   ```javascript
   // mode="completions": count entries where stageId matches
   // mode="days": date diff from first entry with stageId to today
   // mode="manual": still count (for threshold check), but don't auto-progress
   ```

3. **shouldAutoProgress(habit)** - Determine if habit should advance
   ```javascript
   // Returns false for manual mode
   // Returns true when completions/days >= threshold
   ```

4. **getNextStageId(stages, currentStageId)** - Find next stage in order
   ```javascript
   // Returns null at last stage
   ```

5. **getPreviousStageId(stages, currentStageId)** - Find previous stage in order
   ```javascript
   // Returns null at first stage
   ```

6. **progressToNextStage(habit)** - Advance habit to next stage
   ```javascript
   // Updates currentStageId
   // Called automatically on completion (if auto-mode) or manually via menu
   ```

7. **progressToPreviousStage(habit)** - Go back to previous stage
   ```javascript
   // Updates currentStageId
   ```

### Modifications to Existing Functions

**updateHabitProgress.js**
- Include `stageId: habit.currentStageId` in new completedDay entries
- Check `shouldAutoProgress()` and advance if needed

**habitsReducer.js**
- Add new action types:
  - `'progressStageNext'` - manually advance to next stage
  - `'progressStagePrevious'` - manually go back to previous stage
  - `'updateStages'` - save edited stages from HabitEditor

## UI Changes

### HabitEditor (Edit/Create Habit)

Add optional section after FrequencyBlock, before OrderBlock:

**ProgressiveStagesBlock Component:**
- Checkbox: "Enable progressive stages"
- If enabled, show:
  - List of stages with:
    - Description text input
    - Order number input (conflicts handled by natural JS object iteration order)
  - Add/Delete stage buttons
  - Dropdown: Progression mode (manual/completions/days)
  - Number input: Threshold

### Habit Display

**Current stage info (where `Streak: X, Notes: Y` is shown):**
```jsx
{habit.stages && stages[currentStageId] && (
  <>Stage: {stages[currentStageId].description} </>
)}
Streak: {streak} Notes: {notesCount}
```

### HabitMenu

Add stage control menu items (show only if `habit.stages` exists):

**"Next Stage" menu item:**
- Hide at last stage (`getNextStageId() === null`)
- Disable when `progressionMode === "manual"` with `threshold > 0` unmet

**"Previous Stage" menu item:**
- Hide at first stage (`getPreviousStageId() === null`)

### Statistics Page

Add chart after "Total Completed": **"Completed per Stage"**
- Show only if `habit.stages` exists
- X-axis: Stage descriptions (ordered) + "No stage"
- Y-axis: Completion count
- "No stage": entries where `!stageId || !stages[stageId]`

## Implementation Plan

### New Files to Create

1. `src/utils/getOrderedStages.js` - Sort stages by order field
2. `src/utils/getCurrentStageCompletions.js` - Count completions/days for stage
3. `src/utils/shouldAutoProgress.js` - Check if auto-progression should trigger
4. `src/utils/getNextStageId.js` - Find next stage in order
5. `src/utils/getPreviousStageId.js` - Find previous stage in order
6. `src/utils/progressToNextStage.js` - Advance to next stage
7. `src/utils/progressToPreviousStage.js` - Go back to previous stage
8. `src/components/HabitEditor/ProgressiveStagesBlock.jsx` - Stage editor UI

### Files to Modify

1. `src/utils/updateHabitProgress.js` - Add stageId to new completions, check auto-progress
2. `src/utils/habitsReducer.js` - Add action types: `'progressStageNext'`, `'progressStagePrevious'`, `'updateStages'`
3. `src/components/HabitEditor/HabitEditor.jsx` - Add ProgressiveStagesBlock component
4. `src/components/Habit/HabitHeader.jsx` (or wherever Streak/Notes display) - Show current stage
5. `src/components/Habit/HabitMenu.jsx` - Add Next/Previous Stage menu items
6. `src/components/Statistics/Statistics.jsx` - Add "Completed per Stage" chart

## Open Questions / Decisions Made

- ✅ Stage reassignment for old completions: SKIPPED (too complex, no good UX pattern)
- ✅ Stage conflict resolution: Use natural JavaScript object iteration order (no special handling)
- ✅ Stage reordering: Use `order` field instead of linked list `nextStage` pointers
- ✅ Manual mode threshold: Optional - if `threshold > 0`, disable "Next Stage" until met
- ✅ History preservation: Store `stageId` in each completedDay entry
