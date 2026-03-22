// utils
import getFormattedDate from './getFormattedDate';

/**
 * Calculates the number of days since the most recent ceiling-hit
 * for a negative (reduction) habit.
 *
 * @param {Array<{ date: string, progress: number }>} completedDays - Newest-first array of entries.
 * @param {number} frequency - The daily ceiling (max allowed slips).
 * @param {Date|string} creationDate - When the habit was created.
 * @returns {number} Days since most recent ceiling-hit (0 = today, 1 = yesterday, etc.).
 *   If never hit: days since creationDate.
 */
function getNegativeStreak(completedDays, frequency, creationDate) {
	// completedDays is sorted newest-first — .find() returns most recent failure
	const lastFailure = completedDays.find((d) => d.progress >= frequency);

	const today = new Date(getFormattedDate(new Date()));

	if (!lastFailure) {
		// Never hit ceiling — streak from creation date
		const created = new Date(getFormattedDate(new Date(creationDate)));
		return Math.round((today - created) / (24 * 60 * 60 * 1000));
	}

	const failDate = new Date(lastFailure.date);
	return Math.round((today - failDate) / (24 * 60 * 60 * 1000));
	// 0 = ceiling hit today, 1 = yesterday, etc.
}

export default getNegativeStreak;
