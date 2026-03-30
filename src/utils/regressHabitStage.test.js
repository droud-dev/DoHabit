import regressHabitStage from './regressHabitStage';

describe('regressHabitStage', () => {
	it('should return unchanged habit if not progressive', () => {
		const habit = {
			title: 'Running',
			isProgressive: false,
			currentStage: 1,
		};

		const result = regressHabitStage(habit);
		expect(result).toBe(habit);
	});

	it('should return unchanged habit if already at first stage', () => {
		const habit = {
			title: 'Running',
			isProgressive: true,
			stages: ['Walk', 'Jog', 'Run'],
			currentStage: 0,
			completionsSinceStageStart: 5,
		};

		const result = regressHabitStage(habit);
		expect(result).toBe(habit);
	});

	it('should decrement currentStage by 1', () => {
		const habit = {
			title: 'Running',
			isProgressive: true,
			stages: ['Walk', 'Jog', 'Run'],
			currentStage: 2,
			completionsSinceStageStart: 3,
		};

		const result = regressHabitStage(habit);
		expect(result.currentStage).toBe(1);
	});

	it('should reset completionsSinceStageStart to 0', () => {
		const habit = {
			title: 'Running',
			isProgressive: true,
			stages: ['Walk', 'Jog', 'Run'],
			currentStage: 2,
			completionsSinceStageStart: 7,
		};

		const result = regressHabitStage(habit);
		expect(result.completionsSinceStageStart).toBe(0);
	});

	it('should set stageAdvancementDate to current timestamp', () => {
		const before = new Date().toISOString();

		const habit = {
			title: 'Running',
			isProgressive: true,
			stages: ['Walk', 'Jog', 'Run'],
			currentStage: 1,
			completionsSinceStageStart: 3,
			stageAdvancementDate: null,
		};

		const result = regressHabitStage(habit);

		const after = new Date().toISOString();

		expect(result.stageAdvancementDate).toBeTruthy();
		expect(result.stageAdvancementDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
		expect(result.stageAdvancementDate >= before).toBe(true);
		expect(result.stageAdvancementDate <= after).toBe(true);
	});

	it('should return a new object (immutability)', () => {
		const habit = {
			title: 'Running',
			isProgressive: true,
			stages: ['Walk', 'Jog', 'Run'],
			currentStage: 2,
			completionsSinceStageStart: 5,
		};

		const result = regressHabitStage(habit);
		expect(result).not.toBe(habit);
		expect(result.title).toBe('Running');
	});
});
