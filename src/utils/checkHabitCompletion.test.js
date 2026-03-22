import checkHabitCompletion from './checkHabitCompletion';

describe('checkHabitCompletion', () => {
	// === Daily habit (periodDays=1) backward compatibility ===

	it('should return true for daily habit when progress >= frequency on that day', () => {
		const completedDays = [{ date: '2026-03-21', progress: 1 }];
		expect(checkHabitCompletion(completedDays, 1, 1, new Date('2026-03-21'))).toBe(true);
	});

	it('should return false for daily habit when no progress on that day', () => {
		const completedDays = [{ date: '2026-03-20', progress: 1 }];
		expect(checkHabitCompletion(completedDays, 1, 1, new Date('2026-03-21'))).toBe(false);
	});

	it('should return false for daily habit when progress < frequency', () => {
		const completedDays = [{ date: '2026-03-21', progress: 1 }];
		expect(checkHabitCompletion(completedDays, 3, 1, new Date('2026-03-21'))).toBe(false);
	});

	it('should return true for daily habit with frequency=3 and progress=3', () => {
		const completedDays = [{ date: '2026-03-21', progress: 3 }];
		expect(checkHabitCompletion(completedDays, 3, 1, new Date('2026-03-21'))).toBe(true);
	});

	// === Rolling window (periodDays > 1) ===

	it('should return true for weekly habit when rolling window sum >= frequency', () => {
		const completedDays = [
			{ date: '2026-03-15', progress: 1 },
			{ date: '2026-03-18', progress: 1 },
		];
		expect(checkHabitCompletion(completedDays, 2, 7, new Date('2026-03-21'))).toBe(true);
	});

	it('should return false for weekly habit when rolling window sum < frequency', () => {
		const completedDays = [
			{ date: '2026-03-15', progress: 1 },
		];
		expect(checkHabitCompletion(completedDays, 2, 7, new Date('2026-03-21'))).toBe(false);
	});

	it('should exclude days outside the rolling window', () => {
		const completedDays = [
			{ date: '2026-03-13', progress: 1 }, // outside 7-day window ending Mar 21
			{ date: '2026-03-18', progress: 1 },
		];
		// Only 1 completion within window (Mar 15-21), need 2
		expect(checkHabitCompletion(completedDays, 2, 7, new Date('2026-03-21'))).toBe(false);
	});

	it('should sum progress values within rolling window', () => {
		const completedDays = [
			{ date: '2026-03-18', progress: 2 },
			{ date: '2026-03-20', progress: 1 },
		];
		// Total progress = 3, frequency = 3
		expect(checkHabitCompletion(completedDays, 3, 7, new Date('2026-03-21'))).toBe(true);
	});

	// === Multiple dates returns array (Month.jsx behavior) ===

	it('should return array of booleans when multiple dates are passed', () => {
		const completedDays = [{ date: '2026-03-21', progress: 1 }];
		const result = checkHabitCompletion(
			completedDays, 1, 1,
			new Date('2026-03-20'),
			new Date('2026-03-21')
		);
		expect(result).toEqual([false, true]);
	});

	it('should return single boolean when one date is passed', () => {
		const completedDays = [{ date: '2026-03-21', progress: 1 }];
		const result = checkHabitCompletion(completedDays, 1, 1, new Date('2026-03-21'));
		expect(result).toBe(true);
	});

	// === Edge cases ===

	it('should handle empty completedDays', () => {
		expect(checkHabitCompletion([], 1, 1, new Date('2026-03-21'))).toBe(false);
	});

	it('should handle empty completedDays with periodDays > 1', () => {
		expect(checkHabitCompletion([], 2, 7, new Date('2026-03-21'))).toBe(false);
	});

	it('should handle rolling window with multiple dates (Month.jsx)', () => {
		const completedDays = [
			{ date: '2026-03-15', progress: 1 },
			{ date: '2026-03-18', progress: 1 },
		];
		const result = checkHabitCompletion(
			completedDays, 2, 7,
			new Date('2026-03-14'), // window Mar 8-14: 0 completions
			new Date('2026-03-21'), // window Mar 15-21: 2 completions
		);
		expect(result).toEqual([false, true]);
	});
});
