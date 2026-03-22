/**
 * Checks if a date falls within a rolling time window.
 *
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @param {Date} endDate - End of the rolling window
 * @param {number} periodDays - Window size in days (1-90)
 * @returns {boolean} True if date is within [endDate - periodDays, endDate]
 */
function isWithinPeriod(date, endDate, periodDays) {
	const dayInMs = 24 * 60 * 60 * 1000;
	const windowStart = new Date(endDate.getTime() - (periodDays * dayInMs));
	const targetDate = new Date(date);

	return targetDate > windowStart && targetDate <= endDate;
}

export default isWithinPeriod;
