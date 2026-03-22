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

	// Normalize baseline to YYYY-MM-DD for consistent date-only comparison.
	// stageAdvancementDate is an ISO timestamp with time (e.g. '2025-03-10T12:30:00.000Z')
	// while completedDays[].date is YYYY-MM-DD. Using Date objects directly would
	// exclude same-calendar-day completions (new Date('2025-03-10') is NOT >
	// new Date('2025-03-10T12:30:00.000Z')). Using >= on date-only strings
	// ensures completions on the advancement day are counted toward the new stage.
	const baselineRaw = habit.stageAdvancementDate || habit.creationDate;
	const baselineDate = new Date(baselineRaw).toISOString().slice(0, 10);

	const count = habit.completedDays.filter((day) => {
		return day.date >= baselineDate && day.progress >= habit.frequency;
	}).length;

	return {
		...habit,
		completionsSinceStageStart: count,
	};
}

export default recalculateStageCompletions;
