// utils
import updateCompletedDays from './updateCompletedDays';
import reorderHabit from './reorderHabit';

function editHabit(habits, title, updatedHabit, newIndex) {
	habits = habits.map(
		(habit) => {
			habit = { ...habit };

			if (habit.title === title) {
				const frequencyWasChanged = habit.frequency !== updatedHabit.frequency || habit.periodDays !== updatedHabit.periodDays;

				const updatedCompletedDays = frequencyWasChanged
					? updateCompletedDays(habit.completedDays, updatedHabit.frequency)
					: habit.completedDays;

				// Capture existing progressive state before spread
				const wasProgressive = habit.isProgressive;
				const oldStages = habit.stages || [];

				habit = {
					...habit,
					...updatedHabit,
					completedDays: updatedCompletedDays
				};

				// Handle progressive stage editing scenarios
				if (wasProgressive && updatedHabit.isProgressive === false) {
					// Scenario B: Progressive toggled off -> clear all progressive fields
					habit.isProgressive = false;
					habit.stages = [];
					habit.currentStage = 0;
					habit.completionsSinceStageStart = 0;
					habit.stageAdvancementDate = null;
				} else if (habit.isProgressive && updatedHabit.stages) {
					const newStages = updatedHabit.stages;
					if (newStages.length !== oldStages.length) {
						// Scenario A (clamp) + C1 (structural change): stages length changed
						habit.currentStage = Math.min(habit.currentStage, newStages.length - 1);
						habit.completionsSinceStageStart = 0;
					}
					// Scenario C2: same length (cosmetic only) -> counter preserved naturally via spread
				}
			};

			return habit;
		}
	);

	const currIndex = habits.findIndex(
		(habit) => habit.title === title
	);

	if (currIndex !== -1 && newIndex !== currIndex) {
		habits = reorderHabit(habits, newIndex, currIndex);
	};

	return habits;
}

export default editHabit;