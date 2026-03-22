import updateCompletedDays from './updateCompletedDays';
import getFormattedDate from './getFormattedDate';

// Mock getFormattedDate to control "today"
jest.mock('./getFormattedDate');

beforeEach(() => {
	getFormattedDate.mockReturnValue('2026-03-22');
});

describe('updateCompletedDays', () => {
	it('should update today\'s entry to newFrequency', () => {
		const completedDays = [
			{ date: '2026-03-20', progress: 1 },
			{ date: '2026-03-21', progress: 1 },
			{ date: '2026-03-22', progress: 1 },
		];

		const result = updateCompletedDays(completedDays, 3);

		expect(result[2]).toEqual({ date: '2026-03-22', progress: 3 });
	});

	it('should leave past entries unchanged', () => {
		const completedDays = [
			{ date: '2026-03-18', progress: 2 },
			{ date: '2026-03-19', progress: 1 },
			{ date: '2026-03-20', progress: 3 },
			{ date: '2026-03-22', progress: 1 },
		];

		const result = updateCompletedDays(completedDays, 5);

		expect(result[0]).toEqual({ date: '2026-03-18', progress: 2 });
		expect(result[1]).toEqual({ date: '2026-03-19', progress: 1 });
		expect(result[2]).toEqual({ date: '2026-03-20', progress: 3 });
		// Only today changed
		expect(result[3]).toEqual({ date: '2026-03-22', progress: 5 });
	});

	it('should return completedDays unchanged when no entry for today exists', () => {
		const completedDays = [
			{ date: '2026-03-18', progress: 2 },
			{ date: '2026-03-19', progress: 1 },
		];

		const result = updateCompletedDays(completedDays, 5);

		expect(result).toEqual(completedDays);
		expect(result.length).toBe(2);
	});

	it('should handle empty completedDays array', () => {
		const result = updateCompletedDays([], 3);

		expect(result).toEqual([]);
	});
});
