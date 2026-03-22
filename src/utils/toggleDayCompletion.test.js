import toggleDayCompletion from './toggleDayCompletion';

describe('toggleDayCompletion', () => {
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
});
