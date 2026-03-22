// utils
import getFormattedDate from './getFormattedDate';

function updateCompletedDays(completedDays, newFrequency) {
	const today = getFormattedDate(new Date());
	return completedDays.map(
		(day) => (
			day.date === today
				? { ...day, progress: newFrequency }
				: day
		)
	);
}

export default updateCompletedDays;