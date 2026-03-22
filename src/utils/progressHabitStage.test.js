import progressHabitStage from './progressHabitStage';

describe('progressHabitStage', () => {
	const makeProgressiveHabit = (overrides = {}) => ({
		title: 'Test Habit',
		isProgressive: true,
		stages: ['Stage 1', 'Stage 2', 'Stage 3'],
		currentStage: 0,
		progressionMode: 'auto',
		progressionInterval: 7,
		completionsSinceStageStart: 5,
		stageAdvancementDate: null,
		...overrides,
	});

	it('should advance to next stage', () => {
		const habit = makeProgressiveHabit({ currentStage: 0 });
		const result = progressHabitStage(habit);

		expect(result.currentStage).toBe(1);
	});

	it('should reset completionsSinceStageStart to 0', () => {
		const habit = makeProgressiveHabit({ completionsSinceStageStart: 7 });
		const result = progressHabitStage(habit);

		expect(result.completionsSinceStageStart).toBe(0);
	});

	it('should set stageAdvancementDate to current ISO timestamp', () => {
		const now = '2026-03-21T12:00:00.000Z';
		jest.spyOn(global, 'Date').mockImplementation(() => ({
			toISOString: () => now,
		}));

		const habit = makeProgressiveHabit();
		const result = progressHabitStage(habit);

		expect(result.stageAdvancementDate).toBe(now);

		jest.restoreAllMocks();
	});

	it('should return unchanged habit if not progressive', () => {
		const habit = makeProgressiveHabit({ isProgressive: false });
		const result = progressHabitStage(habit);

		expect(result).toBe(habit);
	});

	it('should return unchanged habit if at max stage', () => {
		const habit = makeProgressiveHabit({
			stages: ['Stage 1', 'Stage 2', 'Stage 3'],
			currentStage: 2,
		});
		const result = progressHabitStage(habit);

		expect(result).toBe(habit);
	});

	it('should return unchanged habit if at last valid stage index', () => {
		const habit = makeProgressiveHabit({
			stages: ['A', 'B'],
			currentStage: 1,
		});
		const result = progressHabitStage(habit);

		expect(result).toBe(habit);
	});

	it('should return a new object (immutability)', () => {
		const habit = makeProgressiveHabit({ currentStage: 0 });
		const result = progressHabitStage(habit);

		expect(result).not.toBe(habit);
		expect(habit.currentStage).toBe(0);
		expect(habit.completionsSinceStageStart).toBe(5);
	});

	it('should preserve all other habit properties', () => {
		const habit = makeProgressiveHabit({
			title: 'My Habit',
			currentStage: 0,
			progressionMode: 'manual',
			progressionInterval: 10,
		});
		const result = progressHabitStage(habit);

		expect(result.title).toBe('My Habit');
		expect(result.progressionMode).toBe('manual');
		expect(result.progressionInterval).toBe(10);
		expect(result.stages).toEqual(['Stage 1', 'Stage 2', 'Stage 3']);
	});
});
