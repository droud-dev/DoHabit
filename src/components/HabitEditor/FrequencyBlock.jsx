import styles from '../../css/FrequencyBlock.module.css';

// react
import { useState } from 'react';

function FrequencyBlock({ currentFrequency, currentPeriodDays }) {
	const [frequency, setFrequency] = useState(currentFrequency || 1);
	const maxFrequency = 6;

	const [periodDays, setPeriodDays] = useState(currentPeriodDays || 1);
	const maxPeriodDays = 90;

	const handleFrequencyClick = (dir) => {
		setFrequency((curr) => {
			if (dir === 'decrease') {
				return Math.max(1, curr - 1);
			};

			if (dir === 'increase') {
				return Math.min(maxFrequency, curr + 1);
			};

			return curr;
		});
	};

	const handlePeriodClick = (dir) => {
		setPeriodDays((curr) => {
			if (dir === 'decrease') {
				return Math.max(1, curr - 1);
			};

			if (dir === 'increase') {
				return Math.min(maxPeriodDays, curr + 1);
			};

			return curr;
		});
	};

	return (
		<section>
			<div className={styles.header}>
				<h3>Frequency</h3>
			</div>

			<div className={styles.content}>
				<button
					type="button"
					className={styles.btn}
					onClick={() => handleFrequencyClick('decrease')}
					disabled={frequency <= 1}
				>
					-
				</button>

				<div className={styles.left}>
					<input type="number" name="frequency" id="frequency"
						className={`${styles.input}`}
						value={frequency}
						tabIndex={-1}
						readOnly
					/>

					<div>{frequency === 1 ? 'time' : 'times'}</div>
				</div>

				<button
					type="button"
					className={styles.btn}
					onClick={() => handleFrequencyClick('increase')}
					disabled={frequency >= maxFrequency}
				>
					+
				</button>

				<div className={styles.separator}>/</div>

				<button
					type="button"
					className={styles.btn}
					onClick={() => handlePeriodClick('decrease')}
					disabled={periodDays <= 1}
				>
					-
				</button>

				<div className={styles.left}>
					<input type="number" name="periodDays" id="periodDays"
						className={`${styles.input}`}
						value={periodDays}
						tabIndex={-1}
						readOnly
					/>

					<div>{periodDays === 1 ? 'day' : 'days'}</div>
				</div>

				<button
					type="button"
					className={styles.btn}
					onClick={() => handlePeriodClick('increase')}
					disabled={periodDays >= maxPeriodDays}
				>
					+
				</button>
			</div>
		</section>
	);
}

export default FrequencyBlock;
