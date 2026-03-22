import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import HabitMenu from './HabitMenu';

// Mock the habitsStore
const mockDispatch = jest.fn();
jest.mock('../../stores/habitsStore', () => ({
	useHabitsStore: (selector) => selector({ habitsDispatch: mockDispatch }),
}));

// Mock CSS module
jest.mock('../../css/HabitMenu.module.css', () => ({}));
jest.mock('../../css/Button.module.css', () => ({}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
	motion: {
		div: ({ children, ...props }) => {
			// Filter out framer-motion specific props
			const {
				initial, animate, exit, transition,
				drag, dragConstraints, dragElastic, onDragEnd,
				layout, ...domProps
			} = props;
			return <div {...domProps}>{children}</div>;
		},
	},
	AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
	Link: ({ children, to, state }) => <a href={to}>{children}</a>,
}));

// Mock react-icons
jest.mock('react-icons/md', () => ({
	MdEditSquare: () => <span>EditIcon</span>,
	MdLibraryBooks: () => <span>BooksIcon</span>,
}));
jest.mock('react-icons/fa', () => ({
	FaShareAltSquare: () => <span>ShareIcon</span>,
	FaCalendarCheck: () => <span>CalCheckIcon</span>,
	FaCalendarTimes: () => <span>CalTimesIcon</span>,
}));
jest.mock('react-icons/fa6', () => ({
	FaChartSimple: () => <span>ChartIcon</span>,
}));
jest.mock('react-icons/io', () => ({
	IoIosArrowForward: () => <span>ArrowIcon</span>,
}));

const baseProps = {
	title: 'Test Habit',
	completedDays: [],
	colorIndex: 0,
	colorPalette: { baseColor: '#fff', darkenedColor: '#ccc' },
	isTodayCompleted: false,
	isYesterdayCompleted: false,
	todayProgress: 0,
	frequency: 1,
	currentStreak: 5,
	onShowMenu: jest.fn(),
	onShare: jest.fn(),
};

describe('HabitMenu Next Stage button', () => {
	beforeEach(() => {
		mockDispatch.mockClear();
	});

	it('shows "Next Stage" button for manual-mode progressive habit not at max stage', () => {
		render(
			<HabitMenu
				{...baseProps}
				isProgressive={true}
				progressionMode="manual"
				stages={['Stage 1', 'Stage 2', 'Stage 3']}
				currentStage={0}
			/>
		);

		expect(screen.getByText('Next Stage')).toBeInTheDocument();
	});

	it('does NOT show "Next Stage" button for non-progressive habits', () => {
		render(
			<HabitMenu
				{...baseProps}
				isProgressive={false}
				stages={[]}
				currentStage={0}
				progressionMode="manual"
			/>
		);

		expect(screen.queryByText('Next Stage')).not.toBeInTheDocument();
	});

	it('does NOT show "Next Stage" button when at max stage', () => {
		render(
			<HabitMenu
				{...baseProps}
				isProgressive={true}
				progressionMode="manual"
				stages={['Stage 1', 'Stage 2']}
				currentStage={1}
			/>
		);

		expect(screen.queryByText('Next Stage')).not.toBeInTheDocument();
	});

	it('does NOT show "Next Stage" button for auto mode', () => {
		render(
			<HabitMenu
				{...baseProps}
				isProgressive={true}
				progressionMode="auto"
				stages={['Stage 1', 'Stage 2']}
				currentStage={0}
			/>
		);

		expect(screen.queryByText('Next Stage')).not.toBeInTheDocument();
	});

	it('dispatches progressStage action when "Next Stage" is clicked', () => {
		render(
			<HabitMenu
				{...baseProps}
				title="My Progressive Habit"
				isProgressive={true}
				progressionMode="manual"
				stages={['Stage 1', 'Stage 2', 'Stage 3']}
				currentStage={0}
			/>
		);

		fireEvent.click(screen.getByText('Next Stage'));

		expect(mockDispatch).toHaveBeenCalledWith({
			type: 'progressStage',
			habitTitle: 'My Progressive Habit',
		});
	});

	it('does NOT show "Next Stage" when isProgressive is undefined', () => {
		render(<HabitMenu {...baseProps} />);

		expect(screen.queryByText('Next Stage')).not.toBeInTheDocument();
	});
});
