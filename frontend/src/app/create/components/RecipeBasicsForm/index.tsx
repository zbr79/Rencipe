import styles from "./styles.module.css";
import { HEALTH_TAG_OPTIONS } from "../../../utils/recipeTags";

interface RecipeBasicsFormProps {
  title: string;
  description: string;
  servings: number;
  component: boolean;
  healthTag: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onServingsChange: (value: number) => void;
  onComponentChange: (value: boolean) => void;
  onHealthTagChange: (value: string) => void;
}

export default function RecipeBasicsForm({
  title,
  description,
  servings,
  component,
  healthTag,
  onTitleChange,
  onDescriptionChange,
  onServingsChange,
  onComponentChange,
  onHealthTagChange,
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

        <div className={styles.formGroup}>
          <label htmlFor="healthTag" className={styles.label}>
            Health Tag
          </label>
          <select
            id="healthTag"
            value={healthTag}
            onChange={(e) => onHealthTagChange(e.target.value)}
            className={styles.input}
          >
            <option value="">No health tag</option>
            {HEALTH_TAG_OPTIONS.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
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
