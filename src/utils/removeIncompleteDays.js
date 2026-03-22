// utils
import getFormattedDate from './getFormattedDate';

function removeIncompleteDays(completedDays, frequency, periodDays) {
	const today = new Date(getFormattedDate(new Date()));

	// For rolling window habits (periodDays > 1), individual day progress
	// below frequency is expected and valid -- don't filter those out
	if (periodDays && periodDays > 1) {
		return completedDays.filter(
			(d) => {
				if (typeof d.date === 'undefined' || typeof d.progress === 'undefined') {
					return true;
				};

				const isBeforeToday = new Date(d.date) < today;
				const hasNoProgress = d.progress <= 0;

				return !(isBeforeToday && hasNoProgress);
			}
		);
	}

	return completedDays.filter(
		(d) => {
			if (typeof d.date === 'undefined' || typeof d.progress === 'undefined') {
				return true;
			};

			const isBeforeToday = new Date(d.date) < today;
			const isIncomplete = d.progress < frequency;

			return !(isBeforeToday && isIncomplete);
		}
	);
}

export default removeIncompleteDays;
