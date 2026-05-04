import styles from "./styles.module.css";

interface RecipeBasicsFormProps {
  title: string;
  description: string;
  servings: number;
  component: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onServingsChange: (value: number) => void;
  onComponentChange: (value: boolean) => void;
}

export default function RecipeBasicsForm({
  title,
  description,
  servings,
  component,
  onTitleChange,
  onDescriptionChange,
  onServingsChange,
  onComponentChange,
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

        <div className={`${styles.formGroup} ${styles.checkboxRow}`}>
          <input
            id="component"
            type="checkbox"
            checked={component ?? false}
            onChange={(e) => onComponentChange(e.target.checked)}
            className={styles.checkbox}
          />
          <label htmlFor="component" className={styles.label}>
            Can be used as a component
          </label>
        </div>
      </section>
    </>
  );
}
