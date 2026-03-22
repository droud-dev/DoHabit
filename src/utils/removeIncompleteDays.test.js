import removeIncompleteDays from './removeIncompleteDays';
import getFormattedDate from './getFormattedDate';

// Mock getFormattedDate to control "today"
jest.mock('./getFormattedDate');

describe('removeIncompleteDays', () => {
	beforeEach(() => {
		getFormattedDate.mockReturnValue('2026-03-21');
	});

	it('should accept periodDays as third parameter', () => {
		const days = [
			{ date: '2026-03-20', progress: 0 },
			{ date: '2026-03-21', progress: 1 },
		];
		// Should filter out past incomplete days regardless of periodDays
		const result = removeIncompleteDays(days, 1, 1);
		expect(result).toEqual([{ date: '2026-03-21', progress: 1 }]);
	});

	it('should filter incomplete past days with periodDays > 1', () => {
		const days = [
			{ date: '2026-03-19', progress: 0 },
			{ date: '2026-03-20', progress: 1 },
			{ date: '2026-03-21', progress: 0 },
		];
		const result = removeIncompleteDays(days, 1, 7);
		// Mar 19 is past + incomplete -> removed
		// Mar 20 is past + complete -> kept
		// Mar 21 is today -> kept
		expect(result).toEqual([
			{ date: '2026-03-20', progress: 1 },
			{ date: '2026-03-21', progress: 0 },
		]);
	});

	it('should keep today even if incomplete', () => {
		const days = [{ date: '2026-03-21', progress: 0 }];
		const result = removeIncompleteDays(days, 1, 1);
		expect(result).toEqual([{ date: '2026-03-21', progress: 0 }]);
	});

	it('should handle empty array', () => {
		expect(removeIncompleteDays([], 1, 1)).toEqual([]);
	});

	// === Frozen entry guards ===

	it('should not filter out frozen entry before today for daily habit', () => {
		const days = [
			{ date: '2026-03-20', progress: 0, freeze: true },
			{ date: '2026-03-19', progress: 1 },
		];
		const result = removeIncompleteDays(days, 1, 1);
		expect(result).toEqual(days);
	});

	it('should not filter out frozen entry before today for rolling window habit', () => {
		const days = [
			{ date: '2026-03-20', progress: 0, freeze: true },
			{ date: '2026-03-19', progress: 1 },
		];
		const result = removeIncompleteDays(days, 2, 7);
		expect(result).toEqual(days);
	});
});
