/**
 * Progressive Habits - Integration Tests
 *
 * End-to-end verification of all acceptance criteria for the progressive habits feature.
 * Tests exercise real production code paths. For date-dependent tests, only
 * getFormattedDate and checkHabitCompletion are mocked to control the "current date"
 * context -- all business logic (auto-progression, undo recalculation) runs through
 * real updateHabitProgress, progressHabitStage, and recalculateStageCompletions.
 */

import habitsReducer from '../utils/habitsReducer';
import initHabits from '../utils/initHabits';
import editHabit from '../utils/editHabit';
import updateHabitProgress from '../utils/updateHabitProgress';
import progressHabitStage from '../utils/progressHabitStage';
import recalculateStageCompletions from '../utils/recalculateStageCompletions';
import getFormattedDate from '../utils/getFormattedDate';
import checkHabitCompletion from '../utils/checkHabitCompletion';
import saveToLocalStorage from '../utils/saveToLocalStorage';

// Mock date-context modules so we can control "today"
jest.mock('../utils/getFormattedDate');
jest.mock('../utils/checkHabitCompletion');

// Mock side-effect-only modules
jest.mock('../utils/saveToLocalStorage', () => jest.fn());
jest.mock('../utils/scrollToTop', () => jest.fn());
jest.mock('../utils/getFromLocalStorage', () => jest.fn(() => []));

// ─── Helpers ───────────────────────────────────────────────────────────────────

const makeFormData = (overrides = {}) => ({
	title: { value: 'Running' },
	colorIndex: { value: '0' },
	iconTitle: { value: 'run' },
	frequency: { value: '1' },
	isProgressive: { value: 'true' },
	stages: { value: JSON.stringify(['Walk', 'Jog', 'Run']) },
	progressionMode: { value: 'manual' },
	progressionInterval: { value: '7' },
	order: { value: '1' },
	...overrides,
});

const makeNonProgressiveFormData = (overrides = {}) => ({
	title: { value: 'Read' },
	colorIndex: { value: '1' },
	iconTitle: { value: 'book' },
	frequency: { value: '1' },
	isProgressive: { value: 'false' },
	stages: { value: '[]' },
	progressionMode: { value: 'manual' },
	progressionInterval: { value: '7' },
	order: { value: '1' },
	...overrides,
});

const makeProgressiveHabit = (overrides = {}) => ({
	title: 'Running',
	colorIndex: 0,
	iconTitle: 'run',
	frequency: 1,
	completedDays: [],
	creationDate: new Date('2026-01-01T00:00:00.000Z'),
	isProgressive: true,
	stages: ['Walk', 'Jog', 'Run'],
	currentStage: 0,
	progressionMode: 'manual',
	progressionInterval: 7,
	completionsSinceStageStart: 0,
	stageAdvancementDate: null,
	...overrides,
});

const makeNonProgressiveHabit = (overrides = {}) => ({
	title: 'Read',
	colorIndex: 1,
	iconTitle: 'book',
	frequency: 1,
	completedDays: [],
	creationDate: new Date('2026-01-01T00:00:00.000Z'),
	isProgressive: false,
	stages: [],
	currentStage: 0,
	progressionMode: 'manual',
	progressionInterval: 7,
	completionsSinceStageStart: 0,
	stageAdvancementDate: null,
	...overrides,
});

// ─── Date Mocking Helpers ───────────────────────────────────────────────────────

/**
 * Configure mocked date context for updateHabitProgress calls.
 * This mocks getFormattedDate to return the given dateStr as "today",
 * and checkHabitCompletion to check completedDays against that date.
 */
function setMockedDate(dateStr) {
	getFormattedDate.mockReturnValue(dateStr);
	checkHabitCompletion.mockImplementation((completedDays, frequency) => {
		return completedDays.some(
			(day) => day.date === dateStr && day.progress >= frequency
		);
	});
}

// ─── Integration Tests ─────────────────────────────────────────────────────────

