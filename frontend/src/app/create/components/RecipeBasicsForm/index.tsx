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
            食谱名称
          </label>
          <input
            id="title"
            type="text"
            placeholder="输入食谱名称..."
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            required
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description" className={styles.label}>
            简介
          </label>
          <textarea
            id="description"
            placeholder="菜谱简介..."
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            required
            className={styles.textarea}
            rows={4}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="servings" className={styles.label}>
            份数
          </label>
          <input
            id="servings"
            type="number"
            placeholder="4"
            value={servings}
            onChange={(e) => onServingsChange(Number(e.target.value))}
            min="1"
            className={styles.input}
          />
        </div>
      </section>
    </>
  );
}
