// utils
import getFormattedDate from './getFormattedDate';
import removeIncompleteFirstDay from './removeIncompleteFirstDay';
import isWithinPeriod from './isWithinPeriod';

/**
 * Checks if a given day is "on track" by evaluating the rolling window
 * ending on that day. For daily habits (periodDays <= 1), checks if the
 * day's own progress >= frequency. For multi-day periods, sums all
 * progress within the rolling window.
 */
function isOnTrack(endDate, completedDays, frequency, periodDays) {
	if (!periodDays || periodDays <= 1) {
		const formattedDate = getFormattedDate(endDate);
		const day = completedDays.find((d) => d.date === formattedDate);
		return day ? day.progress >= frequency : false;
	}

	const totalProgress = completedDays.reduce(
		(sum, day) => {
			if (isWithinPeriod(day.date, endDate, periodDays)) {
				return sum + day.progress;
			}
			return sum;
		},
		0
	);
	return totalProgress >= frequency;
}

/**
 * Calculates the current streak, longest streak, and all streaks
 * based on completed days.
 *
 * @param {Array<{ date: string, progress: number }>} completedDays - An array of objects
 * containing completed days, where each object must have a 'date' property
 * in string format (e.g., 'YYYY-MM-DD') and a 'progress' property
 * (e.g., a number representing the completion status).
 * @param {number} frequency - A number representing the frequency of
 * completed days.
 * @param {number} periodDays - Rolling window size in days (1 = daily).
 * @returns {{ currentStreak: number, longestStreak: number, allStreaks: Array<{ length: number, start: string, end: string }> }}
 * An object containing the current streak, longest streak, and an array
 * of all streaks.
 * @throws {TypeError} - If completedDays is not an array or if frequency is not a number.
 */

function getStreaks(completedDays, frequency, periodDays) {
	if (!Array.isArray(completedDays)) {
		throw new TypeError('The first argument must be an array of completed days.');
	};

	if (typeof frequency !== 'number') {
		throw new TypeError('The second argument must be a number representing the frequency.');
	};

	completedDays = removeIncompleteFirstDay(completedDays, frequency, periodDays);

	// Return "zero streaks" if the input array is empty
	if (completedDays.length === 0) {
		return { currentStreak: 0, longestStreak: 0, allStreaks: [] };
	};

	const oneDay = 24 * 60 * 60 * 1000;
	const allStreaks = [];
	let currentSeries = 1;
	let streakEnd = completedDays[0].date;

	// Iterate through the array to get ALL streaks
	for (let i = 0; i < completedDays.length; i++) {
		const dayOne = new Date(completedDays[i].date);
		const dayTwo = new Date(completedDays[i + 1]?.date);

		// Check if consecutive days are both on track
		const isConsecutive = (dayOne - dayTwo) / oneDay === 1;
		const nextDayOnTrack = completedDays[i + 1]
			? isOnTrack(dayOne, completedDays, frequency, periodDays)
			  && isOnTrack(dayTwo, completedDays, frequency, periodDays)
			: false;

		// For daily habits (periodDays <= 1), use existing logic (consecutive days)
		// For rolling window habits, both days must be on track AND consecutive
		const shouldContinueStreak = isConsecutive
			&& (!periodDays || periodDays <= 1 || nextDayOnTrack);

		if (shouldContinueStreak) {
			currentSeries++;
		} else {
			allStreaks.push({
				length: currentSeries,
				start: completedDays[i].date,
				end: streakEnd
			});

			currentSeries = 1;
			streakEnd = completedDays[i + 1]?.date;
		};
	};

	const today = new Date(getFormattedDate(new Date()));
	const lastDay = new Date(completedDays[0]?.date);

	return {
		allStreaks,
		longestStreak: Math.max(...allStreaks.map((s) => s.length)),
		currentStreak: (today - lastDay) / oneDay > 1 ? 0 : allStreaks[0].length
	};
}

export default getStreaks;
