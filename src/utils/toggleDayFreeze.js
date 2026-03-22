function toggleDayFreeze(habits, habitTitle, dateString, isFrozen) {
	return habits.map((habit) => {
		if (habit.title !== habitTitle) return habit;
		let completedDays = [...habit.completedDays];

		if (isFrozen) {
			completedDays = completedDays.filter((d) => d.date !== dateString);
		} else {
			completedDays = completedDays.filter((d) => d.date !== dateString);
			const entry = { date: dateString, progress: 0, freeze: true };
			const insertIdx = completedDays.findIndex((d) => d.date < dateString);
			insertIdx === -1
				? completedDays.push(entry)
				: completedDays.splice(insertIdx, 0, entry);
		}

		return { ...habit, completedDays };
	});
}

export default toggleDayFreeze;
