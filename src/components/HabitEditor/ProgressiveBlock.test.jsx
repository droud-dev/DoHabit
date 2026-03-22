import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import ProgressiveBlock from './ProgressiveBlock';

let container;

beforeEach(() => {
	container = document.createElement('div');
	document.body.appendChild(container);
});

afterEach(() => {
	document.body.removeChild(container);
	container = null;
});

// Helper to render inside a form so hidden inputs are accessible via form.elements
const renderInForm = (props = {}) => {
	act(() => {
		ReactDOM.render(
			<form data-testid="form">
				<ProgressiveBlock {...props} />
			</form>,
			container
		);
	});
	return container.querySelector('form');
};

describe('ProgressiveBlock', () => {
	describe('toggle behavior', () => {
		it('renders the toggle checkbox unchecked by default', () => {
			renderInForm();
			const checkbox = container.querySelector('#progressiveToggle');
			expect(checkbox).toBeTruthy();
			expect(checkbox.checked).toBe(false);
		});

		it('renders "Enable Progressive Stages" label', () => {
			renderInForm();
			const label = container.querySelector('label[for="progressiveToggle"]');
			expect(label).toBeTruthy();
			expect(label.textContent).toBe('Enable Progressive Stages');
		});

		it('does not show configuration when toggled off', () => {
			renderInForm();
			const addBtn = container.querySelector('button');
			// The only buttons should be absent (no Add Stage, no Remove)
			// when toggled off, no stage inputs should be visible
			const stageInputs = container.querySelectorAll('input[type="text"]');
			expect(stageInputs.length).toBe(0);
		});

		it('shows configuration when toggled on', () => {
			renderInForm();
			const checkbox = container.querySelector('#progressiveToggle');

			act(() => {
				checkbox.dispatchEvent(new Event('change', { bubbles: true }));
				// Simulate React change: set checked and fire
			});

			// Use act to toggle
			act(() => {
				// React controlled component needs click simulation
				checkbox.click();
			});

			// After toggle, stage inputs should appear (default 2 stages)
			const stageInputs = container.querySelectorAll('input[type="text"]');
			expect(stageInputs.length).toBe(2);
		});
	});

	describe('stage list editor', () => {
		it('starts with 2 empty stage inputs when toggled on', () => {
			renderInForm();
			const checkbox = container.querySelector('#progressiveToggle');
			act(() => { checkbox.click(); });

			const stageInputs = container.querySelectorAll('input[type="text"]');
			expect(stageInputs.length).toBe(2);
			expect(stageInputs[0].value).toBe('');
			expect(stageInputs[1].value).toBe('');
		});

		it('Add Stage button adds a new empty stage input', () => {
			renderInForm();
			const checkbox = container.querySelector('#progressiveToggle');
			act(() => { checkbox.click(); });

			const addBtn = Array.from(container.querySelectorAll('button'))
				.find((b) => b.textContent === 'Add Stage');
			expect(addBtn).toBeTruthy();

			act(() => { addBtn.click(); });

			const stageInputs = container.querySelectorAll('input[type="text"]');
			expect(stageInputs.length).toBe(3);
		});

		it('Remove button is disabled when at minimum 2 stages', () => {
			renderInForm();
			const checkbox = container.querySelector('#progressiveToggle');
			act(() => { checkbox.click(); });

			const removeBtns = Array.from(container.querySelectorAll('button'))
				.filter((b) => b.textContent === 'Remove');
			expect(removeBtns.length).toBe(2);
			removeBtns.forEach((btn) => {
				expect(btn.disabled).toBe(true);
			});
		});

		it('Remove button is enabled when more than 2 stages', () => {
			renderInForm();
			const checkbox = container.querySelector('#progressiveToggle');
			act(() => { checkbox.click(); });

			const addBtn = Array.from(container.querySelectorAll('button'))
				.find((b) => b.textContent === 'Add Stage');
			act(() => { addBtn.click(); });

			const removeBtns = Array.from(container.querySelectorAll('button'))
				.filter((b) => b.textContent === 'Remove');
			expect(removeBtns.length).toBe(3);
			removeBtns.forEach((btn) => {
				expect(btn.disabled).toBe(false);
			});
		});

		it('Remove button removes a stage input', () => {
			renderInForm();
			const checkbox = container.querySelector('#progressiveToggle');
			act(() => { checkbox.click(); });

			// Add a third stage first
			const addBtn = Array.from(container.querySelectorAll('button'))
				.find((b) => b.textContent === 'Add Stage');
			act(() => { addBtn.click(); });

			expect(container.querySelectorAll('input[type="text"]').length).toBe(3);

			// Remove the first stage
			const removeBtns = Array.from(container.querySelectorAll('button'))
				.filter((b) => b.textContent === 'Remove');
			act(() => { removeBtns[0].click(); });

			expect(container.querySelectorAll('input[type="text"]').length).toBe(2);
		});
	});

	describe('minimum stages enforcement', () => {
		it('prevents removing stages below minimum of 2', () => {
			renderInForm();
			const checkbox = container.querySelector('#progressiveToggle');
			act(() => { checkbox.click(); });

			// Should have exactly 2 stages
			expect(container.querySelectorAll('input[type="text"]').length).toBe(2);

			// All remove buttons should be disabled at minimum
			const removeBtns = Array.from(container.querySelectorAll('button'))
				.filter((b) => b.textContent === 'Remove');
			removeBtns.forEach((btn) => {
				expect(btn.disabled).toBe(true);
			});

			// Clicking a disabled remove button should not reduce stages
			act(() => { removeBtns[0].click(); });
			expect(container.querySelectorAll('input[type="text"]').length).toBe(2);
		});
	});

	describe('progression mode', () => {
		it('renders Manual and Automatic radio buttons when toggled on', () => {
			renderInForm();
			const checkbox = container.querySelector('#progressiveToggle');
			act(() => { checkbox.click(); });

			const radios = container.querySelectorAll('input[type="radio"]');
			expect(radios.length).toBe(2);
			expect(radios[0].value).toBe('manual');
			expect(radios[1].value).toBe('auto');
		});

		it('Manual is selected by default', () => {
			renderInForm();
			const checkbox = container.querySelector('#progressiveToggle');
			act(() => { checkbox.click(); });

			const manualRadio = container.querySelector('input[type="radio"][value="manual"]');
			expect(manualRadio.checked).toBe(true);
		});

		it('does not show interval input when Manual is selected', () => {
			renderInForm();
			const checkbox = container.querySelector('#progressiveToggle');
			act(() => { checkbox.click(); });

			const intervalInput = container.querySelector('input[type="number"]:not([name])');
			// The interval input should not be present when manual
			const intervalInputs = container.querySelectorAll('.intervalInput');
			// Check by looking for number inputs that aren't hidden
			const visibleNumberInputs = Array.from(container.querySelectorAll('input[type="number"]'))
				.filter((el) => el.name !== 'progressionInterval' || el.type !== 'hidden');
			// In manual mode, only the hidden input exists
			expect(container.querySelector('input[type="number"][min="1"]')).toBeFalsy();
		});

		it('shows interval input when Automatic is selected', () => {
			renderInForm();
			const checkbox = container.querySelector('#progressiveToggle');
			act(() => { checkbox.click(); });

			const autoRadio = container.querySelector('input[type="radio"][value="auto"]');
			act(() => { autoRadio.click(); });

			const intervalInput = container.querySelector('input[type="number"][min="1"]');
			expect(intervalInput).toBeTruthy();
			expect(intervalInput.value).toBe('7');
		});
	});

	describe('hidden inputs', () => {
		it('renders all required hidden inputs when toggled off', () => {
			const form = renderInForm();

			expect(form.elements.isProgressive).toBeTruthy();
			expect(form.elements.isProgressive.value).toBe('false');

			expect(form.elements.stages).toBeTruthy();
			expect(form.elements.stages.value).toBe('[]');

			expect(form.elements.progressionMode).toBeTruthy();
			expect(form.elements.progressionMode.value).toBe('manual');

			expect(form.elements.progressionInterval).toBeTruthy();
			expect(form.elements.progressionInterval.value).toBe('7');

			expect(form.elements.currentStage).toBeTruthy();
			expect(form.elements.currentStage.value).toBe('0');

			expect(form.elements.completionsSinceStageStart).toBeTruthy();
			expect(form.elements.completionsSinceStageStart.value).toBe('0');

			expect(form.elements.stageAdvancementDate).toBeTruthy();
			expect(form.elements.stageAdvancementDate.value).toBe('');
		});

		it('renders isProgressive as "true" when toggled on', () => {
			const form = renderInForm();
			const checkbox = container.querySelector('#progressiveToggle');
			act(() => { checkbox.click(); });

			expect(form.elements.isProgressive.value).toBe('true');
		});

		it('renders stages as JSON-stringified array when toggled on', () => {
			const form = renderInForm();
			const checkbox = container.querySelector('#progressiveToggle');
			act(() => { checkbox.click(); });

			const stagesValue = JSON.parse(form.elements.stages.value);
			expect(Array.isArray(stagesValue)).toBe(true);
			expect(stagesValue.length).toBe(2);
		});
	});

	describe('edit mode pre-population', () => {
		const editSettings = {
			isProgressive: true,
			stages: ['Walk 5 min', 'Walk 10 min', 'Jog 5 min'],
			currentStage: 1,
			progressionMode: 'auto',
			progressionInterval: 14,
			completionsSinceStageStart: 3,
			stageAdvancementDate: '2026-03-01',
		};

		it('pre-populates toggle as checked when isProgressive is true', () => {
			renderInForm({ currentSettings: editSettings });
			const checkbox = container.querySelector('#progressiveToggle');
			expect(checkbox.checked).toBe(true);
		});

		it('pre-populates stages from currentSettings', () => {
			renderInForm({ currentSettings: editSettings });
			const stageInputs = container.querySelectorAll('input[type="text"]');
			expect(stageInputs.length).toBe(3);
			expect(stageInputs[0].value).toBe('Walk 5 min');
			expect(stageInputs[1].value).toBe('Walk 10 min');
			expect(stageInputs[2].value).toBe('Jog 5 min');
		});

		it('pre-populates automatic mode and interval', () => {
			renderInForm({ currentSettings: editSettings });
			const autoRadio = container.querySelector('input[type="radio"][value="auto"]');
			expect(autoRadio.checked).toBe(true);

			const intervalInput = container.querySelector('input[type="number"][min="1"]');
			expect(intervalInput).toBeTruthy();
			expect(intervalInput.value).toBe('14');
		});

		it('preserves currentStage in hidden input', () => {
			const form = renderInForm({ currentSettings: editSettings });
			expect(form.elements.currentStage.value).toBe('1');
		});

		it('preserves completionsSinceStageStart in hidden input', () => {
			const form = renderInForm({ currentSettings: editSettings });
			expect(form.elements.completionsSinceStageStart.value).toBe('3');
		});

		it('preserves stageAdvancementDate in hidden input', () => {
			const form = renderInForm({ currentSettings: editSettings });
			expect(form.elements.stageAdvancementDate.value).toBe('2026-03-01');
		});
	});

	describe('non-progressive defaults', () => {
		it('renders with no currentSettings (new habit mode)', () => {
			const form = renderInForm();
			expect(form.elements.isProgressive.value).toBe('false');
			expect(form.elements.stages.value).toBe('[]');
			expect(form.elements.currentStage.value).toBe('0');
		});

		it('renders with non-progressive habit settings', () => {
			const form = renderInForm({
				currentSettings: {
					isProgressive: false,
					stages: [],
					currentStage: 0,
					progressionMode: 'manual',
					progressionInterval: 7,
					completionsSinceStageStart: 0,
					stageAdvancementDate: null,
				}
			});
			const checkbox = container.querySelector('#progressiveToggle');
			expect(checkbox.checked).toBe(false);
			expect(form.elements.isProgressive.value).toBe('false');
		});
	});
});
