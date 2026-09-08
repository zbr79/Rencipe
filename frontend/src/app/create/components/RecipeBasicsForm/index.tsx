import styles from "./styles.module.css";

interface RecipeBasicsFormProps {
  title: string;
  subtitle: string;
  description: string;
  isPublic: boolean;
  publishDisabled?: boolean;
  invalidTitle?: boolean;
  invalidDescription?: boolean;
  onTitleChange: (value: string) => void;
  onSubtitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onPublishChange: (checked: boolean) => void | Promise<void>;
}

export default function RecipeBasicsForm({
  title,
  subtitle,
  description,
  isPublic,
  publishDisabled = false,
  invalidTitle = false,
  invalidDescription = false,
  onTitleChange,
  onSubtitleChange,
  onDescriptionChange,
  onPublishChange,
}: RecipeBasicsFormProps) {
  return (
    <section className={styles.section}>
      <div className={styles.titleRow}>
        <div className={`${styles.formGroup} ${styles.titleGroup}`}>
          <label htmlFor="title" className={`${styles.label} ${invalidTitle ? styles.labelInvalid : ""}`}>
            Recipe Name
          </label>
          <input
            id="title"
            type="text"
            placeholder="Enter recipe name..."
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            required
            aria-invalid={invalidTitle}
            className={`${styles.input} ${invalidTitle ? styles.inputInvalid : ""}`}
          />
        </div>

        <label
          className={`${styles.publishToggle} ${isPublic ? styles.publishToggleActive : ""} ${publishDisabled ? styles.publishToggleDisabled : ""}`}
          htmlFor="publish-toggle"
        >
          <input
            id="publish-toggle"
            type="checkbox"
            checked={isPublic}
            disabled={publishDisabled}
            onChange={(e) => {
              void onPublishChange(e.target.checked);
            }}
            className={styles.publishCheckbox}
          />
          <span className={styles.publishSwitch} aria-hidden="true">
            <span className={styles.publishKnob} />
          </span>
          <span className={styles.publishLabel}>Publish</span>
        </label>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="subtitle" className={styles.label}>
          Second name
        </label>
        <input
          id="subtitle"
          type="text"
          placeholder="Original or alternative name, e.g. Har Gow — Steamed Shrimp Dumplings"
          value={subtitle}
          onChange={(e) => onSubtitleChange(e.target.value)}
          className={styles.input}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="description" className={`${styles.label} ${invalidDescription ? styles.labelInvalid : ""}`}>
          Description
        </label>
        <textarea
          id="description"
          placeholder="Describe the recipe..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          required
          aria-invalid={invalidDescription}
          className={`${styles.textarea} ${invalidDescription ? styles.inputInvalid : ""}`}
          rows={4}
        />
      </div>
    </section>
  );
}
