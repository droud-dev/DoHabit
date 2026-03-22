// utils
import deleteHabit from './deleteHabit';
import editHabit from './editHabit';
import updateHabitProgress from './updateHabitProgress';
import progressHabitStage from './progressHabitStage';

import addNote from './addNote';
import deleteNote from './deleteNote';
import editNote from './editNote';

import archiveHabit from './archiveHabit';
import toggleDayCompletion from './toggleDayCompletion';
import toggleDayFreeze from './toggleDayFreeze';
import scrollToTop from './scrollToTop';

import saveToLocalStorage from './saveToLocalStorage';

function habitsReducer(habits, action) {
	const {
		data, habitTitle
	} = action;

	const newHabit = data && {
		title: data.title.value,
		colorIndex: Number(data.colorIndex.value),
		iconTitle: data.iconTitle.value,
		frequency: Number(data.frequency.value),
		periodDays: Number(data.periodDays?.value) || 1,
		completedDays: [],
		isProgressive: data.isProgressive?.value === 'true',
		isNegative: data.isNegative?.value === 'true',
		stages: JSON.parse(data.stages?.value || '[]'),
		currentStage: 0,
		progressionMode: data.progressionMode?.value || 'manual',
		progressionInterval: parseInt(data.progressionInterval?.value || '7', 10),
		completionsSinceStageStart: 0,
		stageAdvancementDate: null,
	};

	switch (action.type) {
		case 'importHabit':
			habits = [...action.importedData];
			break;

		// habits
		case 'addHabit':
			habits = [{ ...newHabit, creationDate: new Date() }, ...habits];
			scrollToTop();
			break;

		case 'deleteHabit':
			habits = deleteHabit(habits, habitTitle);
			break;

		case 'archiveHabit':
			habits = archiveHabit(habits, habitTitle);
			break;

		case 'editHabit':
			habits = editHabit(habits, habitTitle, newHabit, data.order.value - 1);
			break;

		case 'toggleDayCompletion':
			habits = toggleDayCompletion(habits, habitTitle, action.date, action.isCompleted, action.frequency, action.entryFlags);
			break;

		case 'toggleDayFreeze':
			habits = toggleDayFreeze(habits, habitTitle, action.date, action.isFrozen);
			break;

		case 'updateProgress':
			habits = updateHabitProgress(habits, habitTitle);
			break;

		case 'progressStage':
			habits = habits.map(habit =>
				habit.title === habitTitle ? progressHabitStage(habit) : habit
			);
			break;

		// diary
		case 'addNote':
			habits = addNote(habits, habitTitle, action.newNote);
			break;

		case 'editNote':
			habits = editNote(habits, action.habitTitle, action.noteCreationDate, action.newText);
			break;

		case 'deleteNote':
			habits = deleteNote(habits, habitTitle, action.noteCreationDate);
			break;

		default:
			console.error('Unknown action: ' + action.type);
	};

	saveToLocalStorage('habits', habits);

	return habits;
}

export default habitsReducer;