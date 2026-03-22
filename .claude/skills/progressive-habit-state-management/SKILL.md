---
name: Progressive Habit State Management
description: Managing progressive/staged habits in React with Zustand, localStorage persistence, error handling, and accessibility
topics: react, zustand, localstorage, progressive-habits, state-management, accessibility, error-handling
created: 2026-03-21
updated: 2026-03-21
scratchpad: .specs/scratchpad/9c397a21.md
---

# Progressive Habit State Management

## Overview

Progressive habits allow users to gradually increase habit difficulty through ordered stages (e.g., "Read 1 page" → "Read 2 pages" → "Read 3 pages"). This skill covers implementing stage-based progression in React applications using Zustand for state management, localStorage for persistence, with comprehensive error handling, accessibility patterns, and testing strategies for production readiness.

Based on Atomic Habits behavioral science principles: start ridiculously easy, progress gradually, build consistency before increasing difficulty.

---

## Key Concepts

- **Progressive Stages**: Ordered difficulty levels that users advance through at their own pace
- **Linear Progression**: Simple numeric increment model (stage 1 → 2 → 3) vs complex custom stage definitions
- **Progression Modes**: Manual (user-triggered), time-based (every N days), count-based (every N completions)
- **Backward Compatibility**: New optional fields allow existing data to work without modification
- **Graceful Degradation**: App functions even when localStorage fails or is unavailable
- **Error Boundaries**: Isolate failures to prevent full app crashes
- **Cross-Tab Sync**: Handle concurrent updates when multiple browser tabs are open
- **Schema Versioning**: Safely migrate data as schema evolves over time

---

## Documentation & References

