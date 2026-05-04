import styles from "./styles.module.css";

interface RecipeBasicsFormProps {
  title: string;
  description: string;
  servings: number;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onServingsChange: (value: number) => void;
}

export default function RecipeBasicsForm({
  title,
  description,
  servings,
  onTitleChange,
  onDescriptionChange,
  onServingsChange,
}: RecipeBasicsFormProps) {
  return (
    <>
      {/* Recipe Basics */}
      <section className={styles.section}>
        <div className={styles.formGroup}>
          <label htmlFor="title" className={styles.label}>
            Recipe Name
          </label>
          <input
            id="title"
            type="text"
            placeholder="Enter recipe name..."
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            required
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description" className={styles.label}>
            Description
          </label>
          <textarea
            id="description"
            placeholder="Describe the recipe..."
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            required
            className={styles.textarea}
            rows={4}
          />
        </div>
      </section>
    </>
  );
}
