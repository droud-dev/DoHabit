import styles from '../../css/TitleBlock.module.css';

function TitleBlock({ input, alreadyExist, onChange }) {
	const errorMessage = alreadyExist
		? (input ? 'A habit with this name already exists.' : 'Title field cannot be empty.')
		: '';

	return (
		<section>
			<div className={styles.header}>
				<h3>Title</h3>

				{alreadyExist && (
					<small className={styles.errorMessage}>
						{errorMessage}
					</small>
				)}
			</div>

			<input type="text" name="title" id="title"
				className={`${styles.input} ${alreadyExist ? styles.alreadyExist : ''}`}
				value={input}
				onChange={(e) => onChange(e.target.value)}
				placeholder="Enter habit title"
			/>
		</section>
	);
}

export default TitleBlock;