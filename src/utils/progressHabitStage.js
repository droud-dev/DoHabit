// utils

function progressHabitStage(habit) {
	if (!habit.isProgressive) {
		return habit;
	}

	if (habit.currentStage >= habit.stages.length - 1) {
		return habit;
	}

	return {
		...habit,
		currentStage: habit.currentStage + 1,
		completionsSinceStageStart: 0,
		stageAdvancementDate: new Date().toISOString(),
	};
}

export default progressHabitStage;
