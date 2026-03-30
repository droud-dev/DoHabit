import toggleDayCompletion from './toggleDayCompletion';
import recalculateStageCompletions from './recalculateStageCompletions';
import progressHabitStage from './progressHabitStage';

jest.mock('./recalculateStageCompletions');
jest.mock('./progressHabitStage');

describe('toggleDayCompletion', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		recalculateStageCompletions.mockImplementation((h) => h);
		progressHabitStage.mockImplementation((h) => h);
	});
	const baseHabits = [
		{
			title: 'Exercise',
			completedDays: [
				{ date: '2026-03-20', progress: 1 },
				{ date: '2026-03-18', progress: 1 },
				{ date: '2026-03-15', progress: 1 },
			],
		},
		{
			title: 'Reading',
			completedDays: [
				{ date: '2026-03-19', progress: 2 },
			],
		},
	];

	describe('removal (isCompleted=true)', () => {
		it('should remove the entry matching dateString from the matching habit', () => {
			const result = toggleDayCompletion(baseHabits, 'Exercise', '2026-03-18', true, 1);

			expect(result[0].completedDays).toEqual([
				{ date: '2026-03-20', progress: 1 },
				{ date: '2026-03-15', progress: 1 },
			]);
		});

		it('should not modify completedDays when dateString does not match any entry', () => {
			const result = toggleDayCompletion(baseHabits, 'Exercise', '2026-03-01', true, 1);

			expect(result[0].completedDays).toEqual(baseHabits[0].completedDays);
			expect(result[0].completedDays.length).toBe(3);
		});
	});

	describe('insertion (isCompleted=false)', () => {
		it('should insert at the beginning when date is newest', () => {
			const result = toggleDayCompletion(baseHabits, 'Exercise', '2026-03-22', false, 1);

			expect(result[0].completedDays[0]).toEqual({ date: '2026-03-22', progress: 1 });
			expect(result[0].completedDays.length).toBe(4);
		});

		it('should insert in the middle at the correct sorted position', () => {
			const result = toggleDayCompletion(baseHabits, 'Exercise', '2026-03-19', false, 1);

			expect(result[0].completedDays).toEqual([
				{ date: '2026-03-20', progress: 1 },
				{ date: '2026-03-19', progress: 1 },
				{ date: '2026-03-18', progress: 1 },
				{ date: '2026-03-15', progress: 1 },
			]);
		});

		it('should push to the end when date is oldest', () => {
			const result = toggleDayCompletion(baseHabits, 'Exercise', '2026-03-10', false, 1);

			const days = result[0].completedDays;
			expect(days[days.length - 1]).toEqual({ date: '2026-03-10', progress: 1 });
			expect(days.length).toBe(4);
		});

		it('should insert into an empty completedDays array', () => {
			const habits = [{ title: 'Meditation', completedDays: [] }];
			const result = toggleDayCompletion(habits, 'Meditation', '2026-03-15', false, 3);

			expect(result[0].completedDays).toEqual([
				{ date: '2026-03-15', progress: 3 },
			]);
		});

		it('should use the provided frequency as progress', () => {
			const result = toggleDayCompletion(baseHabits, 'Exercise', '2026-03-22', false, 5);

			expect(result[0].completedDays[0].progress).toBe(5);
		});
	});

	describe('entryFlags', () => {
		it('should spread entryFlags into the inserted entry', () => {
			const result = toggleDayCompletion(
				baseHabits, 'Exercise', '2026-03-22', false, 1,
				{ isCompYdayBtnUsed: true }
			);

			expect(result[0].completedDays[0]).toEqual({
				date: '2026-03-22',
				progress: 1,
				isCompYdayBtnUsed: true,
			});
		});

		it('should not add extra properties when entryFlags is empty', () => {
			const result = toggleDayCompletion(baseHabits, 'Exercise', '2026-03-22', false, 1, {});

			expect(result[0].completedDays[0]).toEqual({
				date: '2026-03-22',
				progress: 1,
			});
		});

		it('should default entryFlags to empty object when not provided', () => {
			const result = toggleDayCompletion(baseHabits, 'Exercise', '2026-03-22', false, 1);

			expect(result[0].completedDays[0]).toEqual({
				date: '2026-03-22',
				progress: 1,
			});
		});
	});

	describe('duplicate prevention', () => {
		it('should not create duplicate entries when inserting a date that already exists', () => {
			const result = toggleDayCompletion(baseHabits, 'Exercise', '2026-03-20', false, 2);

			const matching = result[0].completedDays.filter((d) => d.date === '2026-03-20');
			expect(matching.length).toBe(1);
			expect(matching[0].progress).toBe(2);
		});
	});

	describe('non-matching habits passthrough', () => {
		it('should return non-matching habits unchanged', () => {
			const result = toggleDayCompletion(baseHabits, 'Exercise', '2026-03-18', true, 1);

			expect(result[1]).toEqual(baseHabits[1]);
			expect(result[1].completedDays).toEqual(baseHabits[1].completedDays);
		});

		it('should not mutate the original habits array', () => {
			const originalDays = [...baseHabits[0].completedDays];
			toggleDayCompletion(baseHabits, 'Exercise', '2026-03-18', true, 1);

			expect(baseHabits[0].completedDays).toEqual(originalDays);
		});

		it('should return the same number of habits', () => {
			const result = toggleDayCompletion(baseHabits, 'Exercise', '2026-03-22', false, 1);

			expect(result.length).toBe(baseHabits.length);
		});
	});

	describe('progressive habits auto-advancement', () => {
		const makeProgressiveHabit = (overrides = {}) => ({
			title: 'Running',
			completedDays: [],
			isProgressive: true,
			stages: ['Walk', 'Jog', 'Run'],
			currentStage: 0,
			progressionMode: 'auto',
			progressionInterval: 3,
			completionsSinceStageStart: 0,
			stageAdvancementDate: null,
			frequency: 1,
			creationDate: '2026-03-20',
			...overrides,
		});

		it('should recalculate counter when marking a day complete (auto mode)', () => {
			const habit = makeProgressiveHabit();
			toggleDayCompletion([habit], 'Running', '2026-03-22', false, 1);

			expect(recalculateStageCompletions).toHaveBeenCalledTimes(1);
			expect(recalculateStageCompletions.mock.calls[0][0].title).toBe('Running');
		});

		it('should recalculate counter when undoing a day (auto mode)', () => {
			const habit = makeProgressiveHabit({
				completedDays: [{ date: '2026-03-22', progress: 1 }],
				completionsSinceStageStart: 1,
			});
			toggleDayCompletion([habit], 'Running', '2026-03-22', true, 1);

			expect(recalculateStageCompletions).toHaveBeenCalledTimes(1);
		});

		it('should NOT trigger advancement when undoing, even if counter >= interval', () => {
			const habit = makeProgressiveHabit({
				completedDays: [
					{ date: '2026-03-22', progress: 1 },
					{ date: '2026-03-21', progress: 1 },
					{ date: '2026-03-20', progress: 1 },
				],
				completionsSinceStageStart: 3,
			});
			recalculateStageCompletions.mockReturnValue({
				...habit,
				completedDays: habit.completedDays.filter((d) => d.date !== '2026-03-22'),
				completionsSinceStageStart: 2,
			});

			toggleDayCompletion([habit], 'Running', '2026-03-22', true, 1);

			expect(progressHabitStage).not.toHaveBeenCalled();
		});

		it('should NOT recalculate for manual mode habits', () => {
			const habit = makeProgressiveHabit({ progressionMode: 'manual' });
			toggleDayCompletion([habit], 'Running', '2026-03-22', false, 1);

			expect(recalculateStageCompletions).not.toHaveBeenCalled();
		});

		it('should NOT recalculate for non-progressive habits', () => {
			const habit = makeProgressiveHabit({ isProgressive: false });
			toggleDayCompletion([habit], 'Running', '2026-03-22', false, 1);

			expect(recalculateStageCompletions).not.toHaveBeenCalled();
		});

		it('should trigger auto-advance when counter reaches interval', () => {
			const habit = makeProgressiveHabit();
			recalculateStageCompletions.mockReturnValue({
				...habit,
				completionsSinceStageStart: 3, // Reached interval
			});

			toggleDayCompletion([habit], 'Running', '2026-03-22', false, 1);

			expect(progressHabitStage).toHaveBeenCalledTimes(1);
		});

		it('should NOT trigger auto-advance when counter below interval', () => {
			const habit = makeProgressiveHabit();
			recalculateStageCompletions.mockReturnValue({
				...habit,
				completionsSinceStageStart: 2, // Below interval (3)
			});

			toggleDayCompletion([habit], 'Running', '2026-03-22', false, 1);

			expect(progressHabitStage).not.toHaveBeenCalled();
		});

		it('should NOT trigger auto-advance when already at max stage', () => {
			const habit = makeProgressiveHabit({
				currentStage: 2, // Max stage (0-indexed, 3 stages total)
			});
			recalculateStageCompletions.mockReturnValue({
				...habit,
				completionsSinceStageStart: 3,
			});

			toggleDayCompletion([habit], 'Running', '2026-03-22', false, 1);

			expect(progressHabitStage).not.toHaveBeenCalled();
		});
	});
});