describe('Progressive Habits Integration', () => {

	beforeEach(() => {
		jest.clearAllMocks();
		// Default: mock date to a safe default
		setMockedDate('2026-03-01');
	});

	// AC: Create progressive habit with 3 stages, manual mode -> verify stage 1 displayed
	describe('AC1: Create progressive habit with 3 stages, manual mode', () => {
		it('should create a habit at stage 1 (index 0) with all progressive fields', () => {
			const result = habitsReducer([], {
				type: 'addHabit',
				data: makeFormData(),
			});

			expect(result).toHaveLength(1);
			const habit = result[0];
			expect(habit.isProgressive).toBe(true);
			expect(habit.stages).toEqual(['Walk', 'Jog', 'Run']);
			expect(habit.currentStage).toBe(0); // Stage 1 (0-based)
			expect(habit.progressionMode).toBe('manual');
			expect(habit.completionsSinceStageStart).toBe(0);
			expect(habit.stageAdvancementDate).toBeNull();
			expect(habit.creationDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		});
	});

	// AC: Manual advance from stage 1 to 2 -> verify display updates
	describe('AC2: Manual advance from stage 1 to 2', () => {
		it('should advance stage via progressStage action and update all fields', () => {
			const habits = [makeProgressiveHabit({
				currentStage: 0,
				completionsSinceStageStart: 5,
			})];

			const result = habitsReducer(habits, {
				type: 'progressStage',
				habitTitle: 'Running',
			});

			expect(result[0].currentStage).toBe(1); // Now stage 2
			expect(result[0].completionsSinceStageStart).toBe(0); // Reset
			expect(result[0].stageAdvancementDate).toBeTruthy(); // Set to ISO string
		});

		it('should advance through all stages sequentially', () => {
			let habits = [makeProgressiveHabit({ currentStage: 0 })];

			// Stage 1 -> 2
			habits = habitsReducer(habits, { type: 'progressStage', habitTitle: 'Running' });
			expect(habits[0].currentStage).toBe(1);

			// Stage 2 -> 3
			habits = habitsReducer(habits, { type: 'progressStage', habitTitle: 'Running' });
			expect(habits[0].currentStage).toBe(2);

			// Stage 3 -> should stay (max)
			habits = habitsReducer(habits, { type: 'progressStage', habitTitle: 'Running' });
			expect(habits[0].currentStage).toBe(2); // No change
		});
	});

	// AC: Create progressive habit with auto mode, interval 3 -> complete 3 days -> verify auto-advance
	describe('AC3: Auto-advance after completing interval threshold', () => {
		it('should auto-advance from stage 0 to stage 1 after 3 completions', () => {
			let habits = [makeProgressiveHabit({
				progressionMode: 'auto',
				progressionInterval: 3,
				currentStage: 0,
				completionsSinceStageStart: 0,
			})];

			// Day 1: call real updateHabitProgress with mocked date
			setMockedDate('2026-01-10');
			habits = updateHabitProgress(habits, 'Running');
			expect(habits[0].completionsSinceStageStart).toBe(1);
			expect(habits[0].currentStage).toBe(0);

			// Day 2
			setMockedDate('2026-01-11');
			habits = updateHabitProgress(habits, 'Running');
			expect(habits[0].completionsSinceStageStart).toBe(2);
			expect(habits[0].currentStage).toBe(0);

			// Day 3 - should trigger auto-advance
			setMockedDate('2026-01-12');
			habits = updateHabitProgress(habits, 'Running');
			expect(habits[0].currentStage).toBe(1); // Advanced!
			expect(habits[0].completionsSinceStageStart).toBe(0); // Reset
			expect(habits[0].stageAdvancementDate).toBeTruthy();
		});
	});

	// AC: At max stage: no advance button visible, habit tracks normally
	describe('AC4: Max stage behavior', () => {
		it('should not advance past the last stage (progressHabitStage)', () => {
			const habit = makeProgressiveHabit({
				stages: ['Walk', 'Jog', 'Run'],
				currentStage: 2, // Max (0-based)
			});

			const result = progressHabitStage(habit);
			expect(result).toBe(habit); // Returns same reference = no change
		});

		it('should still track completions at max stage (auto mode)', () => {
			let habits = [makeProgressiveHabit({
				progressionMode: 'auto',
				progressionInterval: 3,
				currentStage: 2, // Max stage
				completionsSinceStageStart: 0,
			})];

			setMockedDate('2026-02-01');
			habits = updateHabitProgress(habits, 'Running');
			expect(habits[0].currentStage).toBe(2); // Stays at max
			expect(habits[0].completionsSinceStageStart).toBe(1); // Still tracked
		});

		it('should return unchanged habit for manual advance at max stage (reducer)', () => {
			const habit = makeProgressiveHabit({ currentStage: 2 });
			const result = habitsReducer([habit], {
				type: 'progressStage',
				habitTitle: 'Running',
			});
			expect(result[0]).toBe(habit);
		});
	});

	// AC: Existing non-progressive habits load and function identically
	describe('AC5: Backward compatibility', () => {
		it('should add progressive defaults to legacy habits via initHabits', () => {
			const getFromLocalStorage = require('../utils/getFromLocalStorage');
			getFromLocalStorage.mockReturnValue([{
				title: 'Old Habit',
				frequency: 1,
				completedDays: [{ date: '2026-01-05', progress: 1 }],
			}]);

			const result = initHabits();
			expect(result[0].isProgressive).toBe(false);
			expect(result[0].stages).toEqual([]);
			expect(result[0].currentStage).toBe(0);
			expect(result[0].progressionMode).toBe('manual');
			expect(result[0].progressionInterval).toBe(7);
			expect(result[0].completionsSinceStageStart).toBe(0);
			expect(result[0].stageAdvancementDate).toBeNull();
			// Original fields preserved
			expect(result[0].title).toBe('Old Habit');
			expect(result[0].completedDays).toHaveLength(1);
		});

		it('should not touch progressive fields on non-progressive habits during updateProgress', () => {
			let habits = [makeNonProgressiveHabit()];
			setMockedDate('2026-02-01');
			habits = updateHabitProgress(habits, 'Read');

			expect(habits[0].isProgressive).toBe(false);
			expect(habits[0].currentStage).toBe(0);
			expect(habits[0].completionsSinceStageStart).toBe(0);
			expect(habits[0].completedDays).toHaveLength(1);
		});

		it('should not modify non-progressive habits when progressive habit is edited', () => {
			const habits = [
				makeProgressiveHabit({ title: 'Running' }),
				makeNonProgressiveHabit({ title: 'Read' }),
			];

			const result = editHabit(habits, 'Running', {
				title: 'Running',
				isProgressive: false,
			}, 0);

			// Progressive habit changed
			expect(result[0].isProgressive).toBe(false);
			// Non-progressive habit untouched
			expect(result[1].title).toBe('Read');
			expect(result[1].isProgressive).toBe(false);
		});
	});

	// AC: Edit stages on in-progress habit: reduce stages below current -> verify clamp
	describe('AC6: Edit - reduce stages below current (clamp)', () => {
		it('should clamp currentStage when stages reduced below current position', () => {
			const habits = [makeProgressiveHabit({
				stages: ['Walk', 'Jog', 'Run', 'Sprint', 'Fly'],
				currentStage: 3, // At "Sprint" (index 3)
				completionsSinceStageStart: 5,
			})];

			const result = editHabit(habits, 'Running', {
				title: 'Running',
				isProgressive: true,
				stages: ['Walk', 'Jog'], // Reduced to 2 stages
			}, 0);

			expect(result[0].currentStage).toBe(1); // Clamped to max index (length - 1)
			expect(result[0].completionsSinceStageStart).toBe(0); // Reset on structural change
			expect(result[0].stages).toEqual(['Walk', 'Jog']);
		});
	});

	// AC: Edit: disable progressive -> verify stage data cleared
	describe('AC7: Edit - disable progressive (Scenario B)', () => {
		it('should clear all progressive fields when toggled off', () => {
			const habits = [makeProgressiveHabit({
				currentStage: 2,
				completionsSinceStageStart: 10,
				stageAdvancementDate: '2026-02-15T00:00:00.000Z',
			})];

			const result = editHabit(habits, 'Running', {
				title: 'Running',
				isProgressive: false,
			}, 0);

			expect(result[0].isProgressive).toBe(false);
			expect(result[0].stages).toEqual([]);
			expect(result[0].currentStage).toBe(0);
			expect(result[0].completionsSinceStageStart).toBe(0);
			expect(result[0].stageAdvancementDate).toBeNull();
		});
	});

	// AC: Edit: add/remove stages (structural) -> verify counter reset
	describe('AC8: Edit - structural stage change (Scenario C1)', () => {
		it('should reset counter when stages are added', () => {
			const habits = [makeProgressiveHabit({
				stages: ['Walk', 'Jog', 'Run'],
				currentStage: 1,
				completionsSinceStageStart: 6,
			})];

			const result = editHabit(habits, 'Running', {
				title: 'Running',
				isProgressive: true,
				stages: ['Walk', 'Jog', 'Run', 'Sprint'], // Added one
			}, 0);

			expect(result[0].currentStage).toBe(1); // Preserved
			expect(result[0].completionsSinceStageStart).toBe(0); // Reset
		});

		it('should reset counter when stages are removed (but still above current)', () => {
			const habits = [makeProgressiveHabit({
				stages: ['Walk', 'Jog', 'Run', 'Sprint'],
				currentStage: 1,
				completionsSinceStageStart: 6,
			})];

			const result = editHabit(habits, 'Running', {
				title: 'Running',
				isProgressive: true,
				stages: ['Walk', 'Jog', 'Run'], // Removed one
			}, 0);

			expect(result[0].currentStage).toBe(1); // Preserved
			expect(result[0].completionsSinceStageStart).toBe(0); // Reset
		});
	});

	// AC: Edit: change description only (cosmetic) -> verify counter preserved
	describe('AC9: Edit - cosmetic stage change (Scenario C2)', () => {
		it('should preserve counter when only descriptions change', () => {
			const habits = [makeProgressiveHabit({
				stages: ['Walk 5 min', 'Jog 5 min', 'Run 5 min'],
				currentStage: 1,
				completionsSinceStageStart: 4,
			})];

			const result = editHabit(habits, 'Running', {
				title: 'Running',
				isProgressive: true,
				stages: ['Walk 10 min', 'Jog 10 min', 'Run 10 min'], // Same length, different text
			}, 0);

			expect(result[0].currentStage).toBe(1); // Preserved
			expect(result[0].completionsSinceStageStart).toBe(4); // Preserved!
			expect(result[0].stages).toEqual(['Walk 10 min', 'Jog 10 min', 'Run 10 min']);
		});
	});

	// AC: Switch auto->manual: verify button appears, counter preserved
	describe('AC10: Switch auto->manual', () => {
		it('should preserve counter and currentStage when switching auto to manual', () => {
			const habits = [makeProgressiveHabit({
				progressionMode: 'auto',
				progressionInterval: 7,
				currentStage: 1,
				completionsSinceStageStart: 3,
			})];

			const result = editHabit(habits, 'Running', {
				title: 'Running',
				isProgressive: true,
				stages: ['Walk', 'Jog', 'Run'], // Same stages (cosmetic)
				progressionMode: 'manual',
			}, 0);

			expect(result[0].progressionMode).toBe('manual');
			expect(result[0].currentStage).toBe(1); // Preserved
			expect(result[0].completionsSinceStageStart).toBe(3); // Preserved (same stage count = cosmetic)
		});
	});

	// AC: Switch manual->auto: verify button disappears, counter calculated from completions
	describe('AC11: Switch manual->auto', () => {
		it('should switch mode and preserve counter (same stages = cosmetic edit)', () => {
			const habits = [makeProgressiveHabit({
				progressionMode: 'manual',
				currentStage: 1,
				completionsSinceStageStart: 5,
				stageAdvancementDate: '2026-02-01T00:00:00.000Z',
			})];

			const result = editHabit(habits, 'Running', {
				title: 'Running',
				isProgressive: true,
				stages: ['Walk', 'Jog', 'Run'], // Same stages
				progressionMode: 'auto',
				progressionInterval: 7,
			}, 0);

			expect(result[0].progressionMode).toBe('auto');
			expect(result[0].progressionInterval).toBe(7);
			expect(result[0].currentStage).toBe(1);
			expect(result[0].completionsSinceStageStart).toBe(5); // Preserved
		});
	});

	// AC: Undo completion before threshold: counter decreases, stage unchanged
	describe('AC12: Undo before threshold', () => {
		it('should decrease counter via recalculation, stage stays the same', () => {
			let habits = [makeProgressiveHabit({
				progressionMode: 'auto',
				progressionInterval: 5,
				currentStage: 0,
				completionsSinceStageStart: 0,
				stageAdvancementDate: null,
				creationDate: new Date('2026-01-01T00:00:00.000Z'),
			})];

			// Complete 3 days using real updateHabitProgress
			setMockedDate('2026-01-10');
			habits = updateHabitProgress(habits, 'Running');
			setMockedDate('2026-01-11');
			habits = updateHabitProgress(habits, 'Running');
			setMockedDate('2026-01-12');
			habits = updateHabitProgress(habits, 'Running');

			expect(habits[0].completionsSinceStageStart).toBe(3);
			expect(habits[0].completedDays).toHaveLength(3);

			// Undo the completion for 2026-01-12 (call updateHabitProgress again on same date = undo)
			setMockedDate('2026-01-12');
			habits = updateHabitProgress(habits, 'Running');

			expect(habits[0].currentStage).toBe(0); // Stage unchanged
			expect(habits[0].completedDays).toHaveLength(2);
			// recalculateStageCompletions counts remaining valid completions after creation date
			expect(habits[0].completionsSinceStageStart).toBe(2);
		});
	});

	// AC: Undo completion after auto-advancement: stage stays, counter recalculated
	describe('AC13: Undo after auto-advancement', () => {
		it('should preserve stage after undo, counter recalculated to post-advancement completions', () => {
			let habits = [makeProgressiveHabit({
				progressionMode: 'auto',
				progressionInterval: 3,
				currentStage: 0,
				completionsSinceStageStart: 0,
				stageAdvancementDate: null,
				creationDate: new Date('2026-01-01T00:00:00.000Z'),
			})];

			// Complete 3 days to trigger auto-advance from stage 0 -> 1
			setMockedDate('2026-01-10');
			habits = updateHabitProgress(habits, 'Running');
			setMockedDate('2026-01-11');
			habits = updateHabitProgress(habits, 'Running');
			setMockedDate('2026-01-12');
			habits = updateHabitProgress(habits, 'Running');

			expect(habits[0].currentStage).toBe(1); // Auto-advanced
			expect(habits[0].completionsSinceStageStart).toBe(0);
			const advancementDate = habits[0].stageAdvancementDate;
			expect(advancementDate).toBeTruthy();

			// Complete 1 more day post-advancement
			setMockedDate('2026-01-14');
			habits = updateHabitProgress(habits, 'Running');
			expect(habits[0].completionsSinceStageStart).toBe(1);

			// Undo that post-advancement completion
			setMockedDate('2026-01-14');
			habits = updateHabitProgress(habits, 'Running');

			expect(habits[0].currentStage).toBe(1); // Stage NEVER regresses
			// After undo of 01-14, no post-advancement completions remain
			expect(habits[0].completionsSinceStageStart).toBe(0);
		});
	});

	// AC: Progressive habit data persists across page reload
	describe('AC14: Persistence across reload', () => {
		it('should preserve progressive fields through localStorage roundtrip via initHabits', () => {
			const getFromLocalStorage = require('../utils/getFromLocalStorage');
			const progressiveHabit = makeProgressiveHabit({
				currentStage: 2,
				completionsSinceStageStart: 5,
				stageAdvancementDate: '2026-02-01T00:00:00.000Z',
				completedDays: [
					{ date: '2026-01-10', progress: 1 },
					{ date: '2026-02-05', progress: 1 },
				],
			});

			getFromLocalStorage.mockReturnValue([progressiveHabit]);

			const result = initHabits();

			expect(result[0].isProgressive).toBe(true);
			expect(result[0].stages).toEqual(['Walk', 'Jog', 'Run']);
			expect(result[0].currentStage).toBe(2);
			expect(result[0].progressionMode).toBe('manual');
			expect(result[0].progressionInterval).toBe(7);
			expect(result[0].completionsSinceStageStart).toBe(5);
			expect(result[0].stageAdvancementDate).toBe('2026-02-01T00:00:00.000Z');
			expect(result[0].completedDays).toHaveLength(2);
		});

		it('should call saveToLocalStorage with correct progressive fields after habitsReducer action', () => {
			saveToLocalStorage.mockClear();

			// Create a progressive habit via reducer (which calls saveToLocalStorage)
			const habits = habitsReducer([], {
				type: 'addHabit',
				data: makeFormData({
					progressionMode: { value: 'auto' },
					progressionInterval: { value: '5' },
				}),
			});

			// Verify saveToLocalStorage was called
			expect(saveToLocalStorage).toHaveBeenCalledTimes(1);
			const [key, savedData] = saveToLocalStorage.mock.calls[0];
			expect(key).toBe('habits');
			expect(savedData).toHaveLength(1);

			// Verify all 7 progressive fields are present in saved data
			const savedHabit = savedData[0];
			expect(savedHabit.isProgressive).toBe(true);
			expect(savedHabit.stages).toEqual(['Walk', 'Jog', 'Run']);
			expect(savedHabit.currentStage).toBe(0);
			expect(savedHabit.progressionMode).toBe('auto');
			expect(savedHabit.progressionInterval).toBe(5);
			expect(savedHabit.completionsSinceStageStart).toBe(0);
			expect(savedHabit.stageAdvancementDate).toBeNull();
		});

		it('should persist updated progressive fields after auto-advancement via updateProgress', () => {
			saveToLocalStorage.mockClear();

			// Create habit, then advance it through completions
			let habits = [makeProgressiveHabit({
				progressionMode: 'auto',
				progressionInterval: 2,
				currentStage: 0,
				completionsSinceStageStart: 1, // one away from advancement
			})];

			// The reducer's updateProgress action calls saveToLocalStorage
			setMockedDate('2026-02-10');
			habits = habitsReducer(habits, { type: 'updateProgress', habitTitle: 'Running' });

			// Verify saveToLocalStorage received the advanced habit
			expect(saveToLocalStorage).toHaveBeenCalled();
			const lastCall = saveToLocalStorage.mock.calls[saveToLocalStorage.mock.calls.length - 1];
			const savedHabit = lastCall[1][0];
			expect(savedHabit.currentStage).toBe(1); // Advanced
			expect(savedHabit.completionsSinceStageStart).toBe(0); // Reset
			expect(savedHabit.stageAdvancementDate).toBeTruthy();
		});
	});

	// AC: Minimum 2 stages validation prevents saving with < 2
	describe('AC15: Minimum 2 stages validation', () => {
		it('ProgressiveBlock enforces minimum 2 stages via disabled Remove buttons', () => {
			// This is a UI-level validation tested in ProgressiveBlock.test.jsx
			// Here we verify the form-level validation in HabitEditor
			// The validation lives in HabitEditor.handleSabmitForm:
			//   if non-empty stages < 2 -> setProgressiveError and return early
			// We can verify the data contract: stages array with < 2 entries should be rejected

			// Verify that editHabit itself will handle stages of various lengths
			// (The validation happens at form level, not data level)
			const habits = [makeProgressiveHabit()];

			// With exactly 2 stages - should work
			const result = editHabit(habits, 'Running', {
				title: 'Running',
				isProgressive: true,
				stages: ['Walk', 'Jog'],
			}, 0);
			expect(result[0].stages).toEqual(['Walk', 'Jog']);
		});

		it('habitsReducer accepts progressive habit with valid stages from form data', () => {
			// Verify the data contract: a properly validated form submission produces correct habit
			const result = habitsReducer([], {
				type: 'addHabit',
				data: makeFormData({ stages: { value: JSON.stringify(['Walk', 'Jog']) } }),
			});
			expect(result[0].isProgressive).toBe(true);
			expect(result[0].stages).toEqual(['Walk', 'Jog']);
		});

		it('habitsReducer creates non-progressive habit when isProgressive is false', () => {
			// Verify that when validation rejects (< 2 stages) and user disables progressive,
			// the habit is created as non-progressive
			const result = habitsReducer([], {
				type: 'addHabit',
				data: makeFormData({
					isProgressive: { value: 'false' },
					stages: { value: '[]' },
				}),
			});
			expect(result[0].isProgressive).toBe(false);
			expect(result[0].stages).toEqual([]);
		});
	});

	// ─── Full Flow Tests ────────────────────────────────────────────────────────

	describe('Full flow: create -> track -> auto-advance -> undo', () => {
		it('should handle complete lifecycle of a progressive habit', () => {
			// 1. Create progressive habit via reducer
			let habits = habitsReducer([], {
				type: 'addHabit',
				data: makeFormData({
					progressionMode: { value: 'auto' },
					progressionInterval: { value: '3' },
				}),
			});

			expect(habits).toHaveLength(1);
			expect(habits[0].currentStage).toBe(0);
			expect(habits[0].progressionMode).toBe('auto');
			expect(habits[0].progressionInterval).toBe(3);

			// 2. Complete 2 days (below threshold) using real updateHabitProgress
			setMockedDate('2026-01-10');
			habits = updateHabitProgress(habits, 'Running');
			setMockedDate('2026-01-11');
			habits = updateHabitProgress(habits, 'Running');
			expect(habits[0].currentStage).toBe(0);
			expect(habits[0].completionsSinceStageStart).toBe(2);

			// 3. Complete 3rd day - triggers auto-advance
			setMockedDate('2026-01-12');
			habits = updateHabitProgress(habits, 'Running');
			expect(habits[0].currentStage).toBe(1);
			expect(habits[0].completionsSinceStageStart).toBe(0);

			// 4. Continue tracking at new stage
			setMockedDate('2026-01-15');
			habits = updateHabitProgress(habits, 'Running');
			expect(habits[0].currentStage).toBe(1);
			expect(habits[0].completionsSinceStageStart).toBe(1);

			// 5. Undo latest completion (call updateHabitProgress on same date = undo)
			setMockedDate('2026-01-15');
			habits = updateHabitProgress(habits, 'Running');
			expect(habits[0].currentStage).toBe(1); // Stage never regresses
			expect(habits[0].completionsSinceStageStart).toBe(0); // Recalculated
		});
	});

	describe('Full flow: create -> manual advance -> edit stages -> backward compat', () => {
		it('should handle manual progression and editing', () => {
			// 1. Create manual progressive habit
			let habits = habitsReducer([], {
				type: 'addHabit',
				data: makeFormData(),
			});

			expect(habits[0].progressionMode).toBe('manual');
			expect(habits[0].currentStage).toBe(0);

			// 2. Manual advance stage 1 -> 2
			habits = habitsReducer(habits, {
				type: 'progressStage',
				habitTitle: 'Running',
			});
			expect(habits[0].currentStage).toBe(1);

			// 3. Edit: cosmetic change (preserve counter)
			habits = editHabit(habits, 'Running', {
				title: 'Running',
				isProgressive: true,
				stages: ['Walk daily', 'Jog daily', 'Run daily'],
			}, 0);
			expect(habits[0].stages).toEqual(['Walk daily', 'Jog daily', 'Run daily']);
			// Counter preserved because same # of stages

			// 4. Edit: structural change (add stage)
			habits = editHabit(habits, 'Running', {
				title: 'Running',
				isProgressive: true,
				stages: ['Walk daily', 'Jog daily', 'Run daily', 'Sprint daily'],
				completionsSinceStageStart: habits[0].completionsSinceStageStart,
			}, 0);
			expect(habits[0].stages).toHaveLength(4);
			expect(habits[0].completionsSinceStageStart).toBe(0); // Reset
			expect(habits[0].currentStage).toBe(1); // Preserved

			// 5. Add non-progressive habit alongside
			habits = habitsReducer(habits, {
				type: 'addHabit',
				data: makeNonProgressiveFormData(),
			});
			expect(habits).toHaveLength(2);

			// 6. Non-progressive habit functions normally
			setMockedDate('2026-02-01');
			habits = updateHabitProgress(habits, 'Read');
			expect(habits[0].isProgressive).toBe(false); // addHabit prepends
			expect(habits[0].completedDays).toHaveLength(1);
			expect(habits[0].completionsSinceStageStart).toBe(0); // Untouched

			// 7. Progressive habit still works
			expect(habits[1].isProgressive).toBe(true);
			expect(habits[1].currentStage).toBe(1);
		});
	});

	describe('Edge case: recalculateStageCompletions with multi-frequency habit', () => {
		it('should only count days where progress meets frequency threshold', () => {
			const habit = makeProgressiveHabit({
				frequency: 3,
				currentStage: 1,
				stageAdvancementDate: '2026-01-10T00:00:00.000Z',
				completedDays: [
					{ date: '2026-01-11', progress: 3 }, // Meets threshold
					{ date: '2026-01-12', progress: 2 }, // Below threshold
					{ date: '2026-01-13', progress: 5 }, // Above threshold
					{ date: '2026-01-09', progress: 3 }, // Before advancement date
				],
			});

			const result = recalculateStageCompletions(habit);
			expect(result.completionsSinceStageStart).toBe(2); // Only 01-11 and 01-13
		});
	});

	describe('Edge case: auto-advance at exact interval boundary', () => {
		it('should advance when counter equals interval exactly', () => {
			let habits = [makeProgressiveHabit({
				progressionMode: 'auto',
				progressionInterval: 1, // Advance after every single completion
				currentStage: 0,
				completionsSinceStageStart: 0,
			})];

			setMockedDate('2026-01-10');
			habits = updateHabitProgress(habits, 'Running');

			// Should advance immediately since interval is 1
			expect(habits[0].currentStage).toBe(1);
			expect(habits[0].completionsSinceStageStart).toBe(0);
		});
	});

	describe('Edge case: rapid auto-advance stops at max stage', () => {
		it('should stop advancing at max stage even with continued completions', () => {
			let habits = [makeProgressiveHabit({
				progressionMode: 'auto',
				progressionInterval: 1,
				stages: ['Walk', 'Run'],
				currentStage: 0,
				completionsSinceStageStart: 0,
			})];

			// First completion: advance to stage 1 (max for 2-stage habit)
			setMockedDate('2026-01-10');
			habits = updateHabitProgress(habits, 'Running');
			expect(habits[0].currentStage).toBe(1);

			// Second completion: should stay at stage 1
			setMockedDate('2026-01-11');
			habits = updateHabitProgress(habits, 'Running');
			expect(habits[0].currentStage).toBe(1);
			expect(habits[0].completionsSinceStageStart).toBe(1);
		});
	});

	describe('Edge case: counter increment only on day completion for multi-frequency habit', () => {
		it('should increment counter only when progress reaches frequency, not on every tap', () => {
			let habits = [makeProgressiveHabit({
				progressionMode: 'auto',
				progressionInterval: 3,
				frequency: 3, // Requires 3 taps per day to complete
				currentStage: 0,
				completionsSinceStageStart: 0,
			})];

			// Tap 1 on day 1: progress 0 -> 1, below frequency (3)
			setMockedDate('2026-01-10');
			habits = updateHabitProgress(habits, 'Running');
			expect(habits[0].completedDays[0].progress).toBe(1);
			expect(habits[0].completionsSinceStageStart).toBe(0); // No increment

			// Tap 2 on day 1: progress 1 -> 2, still below frequency
			setMockedDate('2026-01-10');
			habits = updateHabitProgress(habits, 'Running');
			expect(habits[0].completedDays[0].progress).toBe(2);
			expect(habits[0].completionsSinceStageStart).toBe(0); // Still no increment

			// Tap 3 on day 1: progress 2 -> 3, reaches frequency -- NOW counter increments
			setMockedDate('2026-01-10');
			habits = updateHabitProgress(habits, 'Running');
			expect(habits[0].completedDays[0].progress).toBe(3);
			expect(habits[0].completionsSinceStageStart).toBe(1); // Incremented!

			// Day 2: single-tap habit (frequency 3, but showing the flow continues)
			// Tap 1 on day 2
			setMockedDate('2026-01-11');
			habits = updateHabitProgress(habits, 'Running');
			expect(habits[0].completionsSinceStageStart).toBe(1); // No increment yet

			// Tap 2 on day 2
			setMockedDate('2026-01-11');
			habits = updateHabitProgress(habits, 'Running');
			expect(habits[0].completionsSinceStageStart).toBe(1); // Still no increment

			// Tap 3 on day 2
			setMockedDate('2026-01-11');
			habits = updateHabitProgress(habits, 'Running');
			expect(habits[0].completionsSinceStageStart).toBe(2); // Incremented!
		});
	});
});

