import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import HabitHeader from './HabitHeader';

// Mock the habitsStore
const mockDispatch = jest.fn();
jest.mock('../../stores/habitsStore', () => ({
	useHabitsStore: (selector) => selector({ habitsDispatch: mockDispatch }),
}));

// Mock CSS module
jest.mock('../../css/HabitHeader.module.css', () => ({}));

const baseProps = {
	title: 'Test Habit',
	icon: 'T',
	frequency: 1,
	diary: [],
	colorPalette: { baseColor: '#fff', darkenedColor: '#ccc' },
	isTodayCompleted: false,
	todayProgress: 0,
	currentStreak: 5,
	isArchive: false,
};

describe('HabitHeader stage indicator', () => {
	beforeEach(() => {
		mockDispatch.mockClear();
	});

	it('renders stage indicator for progressive habits', () => {
		render(
			<HabitHeader
				{...baseProps}
				isProgressive={true}
				stages={['Beginner', 'Intermediate', 'Advanced']}
				currentStage={0}
			/>
		);

		expect(screen.getByText(/Stage 1 of 3/)).toBeInTheDocument();
		expect(screen.getByText('Beginner')).toBeInTheDocument();
	});

	it('displays correct 1-based stage number', () => {
		render(
			<HabitHeader
				{...baseProps}
				isProgressive={true}
				stages={['Stage A', 'Stage B', 'Stage C']}
				currentStage={1}
			/>
		);

		expect(screen.getByText(/Stage 2 of 3/)).toBeInTheDocument();
		expect(screen.getByText('Stage B')).toBeInTheDocument();
	});

	it('displays last stage correctly', () => {
		render(
			<HabitHeader
				{...baseProps}
				isProgressive={true}
				stages={['Easy', 'Hard']}
				currentStage={1}
			/>
		);

		expect(screen.getByText(/Stage 2 of 2/)).toBeInTheDocument();
		expect(screen.getByText('Hard')).toBeInTheDocument();
	});

	it('does not render stage indicator for non-progressive habits', () => {
		render(
			<HabitHeader
				{...baseProps}
				isProgressive={false}
				stages={[]}
				currentStage={0}
			/>
		);

		expect(screen.queryByRole('status')).not.toBeInTheDocument();
	});

	it('does not render stage indicator when isProgressive is undefined', () => {
		render(<HabitHeader {...baseProps} />);

		expect(screen.queryByRole('status')).not.toBeInTheDocument();
	});

	it('does not render stage indicator when stages is empty', () => {
		render(
			<HabitHeader
				{...baseProps}
				isProgressive={true}
				stages={[]}
				currentStage={0}
			/>
		);

		expect(screen.queryByRole('status')).not.toBeInTheDocument();
	});

	it('stage indicator has aria-live="polite" and role="status"', () => {
		render(
			<HabitHeader
				{...baseProps}
				isProgressive={true}
				stages={['One', 'Two']}
				currentStage={0}
			/>
		);

		const statusEl = screen.getByRole('status');
		expect(statusEl).toHaveAttribute('aria-live', 'polite');
	});
});
