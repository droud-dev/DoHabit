import getNegativeStreak from './getNegativeStreak';
import getFormattedDate from './getFormattedDate';

describe('getNegativeStreak', () => {
	// Helper to create a date string N days ago
	function daysAgo(n) {
		const d = new Date();
		d.setDate(d.getDate() - n);
		return getFormattedDate(d);
	}

	// === No failures (streak from creationDate) ===

	it('should return days since creationDate when no failures exist', () => {
		const creationDate = new Date();
		creationDate.setDate(creationDate.getDate() - 10);
		const completedDays = [
			{ date: daysAgo(0), progress: 1 },
			{ date: daysAgo(1), progress: 2 },
		];
		// frequency=3, so progress < 3 means no ceiling hit
		expect(getNegativeStreak(completedDays, 3, creationDate)).toBe(10);
	});

	it('should return days since creationDate when completedDays is empty', () => {
		const creationDate = new Date();
		creationDate.setDate(creationDate.getDate() - 5);
		expect(getNegativeStreak([], 1, creationDate)).toBe(5);
	});

	it('should handle creationDate as ISO string', () => {
		const creationDate = new Date();
		creationDate.setDate(creationDate.getDate() - 7);
		expect(getNegativeStreak([], 1, creationDate.toISOString())).toBe(7);
	});

	// === Failure today (return 0) ===

	it('should return 0 when ceiling was hit today', () => {
		const completedDays = [
			{ date: daysAgo(0), progress: 3 },
		];
		const creationDate = new Date();
		creationDate.setDate(creationDate.getDate() - 10);
		expect(getNegativeStreak(completedDays, 3, creationDate)).toBe(0);
	});

	// === Failure yesterday (return 1) ===

	it('should return 1 when ceiling was hit yesterday', () => {
		const completedDays = [
			{ date: daysAgo(0), progress: 1 },
			{ date: daysAgo(1), progress: 3 },
		];
		const creationDate = new Date();
		creationDate.setDate(creationDate.getDate() - 10);
		expect(getNegativeStreak(completedDays, 3, creationDate)).toBe(1);
	});

	// === Failure N days ago ===

	it('should return N when ceiling was hit N days ago', () => {
		const completedDays = [
			{ date: daysAgo(0), progress: 1 },
			{ date: daysAgo(1), progress: 1 },
			{ date: daysAgo(5), progress: 4 },
		];
		const creationDate = new Date();
		creationDate.setDate(creationDate.getDate() - 20);
		expect(getNegativeStreak(completedDays, 3, creationDate)).toBe(5);
	});

	// === Multiple entries with different progress values ===

	it('should return most recent failure only when multiple failures exist', () => {
		const completedDays = [
			{ date: daysAgo(0), progress: 1 },
			{ date: daysAgo(2), progress: 5 },  // failure (most recent)
			{ date: daysAgo(5), progress: 3 },  // failure (older)
			{ date: daysAgo(8), progress: 4 },  // failure (oldest)
		];
		const creationDate = new Date();
		creationDate.setDate(creationDate.getDate() - 30);
		// newest-first array, .find() returns daysAgo(2)
		expect(getNegativeStreak(completedDays, 3, creationDate)).toBe(2);
	});

	// === Entries below ceiling are ignored ===

	it('should ignore entries where progress is below frequency (ceiling)', () => {
		const completedDays = [
			{ date: daysAgo(0), progress: 2 },
			{ date: daysAgo(1), progress: 2 },
			{ date: daysAgo(2), progress: 2 },
		];
		const creationDate = new Date();
		creationDate.setDate(creationDate.getDate() - 15);
		// frequency=3, all entries below ceiling
		expect(getNegativeStreak(completedDays, 3, creationDate)).toBe(15);
	});
});
