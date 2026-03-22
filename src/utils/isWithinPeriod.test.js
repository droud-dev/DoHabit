import isWithinPeriod from './isWithinPeriod';

describe('isWithinPeriod', () => {
	// Success criteria: isWithinPeriod('2026-03-15', new Date('2026-03-21'), 7) returns true
	it('should return true when date is within the rolling window', () => {
		expect(isWithinPeriod('2026-03-15', new Date('2026-03-21'), 7)).toBe(true);
	});

	// Success criteria: isWithinPeriod('2026-03-13', new Date('2026-03-21'), 7) returns false
	it('should return false when date is outside the rolling window', () => {
		expect(isWithinPeriod('2026-03-13', new Date('2026-03-21'), 7)).toBe(false);
	});

	// Success criteria: isWithinPeriod('2026-03-21', new Date('2026-03-21'), 1) returns true (same-day, daily habit)
	it('should return true for same-day check with periodDays=1 (daily habit)', () => {
		expect(isWithinPeriod('2026-03-21', new Date('2026-03-21'), 1)).toBe(true);
	});

	it('should return false for date at exact window boundary start (exclusive)', () => {
		// 7-day window ending on Mar 21: windowStart = Mar 14 (exclusive)
		// Window contains Mar 15..21 = 7 days
		expect(isWithinPeriod('2026-03-14', new Date('2026-03-21'), 7)).toBe(false);
	});

	it('should return true for first day inside window', () => {
		// Mar 15 is the first day inside a 7-day window ending Mar 21
		expect(isWithinPeriod('2026-03-15', new Date('2026-03-21'), 7)).toBe(true);
	});

	it('should return true for endDate itself', () => {
		expect(isWithinPeriod('2026-03-21', new Date('2026-03-21'), 7)).toBe(true);
	});

	it('should return false for date after endDate', () => {
		expect(isWithinPeriod('2026-03-22', new Date('2026-03-21'), 7)).toBe(false);
	});

	it('should handle month boundaries correctly', () => {
		// 7-day window ending on Mar 3: windowStart = Feb 24 (exclusive)
		// Window contains Feb 25..Mar 3 = 7 days
		expect(isWithinPeriod('2026-02-25', new Date('2026-03-03'), 7)).toBe(true);
		expect(isWithinPeriod('2026-02-24', new Date('2026-03-03'), 7)).toBe(false);
	});

	it('should handle periodDays=1 returning false for yesterday', () => {
		expect(isWithinPeriod('2026-03-20', new Date('2026-03-21'), 1)).toBe(false);
	});

	it('should handle large periodDays (90 days)', () => {
		// 90-day window ending on Mar 21: windowStart = Dec 21 (exclusive)
		// Dec 22 should be inside the window
		expect(isWithinPeriod('2025-12-22', new Date('2026-03-21'), 90)).toBe(true);
		expect(isWithinPeriod('2025-12-21', new Date('2026-03-21'), 90)).toBe(false);
	});
});
