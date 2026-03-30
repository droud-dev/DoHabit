// utils
import recalculateStageCompletions from './recalculateStageCompletions';
import progressHabitStage from './progressHabitStage';

function toggleDayCompletion(habits, habitTitle, dateString, isCompleted, frequency, entryFlags = {}) {
	return habits.map((habit) => {
		if (habit.title !== habitTitle) return habit;
		let completedDays = [...habit.completedDays];

		if (isCompleted) {
			completedDays = completedDays.filter((d) => d.date !== dateString);
		} else {
			completedDays = completedDays.filter((d) => d.date !== dateString);
			const entry = { date: dateString, progress: frequency, ...entryFlags };
			const insertIdx = completedDays.findIndex((d) => d.date < dateString);
			insertIdx === -1
				? completedDays.push(entry)
				: completedDays.splice(insertIdx, 0, entry);
		}

		habit = { ...habit, completedDays };

		// Auto-progression: recalculate counter and check for advancement
		if (habit.isProgressive && habit.progressionMode === 'auto') {
			habit = recalculateStageCompletions(habit);

			// Only trigger advancement when ADDING a completion, not undoing
			if (!isCompleted && habit.completionsSinceStageStart >= habit.progressionInterval && habit.currentStage < habit.stages.length - 1) {
				habit = progressHabitStage(habit);
			}
		}

		return habit;
	});
}

export default toggleDayCompletion;
