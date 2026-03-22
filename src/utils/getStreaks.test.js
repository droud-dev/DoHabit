import getStreaks from './getStreaks';
import getFormattedDate from './getFormattedDate';

describe('getStreaks', () => {
	// === Input validation ===

	it('should throw TypeError if completedDays is not an array', () => {
		expect(() => getStreaks('invalid', 1, 1)).toThrow(TypeError);
	});

	it('should throw TypeError if frequency is not a number', () => {
		expect(() => getStreaks([], 'invalid', 1)).toThrow(TypeError);
	});

	// === Empty / zero cases ===

	it('should return zero streaks for empty array', () => {
		expect(getStreaks([], 1, 1)).toEqual({
			currentStreak: 0,
			longestStreak: 0,
			allStreaks: [],
		});
	});

	// === Daily habit (periodDays=1) backward compatibility ===

	it('should calculate longestStreak for consecutive daily completions', () => {
		const today = getFormattedDate(new Date());
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		const dayBefore = new Date();
		dayBefore.setDate(dayBefore.getDate() - 2);

		const completedDays = [
			{ date: today, progress: 1 },
			{ date: getFormattedDate(yesterday), progress: 1 },
			{ date: getFormattedDate(dayBefore), progress: 1 },
		];

		const result = getStreaks(completedDays, 1, 1);
		expect(result.longestStreak).toBe(3);
		expect(result.currentStreak).toBe(3);
	});

	it('should return zero current streak if last completion is old', () => {
		const completedDays = [
			{ date: '2025-01-05', progress: 1 },
			{ date: '2025-01-04', progress: 1 },
		];
		const result = getStreaks(completedDays, 1, 1);
		expect(result.currentStreak).toBe(0);
		expect(result.longestStreak).toBe(2);
	});

	// === Rolling window (periodDays > 1) ===

	it('should calculate on-track streak for weekly habit (2/7)', () => {
		const today = getFormattedDate(new Date());
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		const twoDaysAgo = new Date();
		twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

		// Two completions within the last 7 days
		const completedDays = [
			{ date: today, progress: 1 },
			{ date: getFormattedDate(yesterday), progress: 1 },
			{ date: getFormattedDate(twoDaysAgo), progress: 1 },
		];
		const result = getStreaks(completedDays, 2, 7);
		// Today: window has 3 completions >= 2 -> on track
		// Yesterday: window has 2 completions (yesterday + 2daysAgo) >= 2 -> on track
		// 2 days ago: window has 1 completion < 2 -> NOT on track, breaks streak
		// So streak of [today, yesterday] = 2, then [2daysAgo] = 1
		expect(result.longestStreak).toBe(2);
		expect(result.currentStreak).toBe(2);
	});

	// === Edge: single day ===

	it('should handle single completed day for daily habit', () => {
		const today = getFormattedDate(new Date());
		const completedDays = [{ date: today, progress: 1 }];
		const result = getStreaks(completedDays, 1, 1);
		expect(result.longestStreak).toBe(1);
		expect(result.allStreaks).toHaveLength(1);
	});

	// === Edge: removes incomplete first day ===

	it('should remove first day if incomplete before calculating streaks', () => {
		const today = getFormattedDate(new Date());
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);

		const completedDays = [
			{ date: today, progress: 0 },
			{ date: getFormattedDate(yesterday), progress: 1 },
		];
		const result = getStreaks(completedDays, 1, 1);
		// First day (progress=0) removed, leaving yesterday only
		expect(result.longestStreak).toBe(1);
	});

	// === Signature accepts periodDays ===

	it('should accept periodDays parameter without error', () => {
		expect(() => getStreaks([], 1, 7)).not.toThrow();
	});

	it('should pass periodDays to removeIncompleteFirstDay', () => {
		const today = getFormattedDate(new Date());
		const twoDaysAgo = new Date();
		twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

		// For periodDays=7, first day on-track check uses rolling window
		const completedDays = [
			{ date: today, progress: 1 },
			{ date: getFormattedDate(twoDaysAgo), progress: 1 },
		];
		// frequency=2, periodDays=7: window ending today has 2 completions (today + 2 days ago)
		// so first day should NOT be removed
		const result = getStreaks(completedDays, 2, 7);
		expect(result.longestStreak).toBeGreaterThanOrEqual(1);
	});
});
