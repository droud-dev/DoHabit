import editHabit from './editHabit';

describe('editHabit', () => {
	const makeHabit = (overrides = {}) => ({
		title: 'Test Habit',
		frequency: 1,
		completedDays: [],
		isProgressive: false,
		stages: [],
		currentStage: 0,
		progressionMode: 'manual',
		progressionInterval: 7,
		completionsSinceStageStart: 0,
		stageAdvancementDate: null,
		...overrides,
	});

	const makeProgressiveHabit = (overrides = {}) => makeHabit({
		isProgressive: true,
		stages: ['Stage 1', 'Stage 2', 'Stage 3'],
		currentStage: 1,
		completionsSinceStageStart: 4,
		stageAdvancementDate: '2026-03-01T00:00:00.000Z',
		...overrides,
	});

	describe('non-progressive edit behavior (unchanged)', () => {
		it('should update habit fields without affecting non-progressive habits', () => {
			const habits = [makeHabit({ title: 'Read' })];
			const updated = { title: 'Read Books', frequency: 2 };

			const result = editHabit(habits, 'Read', updated, 0);

			expect(result[0].title).toBe('Read Books');
			expect(result[0].frequency).toBe(2);
		});

		it('should not add progressive fields to non-progressive habits', () => {
			const habits = [makeHabit({ title: 'Read', isProgressive: false })];
			const updated = { title: 'Read', frequency: 2 };

			const result = editHabit(habits, 'Read', updated, 0);

			expect(result[0].isProgressive).toBe(false);
			expect(result[0].stages).toEqual([]);
			expect(result[0].currentStage).toBe(0);
		});

		it('should still handle reordering', () => {
			const habits = [
				makeHabit({ title: 'A' }),
				makeHabit({ title: 'B' }),
				makeHabit({ title: 'C' }),
			];
			const result = editHabit(habits, 'A', { title: 'A' }, 2);

			expect(result[0].title).toBe('B');
			expect(result[2].title).toBe('A');
		});
	});

	describe('Scenario A: Stages reduced below current position (clamp)', () => {
		it('should clamp currentStage to new max when stages reduced below current position', () => {
			const habits = [makeProgressiveHabit({
				title: 'Read',
				stages: ['S1', 'S2', 'S3', 'S4', 'S5'],
				currentStage: 2, // at stage 3 of 5 (0-based index 2)
				completionsSinceStageStart: 4,
			})];

			const updated = {
				title: 'Read',
				isProgressive: true,
				stages: ['S1', 'S2'], // reduced to 2 stages
			};

			const result = editHabit(habits, 'Read', updated, 0);

			// currentStage should be clamped to 1 (max index for 2 stages)
			expect(result[0].currentStage).toBe(1);
			// completionsSinceStageStart should be reset to 0
			expect(result[0].completionsSinceStageStart).toBe(0);
		});

		it('should clamp currentStage when at exact boundary', () => {
			const habits = [makeProgressiveHabit({
				title: 'Read',
				stages: ['S1', 'S2', 'S3'],
				currentStage: 2, // at stage 3 of 3 (last stage)
			})];

			const updated = {
				title: 'Read',
				isProgressive: true,
				stages: ['S1', 'S2'], // reduced from 3 to 2
			};

			const result = editHabit(habits, 'Read', updated, 0);

			expect(result[0].currentStage).toBe(1); // clamped to new max
			expect(result[0].completionsSinceStageStart).toBe(0);
		});
	});

	describe('Scenario B: Progressive option disabled (clear all)', () => {
		it('should clear all progressive fields when isProgressive toggled off', () => {
			const habits = [makeProgressiveHabit({
				title: 'Read',
				currentStage: 2,
				completionsSinceStageStart: 5,
				stageAdvancementDate: '2026-03-15T00:00:00.000Z',
			})];

			const updated = {
				title: 'Read',
				isProgressive: false,
			};

			const result = editHabit(habits, 'Read', updated, 0);

			expect(result[0].isProgressive).toBe(false);
			expect(result[0].stages).toEqual([]);
			expect(result[0].currentStage).toBe(0);
			expect(result[0].completionsSinceStageStart).toBe(0);
			expect(result[0].stageAdvancementDate).toBeNull();
		});

		it('should clear progressive fields even when habit was at max stage', () => {
			const habits = [makeProgressiveHabit({
				title: 'Read',
				stages: ['S1', 'S2'],
				currentStage: 1,
				completionsSinceStageStart: 10,
			})];

			const updated = {
				title: 'Read',
				isProgressive: false,
			};

			const result = editHabit(habits, 'Read', updated, 0);

			expect(result[0].isProgressive).toBe(false);
			expect(result[0].stages).toEqual([]);
			expect(result[0].currentStage).toBe(0);
			expect(result[0].completionsSinceStageStart).toBe(0);
			expect(result[0].stageAdvancementDate).toBeNull();
		});
	});

	describe('Scenario C1: Structural stage change (reset counter)', () => {
		it('should reset completionsSinceStageStart when stages are added', () => {
			const habits = [makeProgressiveHabit({
				title: 'Read',
				stages: ['S1', 'S2', 'S3'],
				currentStage: 1,
				completionsSinceStageStart: 4,
			})];

			const updated = {
				title: 'Read',
				isProgressive: true,
				stages: ['S1', 'S2', 'S3', 'S4'], // added one stage
			};

			const result = editHabit(habits, 'Read', updated, 0);

			expect(result[0].currentStage).toBe(1); // stage preserved
			expect(result[0].completionsSinceStageStart).toBe(0); // counter reset
			expect(result[0].stages).toEqual(['S1', 'S2', 'S3', 'S4']);
		});

		it('should reset completionsSinceStageStart when stages are removed but above current', () => {
			const habits = [makeProgressiveHabit({
				title: 'Read',
				stages: ['S1', 'S2', 'S3', 'S4'],
				currentStage: 1,
				completionsSinceStageStart: 4,
			})];

			const updated = {
				title: 'Read',
				isProgressive: true,
				stages: ['S1', 'S2', 'S3'], // removed stage 4
			};

			const result = editHabit(habits, 'Read', updated, 0);

			expect(result[0].currentStage).toBe(1); // stage preserved (still within range)
			expect(result[0].completionsSinceStageStart).toBe(0); // counter reset
		});
	});

	describe('Scenario C2: Cosmetic stage change (preserve counter)', () => {
		it('should preserve completionsSinceStageStart when only descriptions change', () => {
			const habits = [makeProgressiveHabit({
				title: 'Read',
				stages: ['Read 1 page', 'Read 2 pages', 'Read 3 pages'],
				currentStage: 1,
				completionsSinceStageStart: 4,
			})];

			const updated = {
				title: 'Read',
				isProgressive: true,
				stages: ['Read 1 page daily', 'Read 2 pages daily', 'Read 3 pages daily'], // same length, different text
			};

			const result = editHabit(habits, 'Read', updated, 0);

			expect(result[0].currentStage).toBe(1); // stage preserved
			expect(result[0].completionsSinceStageStart).toBe(4); // counter preserved
			expect(result[0].stages).toEqual(['Read 1 page daily', 'Read 2 pages daily', 'Read 3 pages daily']);
		});

		it('should preserve counter when stage descriptions are identical', () => {
			const habits = [makeProgressiveHabit({
				title: 'Read',
				stages: ['S1', 'S2', 'S3'],
				currentStage: 1,
				completionsSinceStageStart: 6,
			})];

			const updated = {
				title: 'Read',
				isProgressive: true,
				stages: ['S1', 'S2', 'S3'], // no change at all
			};

			const result = editHabit(habits, 'Read', updated, 0);

			expect(result[0].completionsSinceStageStart).toBe(6); // counter preserved
		});
	});

	describe('edge cases', () => {
		it('should not affect other habits in the array', () => {
			const habits = [
				makeProgressiveHabit({ title: 'Read' }),
				makeHabit({ title: 'Exercise' }),
			];

			const updated = {
				title: 'Read',
				isProgressive: false,
			};

			const result = editHabit(habits, 'Read', updated, 0);

			expect(result[1].title).toBe('Exercise');
			expect(result[1].isProgressive).toBe(false);
		});

		it('should handle enabling progressive on a previously non-progressive habit', () => {
			const habits = [makeHabit({
				title: 'Read',
				isProgressive: false,
			})];

			const updated = {
				title: 'Read',
				isProgressive: true,
				stages: ['S1', 'S2', 'S3'],
				currentStage: 0,
				completionsSinceStageStart: 0,
			};

			const result = editHabit(habits, 'Read', updated, 0);

			expect(result[0].isProgressive).toBe(true);
			expect(result[0].stages).toEqual(['S1', 'S2', 'S3']);
			expect(result[0].currentStage).toBe(0);
		});
	});
});
