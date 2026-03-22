// utils
import getFormattedDate from './getFormattedDate';
import isWithinPeriod from './isWithinPeriod';

function checkHabitCompletion(completedDays, frequency, periodDays, ...dates) {
	const results = dates.reduce(
		(acc, date) => {
			let isCompleted;

			if (!periodDays || periodDays <= 1) {
				// Daily habit: existing single-day logic
				const formattedDate = getFormattedDate(date);
				isCompleted = completedDays.some(
					(day) => (
						day.date === formattedDate
						&& day.progress >= frequency
					)
				);
			} else {
				// Rolling window: sum progress within window
				// Don't mark future dates as complete
				const today = new Date();
				today.setHours(23, 59, 59, 999);
				if (date > today) {
					isCompleted = false;
				} else {
					const totalProgress = completedDays.reduce(
						(sum, day) => {
							if (isWithinPeriod(day.date, date, periodDays)) {
								return sum + day.progress;
							}
							return sum;
						},
						0
					);
					isCompleted = totalProgress >= frequency;
				}
			}

			acc.push(isCompleted);
			return acc;
		},
		[]
	);

	return results.length === 1 ? results[0] : results;
}

export default checkHabitCompletion;
