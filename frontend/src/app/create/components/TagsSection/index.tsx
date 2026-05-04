import styles from "./styles.module.css";
import { COMPONENT_TAG } from "../../../utils/recipeTags";

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
        <h2>Tags</h2>
      </div>

      <div className={styles.tagInputRow}>
        <input
          type="text"
          placeholder="Add tags"
          value={tagsInput}
          onChange={(e) => onTagsInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onAddTag())}
          className={styles.input}
        />
        <button type="button" className={styles.addTagButton} onClick={onAddTag} aria-label="Add tag">
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>

      {tags && tags.length > 0 && (
        <div className={styles.tagsList}>
          {tags.map((tag, idx) => tag === COMPONENT_TAG ? null : (
            <span key={idx} className={styles.tag}>
              {tag}
              <button
                type="button"
                onClick={() => onRemoveTag(idx)}
                className={styles.tagRemove}
                aria-label={`Remove ${tag}`}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
