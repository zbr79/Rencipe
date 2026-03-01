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

      <div className={styles.tagsForm}>
        <input
          type="text"
          placeholder="输入标签并按回车..."
          value={tagsInput}
          onChange={(e) => onTagsInputChange(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), onAddTag())}
          className={styles.input}
        />
        <button type="button" onClick={onAddTag} className={styles.addBtn}>
          + 添加
        </button>
      </div>

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
