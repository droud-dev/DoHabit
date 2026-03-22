// utils
import getFromLocalStorage from './getFromLocalStorage';
import saveToLocalStorage from './saveToLocalStorage';
import removeIncompleteDays from './removeIncompleteDays';

function initHabits() {
	let habits = getFromLocalStorage('habits', []);

	if (!habits.length) return habits;

	habits = habits.map(
		(h) => {
			const newH = { ...h };

			if (!newH.periodDays) newH.periodDays = 1;

			if (newH.frequency && Array.isArray(newH.completedDays)) {
				// remove incomplete days before today with progress less than habit frequency
				newH.completedDays = removeIncompleteDays(newH.completedDays, newH.frequency, newH.periodDays || 1);
			};

			// add default progressive fields for backward compatibility
			if (newH.isProgressive === undefined) {
				newH.isProgressive = false;
				newH.stages = [];
				newH.currentStage = 0;
				newH.progressionMode = 'manual';
				newH.progressionInterval = 7;
				newH.completionsSinceStageStart = 0;
				newH.stageAdvancementDate = null;
			}

			return newH;
		}
	);

	saveToLocalStorage('habits', habits);

	return habits;
}

export default initHabits;