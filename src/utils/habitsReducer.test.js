import habitsReducer from './habitsReducer';
import progressHabitStage from './progressHabitStage';

// Mock saveToLocalStorage to prevent side effects
jest.mock('./saveToLocalStorage', () => jest.fn());
// Mock scrollToTop to prevent side effects
jest.mock('./scrollToTop', () => jest.fn());

const makeProgressiveHabit = (overrides = {}) => ({
	title: 'Progressive Habit',
	colorIndex: 0,
	iconTitle: 'star',
	frequency: 1,
	completedDays: [],
	creationDate: new Date('2026-01-01'),
	isProgressive: true,
	stages: ['Stage 1', 'Stage 2', 'Stage 3'],
	currentStage: 0,
	progressionMode: 'manual',
	progressionInterval: 7,
	completionsSinceStageStart: 0,
	stageAdvancementDate: null,
	...overrides,
});

const makeNonProgressiveHabit = (overrides = {}) => ({
	title: 'Regular Habit',
	colorIndex: 1,
	iconTitle: 'check',
	frequency: 1,
	completedDays: [],
	creationDate: new Date('2026-01-01'),
	isProgressive: false,
	stages: [],
	currentStage: 0,
	progressionMode: 'manual',
	progressionInterval: 7,
	completionsSinceStageStart: 0,
	stageAdvancementDate: null,
	...overrides,
});

describe('habitsReducer', () => {
	describe('progressStage action', () => {
		it('should advance the correct habit stage via progressHabitStage', () => {
			const habits = [
				makeProgressiveHabit({ title: 'Meditation', currentStage: 0 }),
				makeNonProgressiveHabit({ title: 'Exercise' }),
			];

			const result = habitsReducer(habits, {
				type: 'progressStage',
				habitTitle: 'Meditation',
			});

			expect(result[0].currentStage).toBe(1);
			expect(result[0].completionsSinceStageStart).toBe(0);
		});

		it('should leave non-matching habits unchanged', () => {
			const otherHabit = makeNonProgressiveHabit({ title: 'Exercise' });
			const habits = [
				makeProgressiveHabit({ title: 'Meditation', currentStage: 0 }),
				otherHabit,
			];

			const result = habitsReducer(habits, {
				type: 'progressStage',
				habitTitle: 'Meditation',
			});

			expect(result[1]).toBe(otherHabit);
		});

		it('should not advance a non-progressive habit even if title matches', () => {
			const habit = makeNonProgressiveHabit({ title: 'Exercise' });
			const habits = [habit];

			const result = habitsReducer(habits, {
				type: 'progressStage',
				habitTitle: 'Exercise',
			});

			// progressHabitStage returns unchanged habit when !isProgressive
			expect(result[0]).toBe(habit);
		});

		it('should not advance past the last stage', () => {
			const habit = makeProgressiveHabit({
				title: 'Meditation',
				currentStage: 2,
				stages: ['Stage 1', 'Stage 2', 'Stage 3'],
			});
			const habits = [habit];

			const result = habitsReducer(habits, {
				type: 'progressStage',
				habitTitle: 'Meditation',
			});

			expect(result[0]).toBe(habit);
		});
	});

	describe('addHabit action with progressive fields', () => {
		const makeFormData = (overrides = {}) => ({
			title: { value: 'New Habit' },
			colorIndex: { value: '2' },
			iconTitle: { value: 'star' },
			frequency: { value: '3' },
			isProgressive: { value: 'true' },
			stages: { value: JSON.stringify(['Easy', 'Medium', 'Hard']) },
			progressionMode: { value: 'auto' },
			progressionInterval: { value: '14' },
			...overrides,
		});

		it('should include all 7 progressive fields from form data', () => {
			const data = makeFormData();
			const result = habitsReducer([], {
				type: 'addHabit',
				data,
			});

			const habit = result[0];
			expect(habit.title).toBe('New Habit');
			expect(habit.isProgressive).toBe(true);
			expect(habit.stages).toEqual(['Easy', 'Medium', 'Hard']);
			expect(habit.currentStage).toBe(0);
			expect(habit.progressionMode).toBe('auto');
			expect(habit.progressionInterval).toBe(14);
			expect(habit.completionsSinceStageStart).toBe(0);
			expect(habit.stageAdvancementDate).toBeNull();
		});

		it('should default to non-progressive values when fields are absent', () => {
			const data = {
				title: { value: 'Simple Habit' },
				colorIndex: { value: '1' },
				iconTitle: { value: 'check' },
				frequency: { value: '1' },
			};
			const result = habitsReducer([], {
				type: 'addHabit',
				data,
			});

			const habit = result[0];
			expect(habit.title).toBe('Simple Habit');
			expect(habit.isProgressive).toBe(false);
			expect(habit.stages).toEqual([]);
			expect(habit.currentStage).toBe(0);
			expect(habit.progressionMode).toBe('manual');
			expect(habit.progressionInterval).toBe(7);
			expect(habit.completionsSinceStageStart).toBe(0);
			expect(habit.stageAdvancementDate).toBeNull();
		});

		it('should still include creationDate and completedDays', () => {
			const data = makeFormData();
			const result = habitsReducer([], {
				type: 'addHabit',
				data,
			});

			const habit = result[0];
			expect(habit.creationDate).toBeInstanceOf(Date);
			expect(habit.completedDays).toEqual([]);
		});
	});
});
