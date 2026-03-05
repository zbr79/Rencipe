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

        <div className={styles.formGroup} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <input
            id="component"
            type="checkbox"
            checked={component ?? false}
            onChange={(e) => onComponentChange(e.target.checked)}
            className={styles.checkbox}
            style={{ width: "20px", height: "20px", cursor: "pointer" }}
          />
          <label htmlFor="component" className={styles.label} style={{ margin: 0, cursor: "pointer" }}>
            可用作膳食计划的组件
          </label>
        </div>
      </section>
    </>
  );
}
