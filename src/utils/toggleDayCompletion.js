function toggleDayCompletion(habits, habitTitle, dateString, isCompleted, frequency, entryFlags = {}) {
	return habits.map((habit) => {
		if (habit.title !== habitTitle) return habit;
		let completedDays = [...habit.completedDays];

		if (isCompleted) {
			completedDays = completedDays.filter((d) => d.date !== dateString);
		} else {
			const entry = { date: dateString, progress: frequency, ...entryFlags };
			const insertIdx = completedDays.findIndex((d) => d.date < dateString);
			insertIdx === -1
				? completedDays.push(entry)
				: completedDays.splice(insertIdx, 0, entry);
		}

		return { ...habit, completedDays };
	});
}

export default toggleDayCompletion;
