import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import NoteInput from './NoteInput';

// Mock CSS module
jest.mock('../../css/NoteInput.module.css', () => ({
	row: 'row',
	input: 'input',
	button: 'button',
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
	motion: {
		div: ({ children, ...props }) => {
			const {
				initial, animate, exit, transition,
				...domProps
			} = props;
			return <div {...domProps}>{children}</div>;
		},
	},
	AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock react-icons
jest.mock('react-icons/fa', () => ({
	FaCheck: () => <span data-testid="check-icon">check</span>,
	FaTimes: () => <span data-testid="times-icon">times</span>,
}));

const baseProps = {
	onSubmit: jest.fn(),
	onDismiss: jest.fn(),
	colorPalette: { baseColor: '#4CAF50', darkenedColor: '#2E7D32' },
};

describe('NoteInput', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		baseProps.onSubmit.mockClear();
		baseProps.onDismiss.mockClear();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('calls onDismiss after 6 seconds', () => {
		render(<NoteInput {...baseProps} />);

		expect(baseProps.onDismiss).not.toHaveBeenCalled();

		act(() => {
			jest.advanceTimersByTime(6000);
		});

		expect(baseProps.onDismiss).toHaveBeenCalledTimes(1);
	});

	it('focus cancels auto-close timer', () => {
		render(<NoteInput {...baseProps} />);

		const input = screen.getByPlaceholderText('Add a note...');
		fireEvent.focus(input);

		act(() => {
			jest.advanceTimersByTime(6000);
		});

		expect(baseProps.onDismiss).not.toHaveBeenCalled();
	});

	it('X button calls onDismiss', () => {
		render(<NoteInput {...baseProps} />);

		const dismissButton = screen.getByTestId('times-icon').closest('button');
		fireEvent.click(dismissButton);

		expect(baseProps.onDismiss).toHaveBeenCalledTimes(1);
	});

	it('tick button calls onSubmit with entered text', () => {
		render(<NoteInput {...baseProps} />);

		const input = screen.getByPlaceholderText('Add a note...');
		fireEvent.change(input, { target: { value: 'ran in the rain' } });

		const submitButton = screen.getByTestId('check-icon').closest('button');
		fireEvent.click(submitButton);

		expect(baseProps.onSubmit).toHaveBeenCalledWith('ran in the rain');
	});

	it('tick button is disabled when input is empty', () => {
		render(<NoteInput {...baseProps} />);

		const submitButton = screen.getByTestId('check-icon').closest('button');
		expect(submitButton).toBeDisabled();
	});

	it('tick button is disabled when input contains only whitespace', () => {
		render(<NoteInput {...baseProps} />);

		const input = screen.getByPlaceholderText('Add a note...');
		fireEvent.change(input, { target: { value: '   ' } });

		const submitButton = screen.getByTestId('check-icon').closest('button');
		expect(submitButton).toBeDisabled();
	});

	it('input does not have autoFocus attribute', () => {
		render(<NoteInput {...baseProps} />);

		const input = screen.getByPlaceholderText('Add a note...');
		expect(input).not.toHaveAttribute('autoFocus');
		// Also check the lowercase HTML attribute
		expect(input.autofocus).toBeFalsy();
	});
});
