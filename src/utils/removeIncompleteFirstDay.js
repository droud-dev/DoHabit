import isWithinPeriod from './isWithinPeriod';

function removeIncompleteFirstDay(completedDays, frequency, periodDays) {

	if (completedDays.length === 0) return completedDays;

	if (completedDays[0]?.freeze) return completedDays;

	if (!periodDays || periodDays <= 1) {
		// Daily habit: existing single-day logic
		if (completedDays[0]?.progress < frequency) {
			completedDays = completedDays.slice(1);
		};
	} else {
		// Rolling window: check if first day is on track
		const firstDate = new Date(completedDays[0].date);
		const totalProgress = completedDays.reduce(
			(sum, day) => {
				if (isWithinPeriod(day.date, firstDate, periodDays)) {
					return sum + day.progress;
				}
				return sum;
			},
			0
		);
		if (totalProgress < frequency) {
			completedDays = completedDays.slice(1);
		}
	}

	return completedDays;
}

export default removeIncompleteFirstDay;
