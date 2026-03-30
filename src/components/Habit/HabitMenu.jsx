import styles from '../../css/HabitMenu.module.css';

// router
import { Link } from 'react-router-dom';

// framer
import { motion } from 'framer-motion'

// stores
import { useHabitsStore } from '../../stores/habitsStore';

// components
import Button from '../Button';

// utils
import checkHabitCompletion from '../../utils/checkHabitCompletion';
import getFormattedDate from '../../utils/getFormattedDate';

// icons
import { MdEditSquare } from 'react-icons/md'; // edit
import { MdLibraryBooks } from 'react-icons/md'; // diary
import { FaShareAltSquare } from 'react-icons/fa';
import { FaCalendarCheck } from 'react-icons/fa';
import { FaCalendarTimes } from 'react-icons/fa';
import { FaRegSnowflake } from 'react-icons/fa';
import { FaChartSimple } from 'react-icons/fa6';
import { IoIosArrowForward } from 'react-icons/io'; // next stage
import { IoIosArrowBack } from 'react-icons/io'; // previous stage

// --- Variants:START ---
const bgVariants = {
	initial: { opacity: 0 },
	animate: { opacity: 1 },
	exit: { opacity: 0 },
	transition: { duration: .2, ease: 'easeOut' }
};

const contentVariants = {
	initial: { y: '100%' },
	animate: { y: 0 },
	exit: { y: '100%' },
	transition: { duration: .2, ease: 'easeOut' }
};
// --- Variants:END ---

function HabitMenu(props) {
	const {
		title, completedDays, colorIndex, colorPalette,
		frequency, periodDays, currentStreak, selectedDate,
		onShowMenu, onShare,
		isProgressive, progressionMode, currentStage, stages,
	} = props;

	const habitsDispatch = useHabitsStore((s) => s.habitsDispatch);
	const { darkenedColor } = colorPalette;

	const isSelectedCompleted = checkHabitCompletion(completedDays, frequency, periodDays, selectedDate);

	const todayStr = getFormattedDate(new Date());
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	const yesterdayStr = getFormattedDate(yesterday);
	const selectedStr = getFormattedDate(selectedDate);

	const isSelectedToday = selectedStr === todayStr;
	const isSelectedYesterday = selectedStr === yesterdayStr;

	const dateLabel = isSelectedToday ? 'today'
		: isSelectedYesterday ? 'yesterday'
		: selectedDate.toLocaleDateString('en', { month: 'short', day: 'numeric' });

	const buttonLabel = (isSelectedCompleted ? 'Undo ' : 'Do ') + dateLabel;

	const handleDragEnd = (_, info) => {
		if (info.offset.y >= 100) {
			onShowMenu(-1);
			navigator.vibrate?.(10);
		};
	};

	const handleToggleDayCompletion = () => {
		const entryFlags = isSelectedYesterday ? { isCompYdayBtnUsed: true } : {};
		habitsDispatch({
			type: 'toggleDayCompletion',
			habitTitle: title,
			date: selectedStr,
			isCompleted: isSelectedCompleted,
			frequency,
			entryFlags,
		});
	};

	const isFrozen = completedDays.some((d) => d.date === selectedStr && d.freeze);
	const freezeLabel = (isFrozen ? 'Unfreeze ' : 'Freeze ') + dateLabel;

	const handleToggleDayFreeze = () => {
		habitsDispatch({
			type: 'toggleDayFreeze',
			habitTitle: title,
			date: selectedStr,
			isFrozen,
		});
	};

	const handleNextStage = () => {
		habitsDispatch({
			type: 'progressStage',
			habitTitle: title,
		});
	};

	const handlePreviousStage = () => {
		habitsDispatch({
			type: 'regressStage',
			habitTitle: title,
		});
	};

	const showNextStageButton = isProgressive
		&& progressionMode === 'manual'
		&& currentStage < stages.length - 1;

	const showPreviousStageButton = isProgressive
		&& progressionMode === 'manual'
		&& currentStage > 0;

	const buttons = [
	...(isFrozen ? [] : [[
		isSelectedCompleted ? <FaCalendarTimes /> : <FaCalendarCheck />,
		buttonLabel,
		isSelectedCompleted ? 'IndianRed' : darkenedColor,
		null,
		null,
		() => handleToggleDayCompletion()
	]]), [
		<FaRegSnowflake />,
		freezeLabel,
		darkenedColor,
		null,
		null,
		() => handleToggleDayFreeze()
	], [
		<MdEditSquare />,
		'Edit Habit',
		darkenedColor,
		'/modal/habitEditor',
		{
			habitTitle: title,
			modalTitle: 'Edit habit',
		},
		null,
		true
	], [
		<FaShareAltSquare />,
		'Share Habit',
		darkenedColor,
		null,
		null,
		() => onShare()
	], [
		<FaChartSimple />,
		'Statistics',
		darkenedColor,
		'/modal/statistics',
		{
			completedDays,
			colorPalette,
			colorIndex,
			frequency,
			periodDays,
			modalTitle: title,
		},
		null,
		true
	], [
		<MdLibraryBooks />,
		'Diary',
		darkenedColor,
		'/modal/diary',
		{
			currentStreak,
			habitTitle: title,
			colorIndex: colorIndex,
			modalTitle: title,
		},
		null,
		true
	],
	...(showPreviousStageButton ? [[
		<IoIosArrowBack />,
		'Previous Stage',
		darkenedColor,
		null,
		null,
		() => handlePreviousStage()
	]] : []),
	...(showNextStageButton ? [[
		<IoIosArrowForward />,
		'Next Stage',
		darkenedColor,
		null,
		null,
		() => handleNextStage()
	]] : [])
	].map(
		([icon, text, bgColor, to, state, onClick, arrow]) => (
			<li key={text}>
				<Link to={to ? (process.env.PUBLIC_URL + to) : null} state={state}>
					<Button {...{ icon, text, bgColor, onClick, arrow }} />
				</Link>
			</li>
		)
	);

	return (
		<motion.div
			data-name='habitMenu'
			className={styles.menu}
			{...bgVariants}
		>
			<motion.div
				className={styles.content}
				{...contentVariants}

				drag='y'
				dragConstraints={{ top: 0, bottom: 0 }}
				dragElastic={{ top: 0.1, bottom: 1 }}
				onDragEnd={handleDragEnd}

				onClick={(e) => e.stopPropagation()}
			>
				<div className={styles.handle} />
				<h3 className={styles.title}>{title}</h3>

				<ul
					className={styles.list}
					onClick={() => onShowMenu(-1)}
				>
					{buttons}
				</ul>
			</motion.div>
		</motion.div >
	);
}

export default HabitMenu;
