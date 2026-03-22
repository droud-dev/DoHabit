import getCompletionGaps from './getCompletionGaps';

describe('getCompletionGaps', () => {
	it('should accept periodDays as third parameter', () => {
		const completedDays = [
			{ date: '2026-03-21', progress: 1 },
			{ date: '2026-03-18', progress: 1 },
		];
		const gaps = getCompletionGaps(completedDays, 1, 1);
		// Gap between Mar 21 and Mar 18 = 2 days (exclusive of endpoints)
		expect(gaps).toEqual([2]);
	});

	it('should return empty array for less than 2 days', () => {
		expect(getCompletionGaps([], 1, 1)).toEqual([]);
		expect(getCompletionGaps([{ date: '2026-03-21', progress: 1 }], 1, 1)).toEqual([]);
	});

	it('should remove incomplete first day using removeIncompleteFirstDay', () => {
		const completedDays = [
			{ date: '2026-03-21', progress: 0 }, // incomplete, should be removed
			{ date: '2026-03-20', progress: 1 },
			{ date: '2026-03-18', progress: 1 },
		];
		const gaps = getCompletionGaps(completedDays, 1, 1);
		// After removing first incomplete day: Mar 20, Mar 18
		// Gap = 1 day between them
		expect(gaps).toEqual([1]);
	});

	it('should handle consecutive days with no gaps', () => {
		const completedDays = [
			{ date: '2026-03-21', progress: 1 },
			{ date: '2026-03-20', progress: 1 },
		];
		const gaps = getCompletionGaps(completedDays, 1, 1);
		// getDayGap returns 0 for consecutive days, and 0 is falsy so not pushed
		expect(gaps).toEqual([]);
	});

	it('should work with periodDays > 1', () => {
		const completedDays = [
			{ date: '2026-03-21', progress: 1 },
			{ date: '2026-03-18', progress: 1 },
			{ date: '2026-03-10', progress: 1 },
		];
		const gaps = getCompletionGaps(completedDays, 2, 7);
		// First day check: rolling window ending Mar 21 (Mar 15-21): only Mar 21 + Mar 18 = 2 >= 2, on track
		// So first day stays, gaps between: Mar 21-18=2, Mar 18-10=7
		expect(gaps).toEqual([2, 7]);
	});
});
