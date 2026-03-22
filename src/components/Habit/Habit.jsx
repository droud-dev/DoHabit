import styles from '../../css/Habit.module.css';

// react
import { useCallback, useMemo, useRef, useState } from 'react';

// framer
import { AnimatePresence, motion } from 'framer-motion';

// stores
import { useSettingsStore } from '../../stores/settingsStore';
import { useHabitsStore } from '../../stores/habitsStore';

// components
import HabitHeader from './HabitHeader';
import Calendar from './Calendar';
import CompactCalendar from './CompactCalendar';
import HabitMenu from './HabitMenu';
import NoteInput from './NoteInput';

// utils
import getColorPalette from '../../utils/getColorPalette';
import getTodayProgress from '../../utils//getTodayProgress';
import getStreaks from '../../utils/getStreaks';
import getNegativeStreak from '../../utils/getNegativeStreak';
import checkHabitCompletion from '../../utils/checkHabitCompletion';
import shareHabit from '../../utils/shareHabit';
import getListAnimationVariants from '../../utils/getListAnimationVariants';
import getFormattedDate from '../../utils/getFormattedDate';

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);

function Habit(props) {
	const {
		index, color, completedDays, frequency, periodDays,
		isMenuVisible, isArchive, isNegative, creationDate,
		onShowMenu, title
	} = props;

	const settings = useSettingsStore((s) => s.settings);
	const habitRef = useRef(null);
	const colorPalette = useMemo(() => getColorPalette(color), [color]);
	const todayProgress = getTodayProgress(completedDays);
	const { currentStreak } = isNegative
		? { currentStreak: getNegativeStreak(completedDays, frequency, creationDate) }
		: getStreaks(completedDays, frequency, periodDays);

	const [selectedDate, setSelectedDate] = useState(yesterday);

	const isTodayCompleted = useMemo(
		() => checkHabitCompletion(completedDays, frequency, periodDays, today),
		[completedDays, frequency, periodDays]
	);

	const habitsDispatch = useHabitsStore((s) => s.habitsDispatch);
	const [noteInputKey, setNoteInputKey] = useState(0);

	const handleProgressTap = () => setNoteInputKey(k => k + 1);

	const handleNoteSubmit = (text) => {
		habitsDispatch({
			type: 'addNote',
			habitTitle: title,
			newNote: { text, date: getFormattedDate(new Date()), streak: currentStreak }
		});
		setNoteInputKey(0);
	};

	const handleNoteDismiss = () => setNoteInputKey(0);

	const handleCellClick = useCallback((date) => {
		setSelectedDate(date);
		onShowMenu(index);
	}, [onShowMenu, index]);

	const handleShowMenu = (i) => {
		if (i === -1) setSelectedDate(yesterday);
		onShowMenu(i);
	};

	const handleShare = () => shareHabit(habitRef.current);

	const calendar = useMemo(
		() => {
			const props = { colorPalette, completedDays, frequency, periodDays, isNegative, onCellClick: handleCellClick };

			return settings.calendarView === 'compact' ? (
				<CompactCalendar {...props} />
			) : (
				<Calendar {...props} />
			);
		},
		[colorPalette, completedDays, frequency, periodDays, isNegative, settings.calendarView, handleCellClick]
	);

	const habitVariants = getListAnimationVariants(0.3);

	return (
		<motion.div
			ref={habitRef}
			className={styles.habit}
			{...habitVariants}
			layout
			onClick={() => { setSelectedDate(yesterday); onShowMenu(index); }}
		>
			<HabitHeader
				{...{ ...props, colorPalette }}
				{...{ isTodayCompleted, todayProgress, currentStreak }}
				onProgressTap={handleProgressTap}
			/>

			<AnimatePresence>
				{noteInputKey > 0 && (
					<NoteInput
						key={noteInputKey}
						onSubmit={handleNoteSubmit}
						onDismiss={handleNoteDismiss}
						colorPalette={colorPalette}
					/>
				)}
			</AnimatePresence>

			{!isArchive && (
				<div className={styles.content}>
					{calendar}
				</div>
			)}

			<AnimatePresence>
				{(isMenuVisible && !isArchive) && (
					<HabitMenu
						key="habitMenu"
						{...props}
						{...{ colorPalette, currentStreak, selectedDate }}
						onShowMenu={handleShowMenu}
						onShare={handleShare}
					/>
				)}
			</AnimatePresence>
		</motion.div>
	);
}

export default Habit;