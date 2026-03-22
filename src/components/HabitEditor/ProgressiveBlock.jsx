import styles from '../../css/ProgressiveBlock.module.css';

// react
import { useState } from 'react';

function ProgressiveBlock({ currentSettings }) {
	const [isProgressive, setIsProgressive] = useState(
		currentSettings?.isProgressive || false
	);
	const [stages, setStages] = useState(
		currentSettings?.isProgressive && currentSettings?.stages?.length
			? [...currentSettings.stages]
			: ['', '']
	);
	const [progressionMode, setProgressionMode] = useState(
		currentSettings?.progressionMode || 'manual'
	);
	const [progressionInterval, setProgressionInterval] = useState(
		currentSettings?.progressionInterval || 7
	);

	// Preserve existing tracking state for edit mode pass-through
	const currentStage = currentSettings?.currentStage || 0;
	const completionsSinceStageStart = currentSettings?.completionsSinceStageStart || 0;
	const stageAdvancementDate = currentSettings?.stageAdvancementDate || null;

	const handleToggle = () => {
		setIsProgressive((prev) => !prev);
	};

	const handleStageChange = (index, value) => {
		setStages((prev) => {
			const updated = [...prev];
			updated[index] = value;
			return updated;
		});
	};

	const handleAddStage = () => {
		setStages((prev) => [...prev, '']);
	};

	const handleRemoveStage = (index) => {
		setStages((prev) => prev.filter((_, i) => i !== index));
	};

	const canRemoveStage = stages.length > 2;

	return (
		<section>
			<div className={styles.header}>
				<h3>Progressive Stages</h3>
			</div>

			<div className={styles.toggleRow}>
				<input
					type="checkbox"
					id="progressiveToggle"
					checked={isProgressive}
					onChange={handleToggle}
				/>
				<label htmlFor="progressiveToggle">
					Enable Progressive Stages
				</label>
			</div>

			{isProgressive && (
				<div className={styles.content}>
					{stages.map((stage, index) => (
						<div key={index} className={styles.stageRow}>
							<span className={styles.stageLabel}>{index + 1}.</span>
							<input
								type="text"
								className={styles.stageInput}
								value={stage}
								onChange={(e) => handleStageChange(index, e.target.value)}
								placeholder={`Stage ${index + 1} description`}
								aria-label={`Stage ${index + 1} description`}
							/>
							<button
								type="button"
								className={styles.removeBtn}
								onClick={() => handleRemoveStage(index)}
								disabled={!canRemoveStage}
								aria-label={`Remove stage ${index + 1}`}
							>
								Remove
							</button>
						</div>
					))}

					<button
						type="button"
						className={styles.addBtn}
						onClick={handleAddStage}
					>
						Add Stage
					</button>

					<div className={styles.modeSection}>
						<span className={styles.modeLabel}>Progression Mode</span>
						<div className={styles.modeRow}>
							<label>
								<input
									type="radio"
									name="progressionModeRadio"
									value="manual"
									checked={progressionMode === 'manual'}
									onChange={() => setProgressionMode('manual')}
								/>
								Manual
							</label>
							<label>
								<input
									type="radio"
									name="progressionModeRadio"
									value="auto"
									checked={progressionMode === 'auto'}
									onChange={() => setProgressionMode('auto')}
								/>
								Automatic
							</label>
						</div>
					</div>

					{progressionMode === 'auto' && (
						<div className={styles.intervalRow}>
							<span className={styles.intervalLabel}>Advance every</span>
							<input
								type="number"
								className={styles.intervalInput}
								value={progressionInterval}
								onChange={(e) => setProgressionInterval(
									Math.max(1, parseInt(e.target.value, 10) || 1)
								)}
								min={1}
							/>
							<span className={styles.intervalLabel}>completions</span>
						</div>
					)}
				</div>
			)}

			{/* Hidden inputs for form submission */}
			<input type="hidden" name="isProgressive" value={String(isProgressive)} />
			<input type="hidden" name="stages" value={JSON.stringify(isProgressive ? stages : [])} />
			<input type="hidden" name="progressionMode" value={progressionMode} />
			<input type="hidden" name="progressionInterval" value={String(progressionInterval)} />
			<input type="hidden" name="currentStage" value={String(currentStage)} />
			<input type="hidden" name="completionsSinceStageStart" value={String(completionsSinceStageStart)} />
			<input type="hidden" name="stageAdvancementDate" value={stageAdvancementDate || ''} />
		</section>
	);
}

export default ProgressiveBlock;
