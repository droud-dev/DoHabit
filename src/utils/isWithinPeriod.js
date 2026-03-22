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
	const targetDate = new Date(date);
	const diffDays = Math.round((endDate - targetDate) / dayInMs);

	return diffDays >= 0 && diffDays < periodDays;
}

export default isWithinPeriod;