| Resource | Description | Link |
|----------|-------------|------|
| Atomic Habits | Behavioral science foundation for gradual progression | [Summary](https://jamesclear.com/atomic-habits-summary) |
| Zustand Docs | Official state management library documentation | [Docs](https://zustand.docs.pmnd.rs/) |
| Zustand Testing | Official testing guide for Zustand stores | [Guide](https://zustand.docs.pmnd.rs/guides/testing) |
| React Accessibility | Official React accessibility guidelines | [Docs](https://legacy.reactjs.org/docs/accessibility.html) |
| React Aria | Accessible component patterns | [Docs](https://react-spectrum.adobe.com/react-aria/accessibility.html) |
| MDN Storage API | Browser storage quotas and limitations | [Docs](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) |
| localStorage Errors | Comprehensive error handling guide | [Article](https://mmazzarolo.com/blog/2022-06-25-local-storage-status/) |
| useSyncExternalStore | React 18+ pattern for external storage sync | [Yeti Guide](https://www.yeti.co/blog/managing-persistent-browser-data-with-usesyncexternalstore) |

---

## Recommended Libraries & Tools

| Name | Purpose | Version | Notes |
|------|---------|---------|-------|
| React | UI framework | 18.3.1 | Required for useSyncExternalStore |
| Zustand | State management | 5.0.1 | Minimal boilerplate, built-in persistence |
| React Testing Library | Component testing | Latest | Test behavior, not implementation |
| useSyncExternalStore | External state sync | Built-in React 18+ | No external dependency needed |

### Recommended Stack

For progressive habit tracking in React PWAs:
- **React**: 18.3.1 (required for useSyncExternalStore, concurrent rendering)
- **Zustand**: 5.0.1 (state management with persist middleware)
- **Error Handling**: Try-catch wrappers + error boundaries for graceful degradation
- **Security**: Input sanitization, output escaping, CSP headers
- **Testing**: React Testing Library + Zustand test utilities
- **Accessibility**: Native ARIA attributes (role, aria-live, aria-label)
- **No additional dependencies needed** - React 18+ built-in features cover requirements

---

## Patterns & Best Practices

### Pattern 1: Optional Fields for Backward Compatibility

**When to use**: Adding new features to existing data structures without breaking old data

**Trade-offs**:
- Pros: Zero migration needed, old data works immediately, gradual adoption
- Cons: Must handle undefined everywhere, slightly more complex logic

**Example**:
```javascript
// New habit with progressive stages
{
  title: "Read daily",
  frequency: 1,
  currentStage: 1,        // Optional - undefined for non-progressive
  maxStage: 5,            // Optional - undefined for unlimited
  stageIncrement: 1       // Optional - default 1
}

// Old habit (still works)
{
  title: "Exercise",
  frequency: 3
  // No stage fields - non-progressive habit
}

// Utility handles both
function calculateEffectiveFrequency(habit) {
  if (!habit.currentStage) return habit.frequency; // Old habit
  return habit.frequency + (habit.currentStage - 1) * (habit.stageIncrement || 1);
}
```

### Pattern 2: localStorage Error Handling with Quota Detection

**When to use**: All localStorage write operations in production apps

**Trade-offs**:
- Pros: Prevents app crashes, handles private browsing, user-friendly
- Cons: Adds try-catch overhead, need fallback strategy

**Example**:
```javascript
function isQuotaExceeded(err) {
  return (
    err instanceof DOMException &&
    (err.code === 22 ||
     err.code === 1014 ||
     err.name === 'QuotaExceededError' ||
     err.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
}

function saveToLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return { success: true };
  } catch (err) {
    if (isQuotaExceeded(err)) {
      console.warn('Storage quota exceeded, attempting cleanup...');
      // Try clearing old data
      const trimmed = trimOldCompletions(data);
      try {
        localStorage.setItem(key, JSON.stringify(trimmed));
        return { success: true, trimmed: true };
      } catch (retryErr) {
        console.error('Still exceeding quota after cleanup');
        return { success: false, error: 'quota', inMemoryMode: true };
      }
    } else {
      // Private browsing or other error
      console.error('Storage unavailable:', err);
      return { success: false, error: 'unavailable', inMemoryMode: true };
    }
  }
}
```

### Pattern 3: Accessible Progress Indicators with ARIA

**When to use**: Displaying current stage/progress to users

**Trade-offs**:
- Pros: Screen reader support, standards-compliant, semantic
- Cons: Verbose markup, testing complexity

**Example**:
```javascript
function StageIndicator({ habit }) {
  const { currentStage, maxStage } = habit;

  if (!currentStage) return null; // Non-progressive habit

  const label = maxStage
    ? `Current stage: ${currentStage} of ${maxStage}`
    : `Current stage: ${currentStage}`;

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label}
      className={styles.stageBadge}
    >
      Stage {currentStage}{maxStage && `/${maxStage}`}
    </span>
  );
}

function ProgressButton({ habit, onProgress }) {
  const isAtMax = habit.maxStage && habit.currentStage >= habit.maxStage;

  return (
    <button
      onClick={onProgress}
      disabled={isAtMax}
      aria-label="Advance to next stage"
      aria-disabled={isAtMax}
    >
      Next Stage
    </button>
  );
}
```

### Pattern 4: Cross-Tab Synchronization with Timestamp Merge

**When to use**: Apps that may be open in multiple browser tabs

**Trade-offs**:
- Pros: Real-time sync across tabs, preserves non-conflicting changes
- Cons: Only fires in OTHER tabs (not same tab), requires lastModified timestamp

**Example**:
```javascript
// In Zustand store setup
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'habits-storage' && event.newValue) {
      try {
        const remote = JSON.parse(event.newValue);
        const current = useHabitsStore.getState();

        // Merge habits by timestamp (per-habit conflict resolution)
        const merged = mergeHabits(current.habits, remote.state.habits);

        useHabitsStore.setState({ habits: merged });
      } catch (err) {
        console.error('Failed to sync from other tab:', err);
        // Don't crash - just skip sync
      }
    }
  });
}

/**
 * Merges local and remote habits, resolving conflicts by timestamp
 * - New habits from either side are preserved
 * - Conflicting habits (same title): newer lastModified wins
 */
function mergeHabits(localHabits, remoteHabits) {
  const habitMap = new Map();

  // Add all local habits to map
  localHabits.forEach(habit => habitMap.set(habit.title, habit));

  // Merge remote habits
  remoteHabits.forEach(remoteHabit => {
    const localHabit = habitMap.get(remoteHabit.title);

    if (!localHabit) {
      // New habit from other tab - add it
      habitMap.set(remoteHabit.title, remoteHabit);
    } else {
      // Conflict - compare timestamps
      const localTime = new Date(localHabit.lastModified || 0).getTime();
      const remoteTime = new Date(remoteHabit.lastModified || 0).getTime();

      if (remoteTime > localTime) {
        // Remote is newer - replace local
        habitMap.set(remoteHabit.title, remoteHabit);
      }
      // Else keep local version (newer or equal)
    }
  });

  return Array.from(habitMap.values());
}
```

**Important**: Every habit mutation must update `lastModified`:
```javascript
case 'editHabit':
  return habits.map(h =>
    h.title === oldTitle
      ? { ...newHabit, lastModified: new Date().toISOString() }
      : h
  );
```

### Pattern 5: Schema Versioning with Migration

**When to use**: When schema changes over time and old data needs transformation

**Trade-offs**:
- Pros: Explicit versioning, migration history, testable
- Cons: Added complexity, migration code stays forever

**Example**:
```javascript
const SCHEMA_VERSION = 2;

const migrations = {
  1: (habit) => ({
    ...habit,
    creationDate: habit.creationDate || new Date()
  }),
  2: (habit) => ({
    ...habit,
    currentStage: undefined,  // Add new fields with safe defaults
    maxStage: undefined,
    stageIncrement: 1
  })
};

function migrateHabit(habit, fromVersion, toVersion) {
  let migrated = { ...habit };
  for (let v = fromVersion + 1; v <= toVersion; v++) {
    if (migrations[v]) {
      migrated = migrations[v](migrated);
    }
  }
  return migrated;
}

function loadHabits() {
  try {
    const stored = localStorage.getItem('habits');
    if (!stored) return { version: SCHEMA_VERSION, data: [] };

    const parsed = JSON.parse(stored);
    const currentVersion = parsed.version || 0;

    if (currentVersion < SCHEMA_VERSION) {
      console.log(`Migrating from v${currentVersion} to v${SCHEMA_VERSION}`);
      const migrated = parsed.data.map(h =>
        migrateHabit(h, currentVersion, SCHEMA_VERSION)
      );
      return { version: SCHEMA_VERSION, data: migrated };
    }

    return parsed;
  } catch (err) {
    console.error('Migration failed, resetting to defaults:', err);
    return { version: SCHEMA_VERSION, data: [] };
  }
}
```

---

## Error Handling & Resilience

### Critical Error Scenarios

| Error | Impact | Detection | Mitigation |
|-------|--------|-----------|------------|
| QuotaExceededError | High - Can't save | Check err.name/code in catch | Trim old data, warn user, memory-only mode |
| Private browsing | High - Storage disabled | Test setItem on init | In-memory mode with banner |
| Corrupted JSON | High - Parse crash | Try-catch on JSON.parse | Reset to defaults, clear storage |
| Cross-tab conflicts | Medium - Data loss | storage event listener | Timestamp-based per-habit merge |
| Concurrent renders | Medium - Hydration errors | React warnings | useSyncExternalStore |
| Missing fields | Low - Feature breaks | Check undefined | Provide defaults |
| Invalid types | Medium - Runtime errors | Validate on load | Sanitize or reject |

### Storage Availability Check

**Run on app initialization**:
```javascript
function isStorageAvailable() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

// In app initialization
const storageAvailable = isStorageAvailable();
if (!storageAvailable) {
  console.warn('localStorage unavailable - running in memory-only mode');
  showStorageWarningBanner();
}
```

### Error Boundary for Storage Operations

```javascript
import { Component } from 'react';

class StorageErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Storage error caught:', error, errorInfo);
    // Log to error tracking service (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Unable to load habits</h2>
          <p>Your browser's storage may be full or disabled.</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrap habit components
<StorageErrorBoundary>
  <HabitsList />
</StorageErrorBoundary>
```

**Important**: Error boundaries do NOT catch errors in event handlers. Use try-catch for onClick handlers.

---

## Security Considerations

### Threat Model

| Threat | Attack Vector | Impact | Mitigation |
|--------|---------------|--------|------------|
| **XSS via input fields** | `<script>alert('xss')</script>` in habit title | High - Code execution | Sanitize input, escape output |
| **HTML injection** | `<img src=x onerror=alert(1)>` in notes | Medium - Phishing | Strip HTML tags on write |
| **localStorage tampering** | User edits data in DevTools | Low - Self-harm only | Validate schema on read |
| **Type confusion** | Store object where string expected | Medium - App crash | Type validation on load |
| **Number overflow** | frequency = 999999999 | Low - UI breaks | Clamp to valid ranges |
| **Circular references** | Inject circular object structure | Medium - JSON crash | Catch stringify errors |

### Input Sanitization

**Sanitize all user inputs before storing**:
```javascript
function sanitizeHabitTitle(title) {
  if (typeof title !== 'string') return '';

  // Remove HTML tags
  const withoutHtml = title.replace(/<[^>]*>/g, '');

  // Trim whitespace
  const trimmed = withoutHtml.trim();

  // Limit length to prevent DoS
  return trimmed.slice(0, 100);
}

function sanitizeHabitNotes(notes) {
  if (typeof notes !== 'string') return '';

  // Remove script tags and event handlers
  const cleaned = notes
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

  return cleaned.slice(0, 5000); // Limit notes length
}

function validateFrequency(freq) {
  const num = Number(freq);

  // Type check
  if (!Number.isFinite(num)) return 1;

  // Range validation
  if (num < 1) return 1;
  if (num > 100) return 100; // Reasonable upper limit

  return Math.floor(num);
}
```

### Output Escaping

**Escape HTML when displaying user content**:
```javascript
function escapeHtml(text) {
  if (typeof text !== 'string') return '';

  const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };

  return text.replace(/[&<>"']/g, char => entityMap[char]);
}

// In React components - use textContent or escape manually
function HabitTitle({ habit }) {
  // SAFE - React escapes by default in JSX text
  return <h2>{habit.title}</h2>;

  // UNSAFE - Never do this with user input
  // return <h2 dangerouslySetInnerHTML={{ __html: habit.title }} />;
}
```

### Schema Validation

**Validate data structure loaded from localStorage**:
```javascript
function validateHabit(habit) {
  if (!habit || typeof habit !== 'object') {
    return { valid: false, reason: 'Not an object' };
  }

  // Required fields
  if (!habit.title || typeof habit.title !== 'string') {
    return { valid: false, reason: 'Invalid title' };
  }

  if (typeof habit.frequency !== 'number' || !Number.isFinite(habit.frequency)) {
    return { valid: false, reason: 'Invalid frequency' };
  }

  // Optional progressive fields
  if (habit.currentStage !== undefined) {
    if (typeof habit.currentStage !== 'number' || habit.currentStage < 1) {
      return { valid: false, reason: 'Invalid currentStage' };
    }
  }

  if (habit.maxStage !== undefined) {
    if (typeof habit.maxStage !== 'number' || habit.maxStage < 1) {
      return { valid: false, reason: 'Invalid maxStage' };
    }
  }

  return { valid: true };
}

function loadHabitsFromStorage() {
  try {
    const stored = localStorage.getItem('habits');
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    // Validate and filter out invalid habits
    return parsed.filter(habit => {
      const validation = validateHabit(habit);
      if (!validation.valid) {
        console.warn('Rejecting invalid habit:', validation.reason, habit);
        return false;
      }
      return true;
    });
  } catch (err) {
    console.error('Failed to load habits:', err);
    return [];
  }
}
```

### Content Security Policy

**Add CSP meta tag to prevent inline scripts**:
```html
<!-- In public/index.html -->
<meta
  http-equiv="Content-Security-Policy"
  content="
    default-src 'self';
    script-src 'self';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data:;
    connect-src 'self';
  "
>
```

**Important**: Never use `eval()`, `Function()`, or `dangerouslySetInnerHTML` with user data.

### Security Checklist

- [ ] Sanitize all text inputs (titles, notes) before storing
- [ ] Validate number inputs (frequency, stage) - clamp to valid ranges
- [ ] Escape HTML entities when rendering user content (or use React's default escaping)
- [ ] Type-check all fields loaded from localStorage
- [ ] Reject invalid habits during load (don't crash app)
- [ ] Use `textContent` not `innerHTML` for user-generated content
- [ ] Add Content Security Policy meta tag
- [ ] Never use `eval()`, `dangerouslySetInnerHTML`, `Function()` with localStorage data
- [ ] Limit array lengths (completedDays) to prevent memory DoS
- [ ] Catch JSON.stringify/parse errors (circular references, quota)

---

## Accessibility Guidelines

### ARIA Requirements Checklist

- [ ] **Stage indicators**: `role="status"`, `aria-live="polite"`, descriptive `aria-label`
- [ ] **Progress buttons**: `aria-label="Advance to next stage"`, proper `disabled` state
- [ ] **Form inputs**: Associated `<label>` elements or `aria-label`, `aria-describedby` for help text
- [ ] **Dynamic updates**: `aria-live` regions announce stage changes to screen readers
- [ ] **Keyboard navigation**: All interactive elements accessible via Tab, Enter, Space
- [ ] **Focus management**: Visible focus indicators, logical tab order
- [ ] **Color contrast**: Stage badges meet WCAG AA contrast ratios (4.5:1 text)

### Screen Reader Announcements

**Stage progression**:
```javascript
function announceStageChange(newStage, maxStage) {
  const message = maxStage
    ? `Advanced to stage ${newStage} of ${maxStage}`
    : `Advanced to stage ${newStage}`;

  // Create temporary aria-live region for announcement
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'assertive'); // Urgent update
  announcement.className = 'sr-only'; // Visually hidden
  announcement.textContent = message;

  document.body.appendChild(announcement);
  setTimeout(() => document.body.removeChild(announcement), 1000);
}
```

### Keyboard Shortcuts (Optional Enhancement)

```javascript
function useStageKeyboard(habit, onProgress) {
  useEffect(() => {
    function handleKeyPress(event) {
      // Ctrl/Cmd + Right Arrow = next stage
      if ((event.ctrlKey || event.metaKey) && event.key === 'ArrowRight') {
        if (habit.currentStage && !isAtMaxStage(habit)) {
          event.preventDefault();
          onProgress();
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [habit, onProgress]);
}
```

---

## Testing Strategies

### Unit Tests (Utilities)

```javascript
import { progressStage, calculateEffectiveFrequency } from './utils';

describe('progressStage', () => {
  it('should advance to next stage', () => {
    const habits = [
      { title: 'Read', currentStage: 1, maxStage: 3 }
    ];
    const result = progressStage(habits, 'Read');
    expect(result[0].currentStage).toBe(2);
  });

  it('should not progress beyond max stage', () => {
    const habits = [
      { title: 'Read', currentStage: 3, maxStage: 3 }
    ];
    const result = progressStage(habits, 'Read');
    expect(result[0].currentStage).toBe(3); // Unchanged
  });

  it('should ignore non-progressive habits', () => {
    const habits = [
      { title: 'Exercise', frequency: 3 } // No currentStage
    ];
    const result = progressStage(habits, 'Exercise');
    expect(result[0]).toEqual(habits[0]); // Unchanged
  });
});

describe('calculateEffectiveFrequency', () => {
  it('should apply stage multiplier', () => {
    const habit = { frequency: 1, currentStage: 3, stageIncrement: 2 };
    expect(calculateEffectiveFrequency(habit)).toBe(5); // 1 + (3-1)*2
  });

  it('should return base frequency for non-progressive', () => {
    const habit = { frequency: 5 };
    expect(calculateEffectiveFrequency(habit)).toBe(5);
  });
});
```

### Integration Tests (Zustand Store)

```javascript
import { renderHook, act } from '@testing-library/react';
import { useHabitsStore } from './habitsStore';

describe('Habits Store - Progressive Features', () => {
  beforeEach(() => {
    // Reset store between tests
    useHabitsStore.setState({ habits: [] });
    localStorage.clear();
  });

  it('should add habit with stages', () => {
    const { result } = renderHook(() => useHabitsStore());

    act(() => {
      result.current.addHabit({
        title: 'Read',
        frequency: 1,
        currentStage: 1,
        maxStage: 5,
        stageIncrement: 1
      });
    });

    expect(result.current.habits).toHaveLength(1);
    expect(result.current.habits[0].currentStage).toBe(1);
  });

  it('should persist to localStorage', () => {
    const { result } = renderHook(() => useHabitsStore());

    act(() => {
      result.current.addHabit({ title: 'Test', frequency: 1 });
    });

    const stored = JSON.parse(localStorage.getItem('habits-storage'));
    expect(stored.state.habits).toHaveLength(1);
  });

  it('should progress stage via dispatch', () => {
    const { result } = renderHook(() => useHabitsStore());

    act(() => {
      result.current.addHabit({
        title: 'Read',
        currentStage: 1,
        maxStage: 3
      });
    });

    act(() => {
      result.current.progressStage('Read');
    });

    expect(result.current.habits[0].currentStage).toBe(2);
  });
});
```

### Component Tests (React Testing Library)

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { HabitMenu } from './HabitMenu';

describe('HabitMenu - Stage Progression', () => {
  it('should show progress button for progressive habit', () => {
    const habit = { title: 'Read', currentStage: 1, maxStage: 3 };
    render(<HabitMenu habit={habit} onProgressStage={jest.fn()} />);

    expect(screen.getByLabelText('Advance to next stage')).toBeInTheDocument();
  });

  it('should hide progress button at max stage', () => {
    const habit = { title: 'Read', currentStage: 3, maxStage: 3 };
    render(<HabitMenu habit={habit} onProgressStage={jest.fn()} />);

    expect(screen.queryByLabelText('Advance to next stage')).not.toBeInTheDocument();
  });

  it('should call onProgressStage when button clicked', () => {
    const onProgress = jest.fn();
    const habit = { title: 'Read', currentStage: 1, maxStage: 3 };
    render(<HabitMenu habit={habit} onProgressStage={onProgress} />);

    fireEvent.click(screen.getByLabelText('Advance to next stage'));
    expect(onProgress).toHaveBeenCalledWith('Read');
  });

  it('should be keyboard accessible', () => {
    const onProgress = jest.fn();
    const habit = { title: 'Read', currentStage: 1, maxStage: 3 };
    render(<HabitMenu habit={habit} onProgressStage={onProgress} />);

    const button = screen.getByLabelText('Advance to next stage');
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(onProgress).toHaveBeenCalled();
  });
});
```

### Edge Case Tests

```javascript
describe('Edge Cases', () => {
  it('should handle corrupted localStorage', () => {
    localStorage.setItem('habits-storage', 'invalid json{');
    const { result } = renderHook(() => useHabitsStore());

    // Should fallback to empty array, not crash
    expect(result.current.habits).toEqual([]);
  });

  it('should handle quota exceeded gracefully', () => {
    // Mock quota exceeded error
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = jest.fn(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    const result = saveToLocalStorage('test', { large: 'data' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('quota');

    Storage.prototype.setItem = originalSetItem;
  });

  it('should migrate old habits without stages', () => {
    const oldHabits = [
      { title: 'Exercise', frequency: 3, creationDate: '2024-01-01' }
    ];
    localStorage.setItem('habits-storage', JSON.stringify({
      version: 1,
      state: { habits: oldHabits }
    }));

    const { result } = renderHook(() => useHabitsStore());

    // Should load with undefined stage fields
    expect(result.current.habits[0].currentStage).toBeUndefined();
    expect(result.current.habits[0].frequency).toBe(3);
  });
});
```

---

## Common Pitfalls & Solutions

| Issue | Impact | Solution |
|-------|--------|----------|
| **Not sanitizing user input** | XSS vulnerabilities | Strip HTML tags, validate types, escape on output |
| **Accessing localStorage during render** | Hydration mismatch, SSR errors | Use useSyncExternalStore or lazy initialization in useEffect |
| **Not handling quota exceeded** | App crash when saving | Wrap all setItem in try-catch, provide fallback |
| **Missing aria-label on dynamic content** | Screen readers can't announce changes | Add aria-live regions with descriptive labels |
| **No version field in schema** | Can't detect old data | Add version field from start, default to 0 for old data |
| **Event handlers in error boundaries** | Errors not caught | Use try-catch in onClick, error boundaries only catch render errors |
| **Cross-tab last-write-wins** | Data loss on concurrent edits | Use timestamp-based per-habit merge strategy |
| **Missing lastModified timestamp** | Can't resolve cross-tab conflicts | Add lastModified to schema, update on every mutation |
| **Required stage fields** | Breaks old habits | Make all new fields optional, provide defaults |
| **Complex custom stages** | Over-engineered, hard to maintain | Start with simple linear progression (stage 1, 2, 3) |
| **No keyboard access for buttons** | Inaccessible to keyboard users | Ensure buttons are native elements, not divs with onClick |
| **Forgetting to test migration** | Production data corruption | Write tests for each schema version migration path |
| **Using dangerouslySetInnerHTML** | XSS vulnerability | Never use with user data, rely on React's default escaping |

---

## Recommendations

1. **Security First**: Sanitize ALL user inputs before storing. Escape output when displaying. Never use `dangerouslySetInnerHTML` or `eval()` with user data. Add Content Security Policy.

2. **Start Simple**: Implement manual progression first (button click), add auto-progression in phase 2 if needed. Linear numeric stages beat custom stage objects.

3. **Error Handling**: Wrap ALL localStorage operations in try-catch before adding features. Test quota exceeded and private browsing scenarios.

4. **Accessibility from Day 1**: Add ARIA attributes during initial implementation, not as afterthought. Test with screen reader (VoiceOver/NVDA).

5. **Timestamp-Based Sync**: Add `lastModified` field to habits. Use per-habit timestamp merge for cross-tab sync instead of last-write-wins.

6. **Optional Fields Pattern**: New fields must be optional/undefined. Old data should work without modification or migration.

7. **useSyncExternalStore for React 18+**: Use React's built-in external store hook instead of custom localStorage sync logic. Handles concurrent rendering correctly.

8. **Version from Start**: Add version field to schema immediately, even if version 1. Makes future migrations trivial.

9. **Test Edge Cases**: Write tests for corrupted JSON, quota exceeded, missing fields, max stage boundaries, XSS attempts. Edge cases cause production failures.

10. **Monitor Storage Size**: Log localStorage usage in development. 5MB limit fills quickly with completion history.

---

## Implementation Guidance

### Installation

No additional packages required. Uses built-in React 18+ and browser APIs.

**Exact version requirements** (from package.json):
```bash
npm install react@18.3.1 react-dom@18.3.1 zustand@5.0.1
```

**Dependencies**:
- **React**: 18.3.1 (required for useSyncExternalStore, concurrent rendering)
- **React DOM**: 18.3.1 (must match React version)
- **Zustand**: 5.0.1 (state management with persist middleware)
- **Browser**: Modern browser with localStorage API support

**Note**: Caret ranges (^18.3.1) allow patch updates. Lock to exact versions if reproducibility critical.

### Configuration

**Zustand store with persistence**:
```javascript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useHabitsStore = create(
  persist(
    (set) => ({
      habits: [],
      addHabit: (habit) => set((state) => ({
        habits: [...state.habits, habit]
      })),
      progressStage: (habitTitle) => set((state) => ({
        habits: state.habits.map(h =>
          h.title === habitTitle && h.currentStage
            ? { ...h, currentStage: h.currentStage + 1 }
            : h
        )
      }))
    }),
    {
      name: 'habits-storage',
      version: 2,
      migrate: (persistedState, version) => {
        if (version < 2) {
          // Migration logic
          return {
            ...persistedState,
            habits: persistedState.habits.map(h => ({
              ...h,
              currentStage: undefined,
              maxStage: undefined
            }))
          };
        }
        return persistedState;
      }
    }
  )
);
```

### Integration Points

1. **habitsReducer.js**: Add `progressStage` action
2. **HabitEditor.jsx**: Add stage configuration fields (optional section)
3. **Habit.jsx**: Use `calculateEffectiveFrequency` for display
4. **HabitHeader.jsx**: Display stage badge with ARIA
5. **HabitMenu.jsx**: Add "Next Stage" button
6. **initHabits.js**: Handle migration/defaults
7. **New utilities**:
   - `progressStage.js`
   - `calculateEffectiveFrequency.js`
   - `migrateHabitSchema.js`
   - `isStorageAvailable.js`

---

## Code Examples

### Example 1: Robust localStorage Wrapper

```javascript
// utils/storage.js

/**
 * Safely saves data to localStorage with error handling
 * @param {string} key - Storage key
 * @param {any} data - Data to store (will be JSON.stringified)
 * @returns {Object} Result object with success status
 */
export function saveToLocalStorage(key, data) {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
    return { success: true };
  } catch (err) {
    if (isQuotaExceeded(err)) {
      console.warn('Storage quota exceeded');
      return { success: false, error: 'quota' };
    }
    console.error('Storage error:', err);
    return { success: false, error: 'unavailable' };
  }
}

/**
 * Safely loads data from localStorage with error handling
 * @param {string} key - Storage key
 * @param {any} defaultValue - Fallback if not found or error
 * @returns {any} Parsed data or default value
 */
export function getFromLocalStorage(key, defaultValue) {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;

    const parsed = JSON.parse(item);
    return parsed;
  } catch (err) {
    console.error('Failed to load from storage:', err);
    return defaultValue;
  }
}

/**
 * Checks if error is QuotaExceededError (cross-browser)
 */
function isQuotaExceeded(err) {
  return (
    err instanceof DOMException &&
    (err.code === 22 ||
     err.code === 1014 ||
     err.name === 'QuotaExceededError' ||
     err.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
}

/**
 * Tests if localStorage is available (handles private browsing)
 */
export function isStorageAvailable() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}
```

### Example 2: Progressive Habit Utilities

```javascript
// utils/progressStage.js

/**
 * Advances habit to next stage if applicable
 * @param {Array} habits - All habits
 * @param {string} habitTitle - Title of habit to progress
 * @returns {Array} Updated habits array
 */
export function progressStage(habits, habitTitle) {
  return habits.map(habit => {
    if (habit.title !== habitTitle) return habit;

    // Check if habit has stages enabled
    if (!habit.currentStage) {
      console.warn('Cannot progress non-progressive habit');
      return habit;
    }

    // Check if already at max stage
    if (habit.maxStage && habit.currentStage >= habit.maxStage) {
      console.warn('Habit already at max stage');
      return habit;
    }

    return {
      ...habit,
      currentStage: habit.currentStage + 1,
      lastProgression: new Date().toISOString()
    };
  });
}

// utils/calculateEffectiveFrequency.js

/**
 * Calculates effective frequency based on current stage
 * @param {Object} habit - The habit object
 * @returns {number} Effective frequency for current stage
 */
export function calculateEffectiveFrequency(habit) {
  if (!habit.currentStage) {
    return habit.frequency; // Non-progressive habit
  }

  const increment = habit.stageIncrement ?? 1;
  const effectiveFrequency = habit.frequency + (habit.currentStage - 1) * increment;

  return Math.max(1, effectiveFrequency); // Never less than 1
}

// utils/checkAutoProgression.js

/**
 * Checks if habit should auto-progress based on mode
 * @param {Object} habit - The habit object
 * @returns {boolean} Whether to progress automatically
 */
export function checkAutoProgression(habit) {
  if (!habit.currentStage || !habit.progressionMode) return false;
  if (habit.maxStage && habit.currentStage >= habit.maxStage) return false;

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

  return false; // Manual mode
}

function getDaysBetween(date1, date2) {
  const diffTime = Math.abs(date2 - date1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
```

### Example 3: Accessible Stage Display Component

```javascript
// components/StageIndicator.jsx
import { useMemo } from 'react';
import styles from './StageIndicator.module.css';

export function StageIndicator({ habit }) {
  const { currentStage, maxStage } = habit;

  // Don't render for non-progressive habits
  if (!currentStage) return null;

  const ariaLabel = useMemo(() => {
    return maxStage
      ? `Current stage: ${currentStage} of ${maxStage}`
      : `Current stage: ${currentStage}`;
  }, [currentStage, maxStage]);

  const displayText = maxStage ? `${currentStage}/${maxStage}` : currentStage;

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      className={styles.badge}
    >
      Stage {displayText}
    </span>
  );
}

// components/ProgressButton.jsx
export function ProgressButton({ habit, onProgress, className }) {
  const { currentStage, maxStage, title } = habit;

  // Don't render for non-progressive or max stage
  if (!currentStage || (maxStage && currentStage >= maxStage)) {
    return null;
  }

  const handleClick = () => {
    onProgress(title);
  };

  return (
    <button
      onClick={handleClick}
      className={className}
      aria-label={`Advance ${title} to next stage`}
      type="button"
    >
      <span aria-hidden="true">📈</span> Next Stage
    </button>
  );
}
```

### Example 4: Zustand Store Mock for Testing

```javascript
// __mocks__/zustand.ts
import { act } from '@testing-library/react';
import * as zustand from 'zustand';

const { create: actualCreate } = jest.requireActual('zustand');

// Store all reset functions to call after each test
export const storeResetFns = new Set<() => void>();

// Wrapper that tracks stores for reset
export const create = (<T>(createState: zustand.StateCreator<T>) => {
  const store = actualCreate(createState);
  const initialState = store.getState();

  storeResetFns.add(() => {
    store.setState(initialState, true);
  });

  return store;
}) as typeof zustand.create;

// Call in afterEach
export function resetAllStores() {
  act(() => {
    storeResetFns.forEach((resetFn) => resetFn());
  });
}

// In test setup
// afterEach(() => {
//   resetAllStores();
// });
```

### Example 5: Schema Migration with Validation

```javascript
// utils/migrateHabits.js

const CURRENT_VERSION = 2;

const migrations = {
  1: (habit) => ({
    ...habit,
    creationDate: habit.creationDate || new Date().toISOString()
  }),
  2: (habit) => ({
    ...habit,
    // Add progressive fields with safe defaults
    currentStage: undefined,
    maxStage: undefined,
    stageIncrement: 1,
    progressionMode: 'manual',
    progressionValue: undefined,
    lastProgression: undefined
  })
};

/**
 * Validates habit object has required fields
 */
function validateHabit(habit) {
  if (!habit || typeof habit !== 'object') return false;
  if (!habit.title || typeof habit.title !== 'string') return false;
  if (typeof habit.frequency !== 'number') return false;
  return true;
}

/**
 * Migrates single habit through version chain
 */
function migrateHabit(habit, fromVersion) {
  if (!validateHabit(habit)) {
    console.error('Invalid habit structure:', habit);
    return null;
  }

  let migrated = { ...habit };

  // Apply migrations sequentially
  for (let v = fromVersion + 1; v <= CURRENT_VERSION; v++) {
    if (migrations[v]) {
      migrated = migrations[v](migrated);
    }
  }

  return migrated;
}

/**
 * Migrates entire habits array from stored data
 */
export function migrateHabitsData(storedData) {
  try {
    if (!storedData) {
      return { version: CURRENT_VERSION, habits: [] };
    }

    const version = storedData.version || 0;
    const habits = storedData.habits || [];

    if (version === CURRENT_VERSION) {
      return storedData;
    }

    console.log(`Migrating habits from v${version} to v${CURRENT_VERSION}`);

    const migrated = habits
      .map(h => migrateHabit(h, version))
      .filter(Boolean); // Remove invalid habits

    return {
      version: CURRENT_VERSION,
      habits: migrated
    };
  } catch (err) {
    console.error('Migration failed, resetting to defaults:', err);
    return { version: CURRENT_VERSION, habits: [] };
  }
}
```

---

## Sources & Verification

### Behavioral Science
- [Atomic Habits Summary](https://jamesclear.com/atomic-habits-summary) - Last verified 2026-03-21
- [Atomic Habits 4 Laws](https://www.shortform.com/blog/atomic-habits-4-laws/) - Last verified 2026-03-21

### React & State Management
- [Zustand Official Docs](https://zustand.docs.pmnd.rs/) - Last verified 2026-03-21
- [Zustand Testing Guide](https://zustand.docs.pmnd.rs/guides/testing) - Last verified 2026-03-21
- [Global State Management with Zustand - OneUpTime Jan 2026](https://oneuptime.com/blog/post/2026-01-15-react-zustand-global-state-management/view)

### Error Handling & Storage
- [Handling localStorage errors - Matteo Mazzarolo](https://mmazzarolo.com/blog/2022-06-25-local-storage-status/) - Last verified 2026-03-21
- [Storage quotas - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) - Last verified 2026-03-21
- [localStorage Quota Exceeded - Medium](https://medium.com/@zahidbashirkhan/understanding-and-resolving-localstorage-quota-exceeded-errors-5ce72b1d577a)
- [TrackJS localStorage errors](https://trackjs.com/javascript-errors/failed-to-execute-setitem-on-storage/)

### Accessibility
- [React Accessibility](https://legacy.reactjs.org/docs/accessibility.html) - Official docs
- [React Aria Accessibility](https://react-spectrum.adobe.com/react-aria/accessibility.html) - Last verified 2026-03-21
- [PatternFly Progress Accessibility](https://www.patternfly.org/components/progress/accessibility/)
- [Accessible Forms in React - OneUpTime Jan 2026](https://oneuptime.com/blog/post/2026-01-15-accessible-forms-react-aria/view)
- [Accessibility in React - Medium Feb 2026](https://yakhil25.medium.com/accessibility-in-react-building-inclusive-web-apps-b01385aa4c06)

### Concurrent Updates & Sync
- [Stop Using localStorage Like This in React - Medium Jan 2026](https://medium.com/@hardlight/stop-using-localstorage-like-this-in-react-beac6351f5f1)
- [Managing Browser Data with useSyncExternalStore - Yeti](https://www.yeti.co/blog/managing-persistent-browser-data-with-usesyncexternalstore)
- [useSyncExternalStore for localStorage - Dev.to](https://dev.to/muhammed_fayazts_e35676/usesyncexternalstore-the-right-way-to-sync-react-with-localstorage-3c5f)

### Error Boundaries & Resilience
- [React Error Boundaries - OneUpTime Jan 2026](https://oneuptime.com/blog/post/2026-01-15-react-error-boundaries/view)
- [React Error Boundaries for Resilient UIs - OneUpTime Feb 2026](https://oneuptime.com/blog/post/2026-02-20-react-error-boundaries/view)
- [Error Boundaries Building Resilient Apps - Dev.to](https://dev.to/blamsa0mine/react-error-boundaries-building-resilient-applications-that-dont-crash-4kc5)

### Schema Migration
- [versioned-storage - GitHub](https://github.com/CatChen/versioned-storage) - Last verified 2026-03-21
- [Zustand localStorage migration - Dev.to](https://dev.to/diballesteros/how-to-migrate-zustand-local-storage-store-to-a-new-version-njp)
- [Redux Persist migration - freeCodeCamp](https://www.freecodecamp.org/news/how-to-use-redux-persist-when-migrating-your-states-a5dee16b5ead/)

### Security
- [localStorage Security Risks - OWASP](https://owasp.org/www-community/vulnerabilities/Insecure_Storage) - Last verified 2026-03-21
- [localStorage XSS - Acunetix](https://www.acunetix.com/blog/web-security-zone/xss-html5-local-storage/)
- [Client-side Storage Security - Snyk](https://snyk.io/blog/html5-web-storage-security/)
- [localStorage Security Best Practices - Medium](https://medium.com/@alexandrajansson_/security-best-practices-for-using-local-storage-in-web-applications-d6e5e5b2c5b4)

---

## Changelog

| Date | Changes |
|------|---------|
| 2026-03-21 | Initial creation for task: Implement progressive habits feature |
| 2026-03-21 | Added production-critical sections: error handling, accessibility, testing, runtime failures |
| 2026-03-21 | **FINAL FIXES**: Pinned exact versions (React 18.3.1, Zustand 5.0.1), added Security section (XSS prevention, input sanitization, CSP), improved cross-tab sync with timestamp-based per-habit merge |
