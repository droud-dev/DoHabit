import updateHabitProgress from './updateHabitProgress';
import getFormattedDate from './getFormattedDate';
import checkHabitCompletion from './checkHabitCompletion';
import progressHabitStage from './progressHabitStage';
import recalculateStageCompletions from './recalculateStageCompletions';

jest.mock('./getFormattedDate');
jest.mock('./checkHabitCompletion');
jest.mock('./progressHabitStage');
jest.mock('./recalculateStageCompletions');

describe('updateHabitProgress', () => {
	const makeHabit = (overrides = {}) => ({
		title: 'Test Habit',
		frequency: 1,
		completedDays: [],
		isProgressive: false,
		stages: [],
		currentStage: 0,
		progressionMode: 'auto',
		progressionInterval: 7,
		completionsSinceStageStart: 0,
		stageAdvancementDate: null,
		creationDate: '2025-03-01T00:00:00.000Z',
		...overrides,
	});

	beforeEach(() => {
		jest.clearAllMocks();

		// getFormattedDate always returns today's date
		getFormattedDate.mockReturnValue('2025-03-21');

		// checkHabitCompletion: check if today is completed in the provided completedDays
		checkHabitCompletion.mockImplementation((completedDays, frequency) => {
			return completedDays.some(
				(day) => day.date === '2025-03-21' && day.progress >= frequency
			);
		});

		// progressHabitStage: use actual implementation by default
		progressHabitStage.mockImplementation(
			jest.requireActual('./progressHabitStage').default
		);

		// recalculateStageCompletions: use actual implementation by default
		recalculateStageCompletions.mockImplementation(
			jest.requireActual('./recalculateStageCompletions').default
		);
	});

	// === Non-progressive habits should be unaffected ===

	it('should not modify progressive fields for non-progressive habits on progress', () => {
		const habit = makeHabit({
			isProgressive: false,
			completionsSinceStageStart: 0,
		});
		const result = updateHabitProgress([habit], 'Test Habit');

		expect(result[0].completedDays).toHaveLength(1);
		expect(result[0].completionsSinceStageStart).toBe(0);
		expect(progressHabitStage).not.toHaveBeenCalled();
		expect(recalculateStageCompletions).not.toHaveBeenCalled();
	});

	it('should not modify progressive fields for non-progressive habits on undo', () => {
		const habit = makeHabit({
			isProgressive: false,
			completedDays: [{ date: '2025-03-21', progress: 1 }],
			completionsSinceStageStart: 0,
		});
		const result = updateHabitProgress([habit], 'Test Habit');

		expect(result[0].completedDays).toHaveLength(0);
		expect(result[0].completionsSinceStageStart).toBe(0);
		expect(recalculateStageCompletions).not.toHaveBeenCalled();
	});

	// === Counter increments on day completion ===

	it('should increment completionsSinceStageStart when day transitions to complete (frequency 1)', () => {
		const habit = makeHabit({
			isProgressive: true,
			stages: ['S1', 'S2', 'S3'],
			frequency: 1,
			completionsSinceStageStart: 3,
			completedDays: [],
		});
		const result = updateHabitProgress([habit], 'Test Habit');

		// progress goes from 0 to 1, which >= frequency (1), so counter increments
		expect(result[0].completionsSinceStageStart).toBe(4);
	});

	it('should increment completionsSinceStageStart when day transitions to complete (frequency 3)', () => {
		const habit = makeHabit({
			isProgressive: true,
			stages: ['S1', 'S2', 'S3'],
			frequency: 3,
			completionsSinceStageStart: 2,
			completedDays: [{ date: '2025-03-21', progress: 2 }],
		});
		const result = updateHabitProgress([habit], 'Test Habit');

		// progress goes from 2 to 3, which >= frequency (3), so counter increments
		expect(result[0].completionsSinceStageStart).toBe(3);
	});

	// === Counter does NOT increment on partial progress ===

	it('should NOT increment completionsSinceStageStart on partial progress (below frequency)', () => {
		const habit = makeHabit({
			isProgressive: true,
			stages: ['S1', 'S2', 'S3'],
			frequency: 3,
			completionsSinceStageStart: 2,
			completedDays: [{ date: '2025-03-21', progress: 1 }],
		});
		const result = updateHabitProgress([habit], 'Test Habit');

		// progress goes from 1 to 2, which < frequency (3), so counter stays
		expect(result[0].completionsSinceStageStart).toBe(2);
	});

	it('should NOT increment completionsSinceStageStart on first tap of multi-frequency habit', () => {
		const habit = makeHabit({
			isProgressive: true,
			stages: ['S1', 'S2', 'S3'],
			frequency: 3,
			completionsSinceStageStart: 0,
			completedDays: [],
		});
		const result = updateHabitProgress([habit], 'Test Habit');

		// progress goes from 0 to 1, which < frequency (3), so counter stays
		expect(result[0].completionsSinceStageStart).toBe(0);
	});

	// === Auto-advance triggers at threshold ===

	it('should call progressHabitStage when counter reaches progressionInterval', () => {
		const habit = makeHabit({
			isProgressive: true,
			stages: ['S1', 'S2', 'S3'],
			frequency: 1,
			progressionMode: 'auto',
			progressionInterval: 5,
			completionsSinceStageStart: 4, // will become 5 === progressionInterval
			currentStage: 0,
			completedDays: [],
		});
		updateHabitProgress([habit], 'Test Habit');

		expect(progressHabitStage).toHaveBeenCalledTimes(1);
		const calledWith = progressHabitStage.mock.calls[0][0];
		expect(calledWith.completionsSinceStageStart).toBe(5);
	});

	it('should NOT auto-advance for manual mode habits', () => {
		const habit = makeHabit({
			isProgressive: true,
			stages: ['S1', 'S2', 'S3'],
			frequency: 1,
			progressionMode: 'manual',
			progressionInterval: 5,
			completionsSinceStageStart: 4,
			currentStage: 0,
			completedDays: [],
		});
		updateHabitProgress([habit], 'Test Habit');

		expect(progressHabitStage).not.toHaveBeenCalled();
	});

	// === No advance at max stage ===

	it('should NOT call progressHabitStage when at max stage', () => {
		const habit = makeHabit({
			isProgressive: true,
			stages: ['S1', 'S2', 'S3'],
			frequency: 1,
			progressionMode: 'auto',
			progressionInterval: 5,
			completionsSinceStageStart: 4,
			currentStage: 2,
			completedDays: [],
		});
		updateHabitProgress([habit], 'Test Habit');

		expect(progressHabitStage).not.toHaveBeenCalled();
	});

	it('should still increment counter at max stage even without advancing', () => {
		const habit = makeHabit({
			isProgressive: true,
			stages: ['S1', 'S2', 'S3'],
			frequency: 1,
			progressionMode: 'auto',
			progressionInterval: 5,
			completionsSinceStageStart: 4,
			currentStage: 2,
			completedDays: [],
		});
		const result = updateHabitProgress([habit], 'Test Habit');

		expect(result[0].completionsSinceStageStart).toBe(5);
	});

	// === Undo recalculates counter ===

	it('should call recalculateStageCompletions on undo for progressive habits', () => {
		const habit = makeHabit({
			isProgressive: true,
			stages: ['S1', 'S2', 'S3'],
			frequency: 1,
			completionsSinceStageStart: 5,
			completedDays: [{ date: '2025-03-21', progress: 1 }],
		});
		updateHabitProgress([habit], 'Test Habit');

		expect(recalculateStageCompletions).toHaveBeenCalledTimes(1);
	});

	it('should NOT call recalculateStageCompletions on undo for non-progressive habits', () => {
		const habit = makeHabit({
			isProgressive: false,
			completedDays: [{ date: '2025-03-21', progress: 1 }],
		});
		updateHabitProgress([habit], 'Test Habit');

		expect(recalculateStageCompletions).not.toHaveBeenCalled();
	});

	// === Undo never regresses stage ===

	it('should never regress stage on undo (stage preserved after recalculation)', () => {
		// recalculateStageCompletions may lower the counter but never the stage
		recalculateStageCompletions.mockImplementation(
			(habit) => ({ ...habit, completionsSinceStageStart: 2 })
		);

		const habit = makeHabit({
			isProgressive: true,
			stages: ['S1', 'S2', 'S3'],
			frequency: 1,
			currentStage: 2,
			completionsSinceStageStart: 5,
			completedDays: [{ date: '2025-03-21', progress: 1 }],
		});
		const result = updateHabitProgress([habit], 'Test Habit');

		// Stage must remain at 2 (never go backwards)
		expect(result[0].currentStage).toBe(2);
		// Counter can decrease
		expect(result[0].completionsSinceStageStart).toBe(2);
	});

	// === Integration: full auto-advance scenario ===

	it('should use progressHabitStage return value (counter reset, stage advanced)', () => {
		progressHabitStage.mockImplementation(
			(habit) => ({
				...habit,
				currentStage: habit.currentStage + 1,
				completionsSinceStageStart: 0,
				stageAdvancementDate: '2025-03-21T00:00:00.000Z',
			})
		);

		const habit = makeHabit({
			isProgressive: true,
			stages: ['S1', 'S2', 'S3'],
			frequency: 1,
			progressionMode: 'auto',
			progressionInterval: 3,
			completionsSinceStageStart: 2,
			currentStage: 0,
			completedDays: [],
		});
		const result = updateHabitProgress([habit], 'Test Habit');

		expect(result[0].currentStage).toBe(1);
		expect(result[0].completionsSinceStageStart).toBe(0);
		expect(result[0].stageAdvancementDate).toBe('2025-03-21T00:00:00.000Z');
	});

	// === Non-matching habits unchanged ===

	it('should not modify habits that do not match the title', () => {
		const otherHabit = makeHabit({
			title: 'Other Habit',
			isProgressive: true,
			completionsSinceStageStart: 3,
		});
		const targetHabit = makeHabit({
			title: 'Test Habit',
			isProgressive: true,
			stages: ['S1', 'S2', 'S3'],
			frequency: 1,
			completionsSinceStageStart: 0,
		});
		const result = updateHabitProgress([otherHabit, targetHabit], 'Test Habit');

		expect(result[0].completionsSinceStageStart).toBe(3);
		expect(result[1].completionsSinceStageStart).toBe(1);
	});
});
