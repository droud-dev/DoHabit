---
name: Check-In Note Input
description: Implementing a temporary inline note input that appears after habit progress taps — key-based force-remount, 6s auto-close timer with focus cancellation, no-autofocus mobile pattern, AnimatePresence slide-in
topics: react, inline-input, animation, framer-motion, timer, diary, habit-progress, mobile-ux, force-remount
created: 2026-03-22
updated: 2026-03-22
scratchpad: .specs/scratchpad/7133c716.md
---

# Check-In Note Input

## Overview

After each forward progress tap, a lightweight inline input slides open between the habit header and the calendar. The user can type a note and submit (creates a diary entry) or ignore it (auto-closes in 6s). Progress updates immediately on tap — the note is entirely optional and non-blocking. The component uses React's `key` prop for force-remount to cleanly reset all internal state without imperative cleanup.

---

## Key Concepts

- **noteInputKey counter**: `useState(0)` in `Habit.jsx`. `0` = hidden. Any positive value = visible. Increment on forward tap, reset to `0` to close.
- **key-based force-remount**: `<NoteInput key={noteInputKey} />` — changing `key` causes React to destroy and recreate the component. Timer, input value, and focus state all reset automatically.
- **No autoFocus**: Critical for mobile. Virtual keyboard must NOT pop on every progress tap. User must explicitly tap the input field.
- **onFocus timer cancellation**: Timer starts on mount. First focus cancels it permanently — no restart on blur. Input stays open until explicit X or tick action.
- **onProgressTap optional prop**: Added to `HabitHeader`. Called only on forward taps (`!isTodayCompleted`). Uses `?.()` — safe when not provided.
- **addNote dispatch**: `habitsReducer` case already exists. Payload: `{ text, date: new Date(), streak: currentStreak }`.

---

## Documentation & References

| Resource | Description | Link |
|----------|-------------|------|
| Design document | Authoritative spec — UX flow, state design, trade-offs | `.specs/plans/check-in-note.design.md` |
| addNote utility | Pushes newNote to habit.diary array (untyped — any object) | `src/utils/addNote.js` |
| habitsReducer | `addNote` case: `habits = addNote(habits, habitTitle, action.newNote)` | `src/utils/habitsReducer.js` |
| Habit.jsx | State owner for noteInputKey, dispatches addNote | `src/components/Habit/Habit.jsx` |
| HabitHeader.jsx | Progress button, location of onProgressTap hook point | `src/components/Habit/HabitHeader.jsx` |
| HabitMenu.jsx | Reference for AnimatePresence pattern + variants defined outside component | `src/components/Habit/HabitMenu.jsx` |

---

## Files Changed

| File | Change Type | Summary |
|------|-------------|---------|
| `src/components/Habit/Habit.jsx` | Modify | Add `useHabitsStore` import; destructure `title`; add `noteInputKey` state + 3 handlers; render `NoteInput` in `AnimatePresence` |
| `src/components/Habit/HabitHeader.jsx` | Modify | Add `onProgressTap` optional prop; call after dispatch when `!isTodayCompleted` |
| `src/components/Habit/NoteInput.jsx` | New | Timer, no-autofocus input, X + input + tick layout, `colorPalette` theming |
| `src/css/NoteInput.module.css` | New | Flex row layout, inline style for `darkenedColor` background |

**No reducer changes needed** — `addNote` case already exists in `habitsReducer.js`.

---

## Patterns & Best Practices

### Pattern 1: Key-Based Force-Remount for Stateful Children

**When to use**: Parent needs to reset all child state (timer refs, input value, focus tracking) without passing reset callbacks or using `useImperativeHandle`.

**Trade-offs**: Clean API, zero cleanup code in parent. Tiny DOM cost (destroy+recreate) — irrelevant for small components. Alternative imperative reset via `forwardRef` is more complex and couples parent to child internals.

**Example**:
```jsx
// In Habit.jsx
const [noteInputKey, setNoteInputKey] = useState(0);

const handleProgressTap = () => setNoteInputKey(k => k + 1);
const handleNoteDismiss = () => setNoteInputKey(0);
const handleNoteSubmit = (text) => {
    habitsDispatch({
        type: 'addNote',
        habitTitle: title,
        newNote: { text, date: new Date(), streak: currentStreak }
    });
    setNoteInputKey(0);
};

// In JSX:
<AnimatePresence>
    {noteInputKey > 0 && (
        <NoteInput
            key={noteInputKey}
            onSubmit={handleNoteSubmit}
            onDismiss={handleNoteDismiss}
            colorPalette={colorPalette}
        />
    )}
</AnimatePresence>
```

### Pattern 2: Auto-Close Timer with Focus Cancellation

**When to use**: Inline UI element that should disappear after inactivity but stay open when user engages.

**Trade-offs**: `useRef` for timer avoids re-renders. Cleanup in `useEffect` return prevents stale callbacks (critical in React StrictMode where effects run twice). No restart after blur — once the user has focused the input, they have committed to typing.

**Example**:
```jsx
// In NoteInput.jsx
function NoteInput({ onSubmit, onDismiss, colorPalette }) {
    const [text, setText] = useState('');
    const timerRef = useRef(null);
    const { baseColor, darkenedColor } = colorPalette;

    useEffect(() => {
        timerRef.current = setTimeout(onDismiss, 6000);
        return () => clearTimeout(timerRef.current);
    }, [onDismiss]);

    const handleFocus = () => {
        clearTimeout(timerRef.current);
        // Do NOT restart timer — stays open until explicit action
    };

    return (
        <motion.div
            style={{ backgroundColor: darkenedColor }}
            className={styles.row}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
        >
            <button onClick={onDismiss} style={{ color: 'IndianRed' }}>
                <FaTimes />
            </button>
            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onFocus={handleFocus}
                // NO autoFocus — mobile keyboard must not pop automatically
            />
            <button
                onClick={() => onSubmit(text)}
                disabled={text.trim() === ''}
                style={{ color: baseColor }}
            >
                <FaCheck />
            </button>
        </motion.div>
    );
}
```

