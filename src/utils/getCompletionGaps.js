import getDayGap from './getDayGap';
import removeIncompleteFirstDay from './removeIncompleteFirstDay';

function getCompletionGaps(completedDays, frequency, periodDays) {
	const gaps = [];

	if (completedDays.length < 2) return gaps;

	// Replace inline duplication with removeIncompleteFirstDay call
	completedDays = removeIncompleteFirstDay(completedDays, frequency, periodDays);

	for (let i = 0; i < completedDays.length - 1; i++) {
		const dayOne = new Date(completedDays[i].date);
		const dayTwo = new Date(completedDays[i + 1].date);

		const gap = getDayGap(dayOne, dayTwo);

		if (gap) gaps.push(gap);
	};

	return gaps;
}

export default getCompletionGaps;
