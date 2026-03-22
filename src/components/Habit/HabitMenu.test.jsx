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
	FaRegSnowflake: () => <span>SnowflakeIcon</span>,
}));
jest.mock('react-icons/fa6', () => ({
	FaChartSimple: () => <span>ChartIcon</span>,
}));
jest.mock('react-icons/io', () => ({
	IoIosArrowForward: () => <span>ArrowIcon</span>,
}));

// Mock checkHabitCompletion - returns false by default
const mockCheckHabitCompletion = jest.fn(() => false);
jest.mock('../../utils/checkHabitCompletion', () => ({
	__esModule: true,
	default: (...args) => mockCheckHabitCompletion(...args),
}));

// Mock getFormattedDate - use real logic for deterministic date strings
jest.mock('../../utils/getFormattedDate', () => ({
	__esModule: true,
	default: (date) => {
		if (!(date instanceof Date)) return 'invalid';
		const y = date.getFullYear();
		const m = String(date.getMonth() + 1).padStart(2, '0');
		const d = String(date.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	},
}));

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

const baseProps = {
	title: 'Test Habit',
	completedDays: [],
	colorIndex: 0,
	colorPalette: { baseColor: '#fff', darkenedColor: '#ccc' },
	frequency: 1,
	currentStreak: 5,
	selectedDate: yesterday,
	onShowMenu: jest.fn(),
	onShare: jest.fn(),
};

describe('HabitMenu Next Stage button', () => {
	beforeEach(() => {
		mockDispatch.mockClear();
		mockCheckHabitCompletion.mockReturnValue(false);
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

describe('HabitMenu dynamic button labels', () => {
	beforeEach(() => {
		mockDispatch.mockClear();
		mockCheckHabitCompletion.mockReturnValue(false);
	});

	it('shows "Do yesterday" when selectedDate is yesterday and not completed', () => {
		mockCheckHabitCompletion.mockReturnValue(false);

		render(<HabitMenu {...baseProps} selectedDate={yesterday} />);

		expect(screen.getByText('Do yesterday')).toBeInTheDocument();
	});

	it('shows "Undo yesterday" when selectedDate is yesterday and is completed', () => {
		mockCheckHabitCompletion.mockReturnValue(true);

		render(<HabitMenu {...baseProps} selectedDate={yesterday} />);

		expect(screen.getByText('Undo yesterday')).toBeInTheDocument();
	});

	it('shows "Do today" when selectedDate is today', () => {
		mockCheckHabitCompletion.mockReturnValue(false);
		const today = new Date();

		render(<HabitMenu {...baseProps} selectedDate={today} />);

		expect(screen.getByText('Do today')).toBeInTheDocument();
	});

	it('shows formatted date label when selectedDate is an arbitrary past date', () => {
		mockCheckHabitCompletion.mockReturnValue(false);
		// Use March 15 of the current year, ensuring it's in the past
		const pastDate = new Date(2025, 2, 15); // March 15, 2025

		render(<HabitMenu {...baseProps} selectedDate={pastDate} />);

		// toLocaleDateString('en', { month: 'short', day: 'numeric' }) => "Mar 15"
		expect(screen.getByText('Do Mar 15')).toBeInTheDocument();
	});
});

describe('HabitMenu Freeze/Unfreeze button', () => {
	beforeEach(() => {
		mockDispatch.mockClear();
		mockCheckHabitCompletion.mockReturnValue(false);
	});

	it('shows "Freeze yesterday" when day is not frozen', () => {
		render(<HabitMenu {...baseProps} selectedDate={yesterday} />);

		expect(screen.getByText('Freeze yesterday')).toBeInTheDocument();
	});

	it('shows "Unfreeze yesterday" when day is frozen', () => {
		const frozenCompletedDays = [{ date: yesterdayStr, progress: 0, freeze: true }];

		render(
			<HabitMenu
				{...baseProps}
				selectedDate={yesterday}
				completedDays={frozenCompletedDays}
			/>
		);

		expect(screen.getByText('Unfreeze yesterday')).toBeInTheDocument();
	});

	it('hides Do/Undo button when day is frozen', () => {
		const frozenCompletedDays = [{ date: yesterdayStr, progress: 0, freeze: true }];

		render(
			<HabitMenu
				{...baseProps}
				selectedDate={yesterday}
				completedDays={frozenCompletedDays}
			/>
		);

		expect(screen.queryByText('Do yesterday')).not.toBeInTheDocument();
		expect(screen.queryByText('Undo yesterday')).not.toBeInTheDocument();
	});

	it('dispatches toggleDayFreeze action when freeze button clicked', () => {
		render(<HabitMenu {...baseProps} selectedDate={yesterday} />);

		fireEvent.click(screen.getByText('Freeze yesterday'));

		expect(mockDispatch).toHaveBeenCalledWith({
			type: 'toggleDayFreeze',
			habitTitle: 'Test Habit',
			date: yesterdayStr,
			isFrozen: false,
		});
	});

	it('dispatches toggleDayFreeze action with isFrozen=true when unfreeze button clicked', () => {
		const frozenCompletedDays = [{ date: yesterdayStr, progress: 0, freeze: true }];

		render(
			<HabitMenu
				{...baseProps}
				selectedDate={yesterday}
				completedDays={frozenCompletedDays}
			/>
		);

		fireEvent.click(screen.getByText('Unfreeze yesterday'));

		expect(mockDispatch).toHaveBeenCalledWith({
			type: 'toggleDayFreeze',
			habitTitle: 'Test Habit',
			date: yesterdayStr,
			isFrozen: true,
		});
	});
});