### Pattern 3: onProgressTap Hook in HabitHeader

**When to use**: Parent needs to react to a child's internal action without coupling to the child's dispatch mechanism.

**Trade-offs**: Optional prop with `?.()` is backward compatible. HabitHeader retains full ownership of its dispatch; parent just observes.

**Example**:
```js
// In HabitHeader.jsx — handleUpdateProgress, after habitsDispatch:
habitsDispatch({ type: 'updateProgress', habitTitle: title });

if (!isTodayCompleted) onProgressTap?.();
// isTodayCompleted = true means habit was already 100% → this tap is an undo → no input
// isTodayCompleted = false means any forward tap (partial or completing) → show input
```

### Pattern 4: useHabitsStore in Habit.jsx for Note Dispatch

**When to use**: `Habit.jsx` only needs `habitsDispatch` when the check-in note feature is added — it previously delegated all dispatch to children.

**Example**:
```js
// Add to Habit.jsx imports (// stores section):
import { useHabitsStore } from '../../stores/habitsStore';

// Add inside Habit() function:
const habitsDispatch = useHabitsStore((s) => s.habitsDispatch);

// Also explicitly destructure title (it was only in {...props} spread before):
const { index, color, completedDays, frequency, periodDays,
        isMenuVisible, isArchive, isNegative, creationDate,
        onShowMenu, title } = props;
```

---

## Common Pitfalls & Solutions

| Issue | Impact | Solution |
|-------|--------|----------|
| autoFocus on NoteInput | Critical — pops virtual keyboard on every tap | Never add `autoFocus` to the input element |
| Missing useEffect cleanup | Medium — stale timer fires onDismiss after unmount in StrictMode | Always `return () => clearTimeout(timerRef.current)` from useEffect |
| `title` not destructured in Habit.jsx | High — handleNoteSubmit references undefined | Explicitly destructure `title` from props in Habit.jsx |
| Missing useHabitsStore import in Habit.jsx | High — habitsDispatch is undefined | Add `import { useHabitsStore }` and `const habitsDispatch = useHabitsStore(...)` |
| NoteInput timer restarting on blur | Low — design says cancel permanently on first focus | Do NOT call setTimeout again in onBlur handler |
| Calling onProgressTap on undo taps | Medium — input shows when undoing progress | Guard: `if (!isTodayCompleted) onProgressTap?.()` — `isTodayCompleted` reflects state BEFORE the tap |
| CSS co-location | Low — violates project convention | Place NoteInput.module.css in `src/css/`, NOT in `src/components/Habit/` |
| Framer variants defined inside component | Low — causes unnecessary re-renders | Define motion variants as constants OUTSIDE the component function |
| Duplicate AnimatePresence for HabitMenu | None — valid concern | Two separate AnimatePresence wrappers (NoteInput + HabitMenu) are valid React |

---

## Rendering Position in Habit.jsx

```jsx
// Correct order inside the motion.div:
<HabitHeader
    {...{ ...props, colorPalette }}
    {...{ isTodayCompleted, todayProgress, currentStreak }}
    onProgressTap={handleProgressTap}
/>

<AnimatePresence>
    {noteInputKey > 0 && (
        <NoteInput
            key={noteInputKey}
            onSubmit={handleNoteSubmit}
            onDismiss={handleNoteDismiss}
            colorPalette={colorPalette}
        />
    )}
</AnimatePresence>

{!isArchive && (
    <div className={styles.content}>
        {calendar}
    </div>
)}

<AnimatePresence>
    {(isMenuVisible && !isArchive) && (
        <HabitMenu key="habitMenu" ... />
    )}
</AnimatePresence>
```

NoteInput is outside the `!isArchive` guard — safe because `onProgressTap` is only called from inside the `!isArchive`-guarded progress button in `HabitHeader`.

---

## NoteInput Component Structure

Props: `onSubmit(text)`, `onDismiss()`, `colorPalette`

No `forwardRef` needed. No `autoFocus`. No `key` prop management inside — parent handles that.

```
src/components/Habit/NoteInput.jsx   ← component
src/css/NoteInput.module.css         ← styles (NOT co-located)
```

CSS layout: `display: flex; align-items: center; gap: ...` with buttons at fixed size and input at `flex: 1`.

---

## Sources & Verification

| Source | Type | Last Verified |
|--------|------|---------------|
| `.specs/plans/check-in-note.design.md` | Design document (authoritative) | 2026-03-22 |
| `src/components/Habit/Habit.jsx` | Codebase | 2026-03-22 |
| `src/components/Habit/HabitHeader.jsx` | Codebase | 2026-03-22 |
| `src/components/Habit/HabitMenu.jsx` | Codebase | 2026-03-22 |
| `src/utils/addNote.js` | Codebase | 2026-03-22 |
| `src/utils/habitsReducer.js` | Codebase | 2026-03-22 |
| `src/css/HabitHeader.module.css` | Codebase | 2026-03-22 |

---

## Changelog

| Date | Changes |
|------|---------|
| 2026-03-22 | Initial creation for task: implement-check-in-note-on-progress.feature |
