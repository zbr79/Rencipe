import styles from "./styles.module.css";

interface TagsSectionProps {
  tags: string[];
  tagsInput: string;
  onTagsInputChange: (value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (index: number) => void;
}

export default function TagsSection({
  tags,
  tagsInput,
  onTagsInputChange,
  onAddTag,
  onRemoveTag,
}: TagsSectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>标签</h2>
      </div>

      <input
        type="text"
        placeholder="按回车键添加标签"
        value={tagsInput}
        onChange={(e) => onTagsInputChange(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), onAddTag())}
        className={styles.input}
      />

      {tags && tags.length > 0 && (
        <div className={styles.tagsList}>
          {tags.map((tag, idx) => (
            <span key={idx} className={styles.tag}>
              {tag}
              <button
                type="button"
                onClick={() => onRemoveTag(idx)}
                className={styles.tagRemove}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
