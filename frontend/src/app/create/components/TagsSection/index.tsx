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

      <input
        type="text"
        placeholder="Press Enter to add a tag"
        value={tagsInput}
        onChange={(e) => onTagsInputChange(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), onAddTag())}
        className={styles.input}
      />

      {tags && tags.length > 0 && (
        <div className={styles.tagsList}>
          {tags.map((tag, idx) => tag === COMPONENT_TAG ? null : (
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
