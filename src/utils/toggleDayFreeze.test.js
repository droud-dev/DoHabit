import toggleDayFreeze from './toggleDayFreeze';

describe('toggleDayFreeze', () => {
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

	describe('unfreeze (isFrozen=true)', () => {
		it('should remove the frozen entry matching dateString', () => {
			const habits = [
				{
					title: 'Exercise',
					completedDays: [
						{ date: '2026-03-20', progress: 0, freeze: true },
						{ date: '2026-03-18', progress: 1 },
					],
				},
			];
			const result = toggleDayFreeze(habits, 'Exercise', '2026-03-20', true);

			expect(result[0].completedDays).toEqual([
				{ date: '2026-03-18', progress: 1 },
			]);
		});

		it('should not modify completedDays when dateString does not match any entry', () => {
			const habits = [
				{
					title: 'Exercise',
					completedDays: [
						{ date: '2026-03-20', progress: 0, freeze: true },
					],
				},
			];
			const result = toggleDayFreeze(habits, 'Exercise', '2026-03-01', true);

			expect(result[0].completedDays).toEqual(habits[0].completedDays);
			expect(result[0].completedDays.length).toBe(1);
		});
	});

	describe('freeze (isFrozen=false)', () => {
		it('should insert freeze entry at the beginning when date is newest', () => {
			const result = toggleDayFreeze(baseHabits, 'Exercise', '2026-03-22', false);

			expect(result[0].completedDays[0]).toEqual({ date: '2026-03-22', progress: 0, freeze: true });
			expect(result[0].completedDays.length).toBe(4);
		});

		it('should insert freeze entry in the middle at the correct sorted position', () => {
			const result = toggleDayFreeze(baseHabits, 'Exercise', '2026-03-19', false);

			expect(result[0].completedDays).toEqual([
				{ date: '2026-03-20', progress: 1 },
				{ date: '2026-03-19', progress: 0, freeze: true },
				{ date: '2026-03-18', progress: 1 },
				{ date: '2026-03-15', progress: 1 },
			]);
		});

		it('should push freeze entry to the end when date is oldest', () => {
			const result = toggleDayFreeze(baseHabits, 'Exercise', '2026-03-10', false);

			const days = result[0].completedDays;
			expect(days[days.length - 1]).toEqual({ date: '2026-03-10', progress: 0, freeze: true });
			expect(days.length).toBe(4);
		});

		it('should insert into an empty completedDays array', () => {
			const habits = [{ title: 'Meditation', completedDays: [] }];
			const result = toggleDayFreeze(habits, 'Meditation', '2026-03-15', false);

			expect(result[0].completedDays).toEqual([
				{ date: '2026-03-15', progress: 0, freeze: true },
			]);
		});

		it('should remove existing completion entry before inserting freeze (conflict resolution)', () => {
			const result = toggleDayFreeze(baseHabits, 'Exercise', '2026-03-18', false);

			expect(result[0].completedDays).toEqual([
				{ date: '2026-03-20', progress: 1 },
				{ date: '2026-03-18', progress: 0, freeze: true },
				{ date: '2026-03-15', progress: 1 },
			]);
		});

		it('should always set progress to 0 and freeze to true', () => {
			const result = toggleDayFreeze(baseHabits, 'Exercise', '2026-03-22', false);

			expect(result[0].completedDays[0].progress).toBe(0);
			expect(result[0].completedDays[0].freeze).toBe(true);
		});
	});

	describe('non-matching habits passthrough', () => {
		it('should return non-matching habits unchanged', () => {
			const result = toggleDayFreeze(baseHabits, 'Exercise', '2026-03-22', false);

			expect(result[1]).toEqual(baseHabits[1]);
			expect(result[1].completedDays).toEqual(baseHabits[1].completedDays);
		});

		it('should not mutate the original habits array', () => {
			const originalDays = [...baseHabits[0].completedDays];
			toggleDayFreeze(baseHabits, 'Exercise', '2026-03-22', false);

			expect(baseHabits[0].completedDays).toEqual(originalDays);
		});

		it('should return the same number of habits', () => {
			const result = toggleDayFreeze(baseHabits, 'Exercise', '2026-03-22', false);

			expect(result.length).toBe(baseHabits.length);
		});
	});
});
