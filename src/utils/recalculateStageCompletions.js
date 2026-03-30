/**
 * Recalculates completionsSinceStageStart by counting completedDays entries
 * that occurred after the last stage advancement (or habit creation for stage 0)
 * and where the day's progress meets or exceeds the habit's frequency.
 *
 * Used on undo operations to ensure the counter stays accurate without
 * ever regressing the stage.
 *
 * @param {Object} habit - Habit object with progressive fields and completedDays
 * @returns {Object} - Updated habit with recalculated completionsSinceStageStart
 */
function recalculateStageCompletions(habit) {
	if (!habit.isProgressive) return habit;

	// Determine baseline date for counting completions.
	// Use stageAdvancementDate if exists (last progression), otherwise use the earlier of:
	// - creationDate
	// - earliest completedDay date (to include retroactive completions)
	let baselineRaw;
	if (habit.stageAdvancementDate) {
		baselineRaw = habit.stageAdvancementDate;
	} else if (habit.completedDays.length > 0) {
		const earliestCompletion = habit.completedDays[habit.completedDays.length - 1].date;
		const creationDateOnly = new Date(habit.creationDate).toISOString().slice(0, 10);
		baselineRaw = earliestCompletion < creationDateOnly ? earliestCompletion : creationDateOnly;
	} else {
		baselineRaw = habit.creationDate;
	}

	// Normalize to YYYY-MM-DD for consistent date-only comparison.
	// stageAdvancementDate is an ISO timestamp with time (e.g. '2025-03-10T12:30:00.000Z')
	// while completedDays[].date is YYYY-MM-DD. Using >= on date-only strings
	// ensures completions on the advancement day are counted toward the new stage.
	const baselineDate = typeof baselineRaw === 'string' && baselineRaw.includes('T')
		? new Date(baselineRaw).toISOString().slice(0, 10)
		: baselineRaw;

	const count = habit.completedDays.filter((day) => {
		return day.date >= baselineDate && day.progress >= habit.frequency;
	}).length;

	return {
		...habit,
		completionsSinceStageStart: count,
	};
}

export default recalculateStageCompletions;
