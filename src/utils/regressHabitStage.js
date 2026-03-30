// utils

function regressHabitStage(habit) {
	if (!habit.isProgressive) {
		return habit;
	}

	if (habit.currentStage <= 0) {
		return habit;
	}

	return {
		...habit,
		currentStage: habit.currentStage - 1,
		completionsSinceStageStart: 0,
		stageAdvancementDate: new Date().toISOString(),
	};
}

export default regressHabitStage;
