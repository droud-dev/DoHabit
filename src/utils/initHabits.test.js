import initHabits from './initHabits';
import getFromLocalStorage from './getFromLocalStorage';
import saveToLocalStorage from './saveToLocalStorage';
import removeIncompleteDays from './removeIncompleteDays';

jest.mock('./getFromLocalStorage');
jest.mock('./saveToLocalStorage');
jest.mock('./removeIncompleteDays', () => jest.fn((days) => days));

describe('initHabits', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should return empty array when no habits exist', () => {
		getFromLocalStorage.mockReturnValue([]);
		const result = initHabits();
		expect(result).toEqual([]);
	});

	it('should add all 7 progressive defaults to legacy habits without progressive fields', () => {
		const legacyHabit = {
			title: 'Read daily',
			frequency: 1,
			completedDays: [{ date: '2025-03-10', progress: 1 }],
		};
		getFromLocalStorage.mockReturnValue([legacyHabit]);

		const result = initHabits();

		expect(result).toHaveLength(1);
		expect(result[0].isProgressive).toBe(false);
		expect(result[0].stages).toEqual([]);
		expect(result[0].currentStage).toBe(0);
		expect(result[0].progressionMode).toBe('manual');
		expect(result[0].progressionInterval).toBe(7);
		expect(result[0].completionsSinceStageStart).toBe(0);
		expect(result[0].stageAdvancementDate).toBeNull();
	});

	it('should preserve existing habit fields when adding progressive defaults', () => {
		const legacyHabit = {
			title: 'Exercise',
			frequency: 2,
			color: '#ff0000',
			icon: 'dumbbell',
			completedDays: [{ date: '2025-03-10', progress: 2 }],
		};
		getFromLocalStorage.mockReturnValue([legacyHabit]);

		const result = initHabits();

		expect(result[0].title).toBe('Exercise');
		expect(result[0].frequency).toBe(2);
		expect(result[0].color).toBe('#ff0000');
		expect(result[0].icon).toBe('dumbbell');
		expect(result[0].isProgressive).toBe(false);
	});

	it('should not modify habits that already have isProgressive set', () => {
		const progressiveHabit = {
			title: 'Read daily',
			frequency: 1,
			completedDays: [],
			isProgressive: true,
			stages: ['1 page', '2 pages', '3 pages'],
			currentStage: 1,
			progressionMode: 'auto',
			progressionInterval: 5,
			completionsSinceStageStart: 3,
			stageAdvancementDate: '2025-03-10T12:00:00.000Z',
		};
		getFromLocalStorage.mockReturnValue([progressiveHabit]);

		const result = initHabits();

		expect(result[0].isProgressive).toBe(true);
		expect(result[0].stages).toEqual(['1 page', '2 pages', '3 pages']);
		expect(result[0].currentStage).toBe(1);
		expect(result[0].progressionMode).toBe('auto');
		expect(result[0].progressionInterval).toBe(5);
		expect(result[0].completionsSinceStageStart).toBe(3);
		expect(result[0].stageAdvancementDate).toBe('2025-03-10T12:00:00.000Z');
	});

	it('should not modify habits where isProgressive is explicitly false', () => {
		const nonProgressiveHabit = {
			title: 'Meditate',
			frequency: 1,
			completedDays: [],
			isProgressive: false,
			stages: [],
			currentStage: 0,
			progressionMode: 'manual',
			progressionInterval: 7,
			completionsSinceStageStart: 0,
			stageAdvancementDate: null,
		};
		getFromLocalStorage.mockReturnValue([nonProgressiveHabit]);

		const result = initHabits();

		// Should not overwrite any existing values
		expect(result[0].isProgressive).toBe(false);
		expect(result[0].stages).toEqual([]);
		expect(result[0].currentStage).toBe(0);
		expect(result[0].progressionMode).toBe('manual');
		expect(result[0].progressionInterval).toBe(7);
		expect(result[0].completionsSinceStageStart).toBe(0);
		expect(result[0].stageAdvancementDate).toBeNull();
	});

	it('should handle multiple habits with mixed progressive status', () => {
		const legacyHabit = { title: 'Legacy', frequency: 1, completedDays: [] };
		const modernHabit = {
			title: 'Modern',
			frequency: 1,
			completedDays: [],
			isProgressive: true,
			stages: ['A', 'B'],
			currentStage: 0,
			progressionMode: 'manual',
			progressionInterval: 7,
			completionsSinceStageStart: 0,
			stageAdvancementDate: null,
		};
		getFromLocalStorage.mockReturnValue([legacyHabit, modernHabit]);

		const result = initHabits();

		// Legacy habit gets defaults
		expect(result[0].isProgressive).toBe(false);
		expect(result[0].stages).toEqual([]);
		// Modern habit keeps its values
		expect(result[1].isProgressive).toBe(true);
		expect(result[1].stages).toEqual(['A', 'B']);
	});

	it('should save updated habits to localStorage', () => {
		const legacyHabit = { title: 'Test', frequency: 1, completedDays: [] };
		getFromLocalStorage.mockReturnValue([legacyHabit]);

		initHabits();

		expect(saveToLocalStorage).toHaveBeenCalledWith('habits', expect.arrayContaining([
			expect.objectContaining({ title: 'Test', isProgressive: false }),
		]));
	});

	// periodDays migration tests
	describe('periodDays migration', () => {
		it('should add periodDays: 1 to habits lacking the field', () => {
			const legacyHabit = {
				title: 'Old habit',
				frequency: 1,
				completedDays: [{ date: '2025-03-10', progress: 1 }],
			};
			getFromLocalStorage.mockReturnValue([legacyHabit]);

			const result = initHabits();

			expect(result[0].periodDays).toBe(1);
		});

		it('should not overwrite existing periodDays value', () => {
			const habitWithPeriod = {
				title: 'Weekly habit',
				frequency: 2,
				periodDays: 7,
				completedDays: [],
				isProgressive: false,
				stages: [],
				currentStage: 0,
				progressionMode: 'manual',
				progressionInterval: 7,
				completionsSinceStageStart: 0,
				stageAdvancementDate: null,
			};
			getFromLocalStorage.mockReturnValue([habitWithPeriod]);

			const result = initHabits();

			expect(result[0].periodDays).toBe(7);
		});

		it('should pass periodDays to removeIncompleteDays as third argument', () => {
			const habit = {
				title: 'Test',
				frequency: 2,
				periodDays: 7,
				completedDays: [{ date: '2025-03-10', progress: 1 }],
				isProgressive: false,
				stages: [],
				currentStage: 0,
				progressionMode: 'manual',
				progressionInterval: 7,
				completionsSinceStageStart: 0,
				stageAdvancementDate: null,
			};
			getFromLocalStorage.mockReturnValue([habit]);

			initHabits();

			expect(removeIncompleteDays).toHaveBeenCalledWith(
				[{ date: '2025-03-10', progress: 1 }],
				2,
				7
			);
		});

		it('should pass periodDays 1 to removeIncompleteDays for migrated habits', () => {
			const legacyHabit = {
				title: 'Legacy',
				frequency: 1,
				completedDays: [{ date: '2025-03-10', progress: 1 }],
			};
			getFromLocalStorage.mockReturnValue([legacyHabit]);

			initHabits();

			expect(removeIncompleteDays).toHaveBeenCalledWith(
				[{ date: '2025-03-10', progress: 1 }],
				1,
				1
			);
		});

		it('should add periodDays before progressive migration runs', () => {
			const legacyHabit = {
				title: 'Old',
				frequency: 1,
				completedDays: [],
			};
			getFromLocalStorage.mockReturnValue([legacyHabit]);

			const result = initHabits();

			// Both periodDays and progressive fields should be set
			expect(result[0].periodDays).toBe(1);
			expect(result[0].isProgressive).toBe(false);
		});
	});
});
