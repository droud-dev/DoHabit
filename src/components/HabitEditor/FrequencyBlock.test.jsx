import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import FrequencyBlock from './FrequencyBlock';

let container;

beforeEach(() => {
	container = document.createElement('div');
	document.body.appendChild(container);
});

afterEach(() => {
	document.body.removeChild(container);
	container = null;
});

const renderInForm = (props = {}) => {
	act(() => {
		ReactDOM.render(
			<form data-testid="form">
				<FrequencyBlock {...props} />
			</form>,
			container
		);
	});
	return container.querySelector('form');
};

describe('FrequencyBlock', () => {
	describe('frequency controls', () => {
		it('renders frequency input with default value 1', () => {
			const form = renderInForm();
			expect(form.elements.frequency).toBeTruthy();
			expect(form.elements.frequency.value).toBe('1');
		});

		it('renders frequency input with currentFrequency prop', () => {
			const form = renderInForm({ currentFrequency: 3 });
			expect(form.elements.frequency.value).toBe('3');
		});

		it('has decrease and increase buttons for frequency', () => {
			renderInForm();
			const buttons = container.querySelectorAll('button');
			// Should have at least 2 buttons for frequency: Decrease and Increase
			const decreaseBtn = Array.from(buttons).find((b) => b.textContent === 'Decrease' || b.textContent === '-');
			const increaseBtn = Array.from(buttons).find((b) => b.textContent === 'Increase' || b.textContent === '+');
			expect(decreaseBtn).toBeTruthy();
			expect(increaseBtn).toBeTruthy();
		});

		it('disables frequency decrease button at minimum (1)', () => {
			renderInForm({ currentFrequency: 1 });
			const buttons = container.querySelectorAll('button');
			// First decrease button should be disabled
			expect(buttons[0].disabled).toBe(true);
		});

		it('disables frequency increase button at maximum (6)', () => {
			renderInForm({ currentFrequency: 6 });
			const buttons = container.querySelectorAll('button');
			// Second button (frequency increase) should be disabled
			expect(buttons[1].disabled).toBe(true);
		});

		it('increments frequency when increase button clicked', () => {
			const form = renderInForm({ currentFrequency: 3 });
			const buttons = container.querySelectorAll('button');
			// buttons[1] is the frequency increase button
			act(() => { buttons[1].click(); });
			expect(form.elements.frequency.value).toBe('4');
		});

		it('decrements frequency when decrease button clicked', () => {
			const form = renderInForm({ currentFrequency: 3 });
			const buttons = container.querySelectorAll('button');
			// buttons[0] is the frequency decrease button
			act(() => { buttons[0].click(); });
			expect(form.elements.frequency.value).toBe('2');
		});
	});

	describe('period controls', () => {
		it('renders hidden periodDays input with default value 1', () => {
			const form = renderInForm();
			expect(form.elements.periodDays).toBeTruthy();
			expect(form.elements.periodDays.value).toBe('1');
		});

		it('renders periodDays input with currentPeriodDays prop', () => {
			const form = renderInForm({ currentPeriodDays: 7 });
			expect(form.elements.periodDays.value).toBe('7');
		});

		it('disables period decrease button at minimum (1)', () => {
			renderInForm({ currentPeriodDays: 1 });
			const buttons = container.querySelectorAll('button');
			// buttons[2] is the period decrease button
			expect(buttons[2].disabled).toBe(true);
		});

		it('disables period increase button at maximum (90)', () => {
			renderInForm({ currentPeriodDays: 90 });
			const buttons = container.querySelectorAll('button');
			// buttons[3] is the period increase button
			expect(buttons[3].disabled).toBe(true);
		});

		it('increments periodDays when increase button clicked', () => {
			const form = renderInForm({ currentPeriodDays: 7 });
			const buttons = container.querySelectorAll('button');
			// buttons[3] is the period increase button
			act(() => { buttons[3].click(); });
			expect(form.elements.periodDays.value).toBe('8');
		});

		it('decrements periodDays when decrease button clicked', () => {
			const form = renderInForm({ currentPeriodDays: 7 });
			const buttons = container.querySelectorAll('button');
			// buttons[2] is the period decrease button
			act(() => { buttons[2].click(); });
			expect(form.elements.periodDays.value).toBe('6');
		});
	});

	describe('separator', () => {
		it('renders "/" separator between frequency and period controls', () => {
			renderInForm();
			const separator = container.querySelector('[class*="separator"]');
			expect(separator).toBeTruthy();
			expect(separator.textContent).toBe('/');
		});
	});

	describe('plural handling', () => {
		it('shows "time" for frequency 1 and "times" for frequency > 1', () => {
			renderInForm({ currentFrequency: 1 });
			// Check the text content near the frequency input
			const contentDiv = container.querySelector('[class*="content"]');
			expect(contentDiv.textContent).toContain('time');

			// Increase frequency to 2
			const buttons = container.querySelectorAll('button');
			act(() => { buttons[1].click(); });
			expect(contentDiv.textContent).toContain('times');
		});

		it('shows "day" for period 1 and "days" for period > 1', () => {
			renderInForm({ currentPeriodDays: 1 });
			const contentDiv = container.querySelector('[class*="content"]');
			expect(contentDiv.textContent).toContain('day');

			// Increase period to 2
			const buttons = container.querySelectorAll('button');
			act(() => { buttons[3].click(); });
			expect(contentDiv.textContent).toContain('days');
		});
	});

	describe('form integration', () => {
		it('captures both frequency and periodDays values for form submission', () => {
			const form = renderInForm({ currentFrequency: 3, currentPeriodDays: 7 });
			expect(form.elements.frequency.value).toBe('3');
			expect(form.elements.periodDays.value).toBe('7');
		});
	});
});
