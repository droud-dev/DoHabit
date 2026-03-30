import recalculateStageCompletions from './recalculateStageCompletions';

describe('recalculateStageCompletions', () => {
	const makeHabit = (overrides = {}) => ({
		title: 'Test Habit',
		frequency: 1,
		isProgressive: true,
		stages: ['Stage 1', 'Stage 2', 'Stage 3'],
		currentStage: 1,
		progressionMode: 'auto',
		progressionInterval: 7,
		completionsSinceStageStart: 5,
		stageAdvancementDate: '2025-03-10T00:00:00.000Z',
		creationDate: '2025-03-01T00:00:00.000Z',
		completedDays: [],
		...overrides,
	});

	it('should return unchanged habit if not progressive', () => {
		const habit = makeHabit({ isProgressive: false });
		const result = recalculateStageCompletions(habit);
		expect(result).toBe(habit);
	});

	it('should count completed days after stageAdvancementDate with sufficient progress', () => {
		const habit = makeHabit({
			frequency: 1,
			stageAdvancementDate: '2025-03-10T00:00:00.000Z',
			completedDays: [
				{ date: '2025-03-15', progress: 1 },
				{ date: '2025-03-14', progress: 1 },
				{ date: '2025-03-12', progress: 1 },
				{ date: '2025-03-09', progress: 1 }, // before advancement, should not count
			],
		});

		const result = recalculateStageCompletions(habit);
		expect(result.completionsSinceStageStart).toBe(3);
	});

	it('should use earlier of creationDate or earliest completion when stageAdvancementDate is null', () => {
		const habit = makeHabit({
			frequency: 1,
			stageAdvancementDate: null,
			currentStage: 0,
			creationDate: '2025-03-05T00:00:00.000Z',
			completedDays: [
				{ date: '2025-03-08', progress: 1 },
				{ date: '2025-03-07', progress: 1 },
				{ date: '2025-03-04', progress: 1 }, // retroactive completion before creation, should count
			],
		});

		const result = recalculateStageCompletions(habit);
		expect(result.completionsSinceStageStart).toBe(3);
	});

	it('should use creationDate as baseline when no retroactive completions exist', () => {
		const habit = makeHabit({
			frequency: 1,
			stageAdvancementDate: null,
			currentStage: 0,
			creationDate: '2025-03-05T00:00:00.000Z',
			completedDays: [
				{ date: '2025-03-08', progress: 1 },
				{ date: '2025-03-07', progress: 1 },
				{ date: '2025-03-06', progress: 1 },
			],
		});

		const result = recalculateStageCompletions(habit);
		expect(result.completionsSinceStageStart).toBe(3);
	});

	it('should filter by completion status (progress >= frequency)', () => {
		const habit = makeHabit({
			frequency: 3,
			stageAdvancementDate: '2025-03-10T00:00:00.000Z',
			completedDays: [
				{ date: '2025-03-15', progress: 3 }, // meets frequency
				{ date: '2025-03-14', progress: 2 }, // below frequency, should not count
				{ date: '2025-03-13', progress: 4 }, // exceeds frequency, should count
				{ date: '2025-03-12', progress: 1 }, // below frequency, should not count
			],
		});

		const result = recalculateStageCompletions(habit);
		expect(result.completionsSinceStageStart).toBe(2);
	});

	it('should handle empty completedDays', () => {
		const habit = makeHabit({
			completedDays: [],
		});

		const result = recalculateStageCompletions(habit);
		expect(result.completionsSinceStageStart).toBe(0);
	});

	it('should return a new object (immutability)', () => {
		const habit = makeHabit({
			completedDays: [
				{ date: '2025-03-15', progress: 1 },
			],
		});

		const result = recalculateStageCompletions(habit);
		expect(result).not.toBe(habit);
		expect(result.completionsSinceStageStart).toBe(1);
	});

	it('should count same-calendar-day completions when advancement has a time component', () => {
		// Edge case: stageAdvancementDate has time (e.g. mid-day manual advance)
		// and a completion exists on the same calendar day. The completion should
		// count toward the new stage.
		const habit = makeHabit({
			frequency: 1,
			stageAdvancementDate: '2025-03-10T12:30:00.000Z',
			completedDays: [
				{ date: '2025-03-10', progress: 1 }, // same day as advancement, should count
				{ date: '2025-03-11', progress: 1 }, // after advancement, should count
				{ date: '2025-03-09', progress: 1 }, // before advancement, should not count
			],
		});

		const result = recalculateStageCompletions(habit);
		expect(result.completionsSinceStageStart).toBe(2);
	});

	it('should handle Date object creationDate when stageAdvancementDate is null', () => {
		// In the codebase, creationDate is set as `new Date()` (a Date object)
		const habit = makeHabit({
			stageAdvancementDate: null,
			currentStage: 0,
			creationDate: new Date('2025-03-05T00:00:00.000Z'),
			completedDays: [
				{ date: '2025-03-08', progress: 1 },
				{ date: '2025-03-06', progress: 1 },
				{ date: '2025-03-04', progress: 1 }, // retroactive completion, should count
			],
		});

		const result = recalculateStageCompletions(habit);
		expect(result.completionsSinceStageStart).toBe(3);
	});
});
