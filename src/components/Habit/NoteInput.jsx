import styles from '../../css/NoteInput.module.css';

// react
import { useEffect, useRef, useState } from 'react';

// framer
import { motion } from 'framer-motion';

// icons
import { FaCheck, FaTimes } from 'react-icons/fa';

// --- Variants:START ---
const noteInputVariants = {
	initial: { opacity: 0, y: -8 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -8 },
	transition: { duration: 0.2, ease: 'easeOut' },
};
// --- Variants:END ---

function NoteInput({ onSubmit, onDismiss, colorPalette }) {
	const [text, setText] = useState('');
	const timerRef = useRef(null);
	const { baseColor, darkenedColor } = colorPalette;

	useEffect(() => {
		timerRef.current = setTimeout(onDismiss, 6000);
		return () => clearTimeout(timerRef.current);
	}, [onDismiss]);

	const handleFocus = () => {
		clearTimeout(timerRef.current);
	};

	return (
		<motion.div
			className={styles.row}
			style={{ backgroundColor: darkenedColor }}
			{...noteInputVariants}
		>
			<button
				className={styles.button}
				style={{ color: 'IndianRed' }}
				onClick={(e) => { e.stopPropagation(); onDismiss(); }}
			>
				<FaTimes />
			</button>

			<input
				className={styles.input}
				type="text"
				value={text}
				onChange={(e) => setText(e.target.value)}
				onFocus={handleFocus}
				placeholder="Add a note..."
			/>

			<button
				className={styles.button}
				style={{ color: baseColor }}
				disabled={text.trim() === ''}
				onClick={(e) => { e.stopPropagation(); onSubmit(text); }}
			>
				<FaCheck />
			</button>
		</motion.div>
	);
}

export default NoteInput;
