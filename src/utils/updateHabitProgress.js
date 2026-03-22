// utils
import getFormattedDate from './getFormattedDate';
import checkHabitCompletion from './checkHabitCompletion';
import progressHabitStage from './progressHabitStage';
import recalculateStageCompletions from './recalculateStageCompletions';

function updateHabitProgress(habits, title) {
	const today = getFormattedDate(new Date());

	return habits.map((habit) => {
		if (habit.title !== title) return habit;

		habit = { ...habit };

		const isCompleted = checkHabitCompletion(habit.completedDays, habit.frequency, habit.periodDays || 1, new Date());
		let completedDays = [...habit.completedDays];

		if (isCompleted) {
			completedDays = completedDays.filter(
				(day) => day.date !== today
			);

			habit = {
				...habit,
				completedDays
			};

			// Undo path: recalculate counter for progressive habits
			if (habit.isProgressive) {
				habit = recalculateStageCompletions(habit);
			}
		} else {
			const todayIndex = completedDays.findIndex(
				(day) => day.date === today
			);

			let newProgress;
			if (todayIndex !== -1) {
				newProgress = completedDays[todayIndex].progress + 1;
				completedDays[todayIndex] = {
					...completedDays[todayIndex],
					progress: newProgress
				};
			} else {
				newProgress = 1;
				completedDays.unshift({ date: today, progress: 1, });
			}

			habit = {
				...habit,
				completedDays
			};

			// Auto-progression: increment counter only when day transitions to complete
			if (habit.isProgressive && habit.progressionMode === 'auto' && newProgress >= habit.frequency) {
				const updatedCounter = habit.completionsSinceStageStart + 1;
				habit = {
					...habit,
					completionsSinceStageStart: updatedCounter,
				};

				// Trigger stage advancement if counter reaches interval and not at max stage
				if (updatedCounter >= habit.progressionInterval && habit.currentStage < habit.stages.length - 1) {
					habit = progressHabitStage(habit);
				}
			}
		};

		return habit;
	});
}

export default updateHabitProgress;
