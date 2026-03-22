import removeIncompleteFirstDay from './removeIncompleteFirstDay';

describe('removeIncompleteFirstDay', () => {
	// === Daily habit (periodDays=1) backward compatibility ===

	it('should remove first day if progress < frequency for daily habit', () => {
		const days = [
			{ date: '2026-03-21', progress: 0 },
			{ date: '2026-03-20', progress: 1 },
		];
		const result = removeIncompleteFirstDay(days, 1, 1);
		expect(result).toEqual([{ date: '2026-03-20', progress: 1 }]);
	});

	it('should keep first day if progress >= frequency for daily habit', () => {
		const days = [
			{ date: '2026-03-21', progress: 1 },
			{ date: '2026-03-20', progress: 1 },
		];
		const result = removeIncompleteFirstDay(days, 1, 1);
		expect(result).toEqual(days);
	});

	// === Rolling window (periodDays > 1) ===

	it('should keep first day if rolling window sum >= frequency', () => {
		// completedDays are sorted descending (newest first)
		// First day is 2026-03-21, rolling window ending on Mar 21 with 7-day period
		const days = [
			{ date: '2026-03-21', progress: 1 },
			{ date: '2026-03-18', progress: 1 },
			{ date: '2026-03-10', progress: 1 },
		];
		// Window Mar 15-21: progress = 1 + 1 = 2 >= frequency 2
		const result = removeIncompleteFirstDay(days, 2, 7);
		expect(result).toEqual(days);
	});

	it('should remove first day if rolling window sum < frequency', () => {
		const days = [
			{ date: '2026-03-21', progress: 1 },
			{ date: '2026-03-10', progress: 1 },
		];
		// Window Mar 15-21: only 1 progress >= frequency 2? No, 1 < 2
		const result = removeIncompleteFirstDay(days, 2, 7);
		expect(result).toEqual([{ date: '2026-03-10', progress: 1 }]);
	});

	// === Edge cases ===

	it('should handle empty array', () => {
		expect(removeIncompleteFirstDay([], 1, 1)).toEqual([]);
	});

	it('should handle single incomplete day for daily habit', () => {
		const days = [{ date: '2026-03-21', progress: 0 }];
		expect(removeIncompleteFirstDay(days, 1, 1)).toEqual([]);
	});

	it('should handle single complete day for daily habit', () => {
		const days = [{ date: '2026-03-21', progress: 1 }];
		expect(removeIncompleteFirstDay(days, 1, 1)).toEqual(days);
	});

	// === Frozen entry guard ===

	it('should not remove frozen entry as first day even with progress=0', () => {
		const days = [
			{ date: '2026-03-21', progress: 0, freeze: true },
			{ date: '2026-03-20', progress: 1 },
		];
		const result = removeIncompleteFirstDay(days, 1, 1);
		expect(result).toEqual(days);
	});

	it('should not remove frozen entry as first day for rolling window habit', () => {
		const days = [
			{ date: '2026-03-21', progress: 0, freeze: true },
			{ date: '2026-03-18', progress: 1 },
		];
		const result = removeIncompleteFirstDay(days, 2, 7);
		expect(result).toEqual(days);
	});
});
