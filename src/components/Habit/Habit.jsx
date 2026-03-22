import styles from '../../css/Habit.module.css';

// react
import { useCallback, useMemo, useRef, useState } from 'react';

// framer
import { AnimatePresence, motion } from 'framer-motion';

// stores
import { useSettingsStore } from '../../stores/settingsStore';

// components
import HabitHeader from './HabitHeader';
import Calendar from './Calendar';
import CompactCalendar from './CompactCalendar';
import HabitMenu from './HabitMenu';

// utils
import getColorPalette from '../../utils/getColorPalette';
import getTodayProgress from '../../utils//getTodayProgress';
import getStreaks from '../../utils/getStreaks';
import getNegativeStreak from '../../utils/getNegativeStreak';
import checkHabitCompletion from '../../utils/checkHabitCompletion';
import shareHabit from '../../utils/shareHabit';
import getListAnimationVariants from '../../utils/getListAnimationVariants';

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);

function Habit(props) {
	const {
		index, color, completedDays, frequency, periodDays,
		isMenuVisible, isArchive, isNegative, creationDate,
		onShowMenu
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
			/>

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