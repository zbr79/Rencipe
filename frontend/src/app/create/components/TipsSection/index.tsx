import styles from "./styles.module.css";

interface TipsSectionProps {
  tips: string;
  onTipsChange: (value: string) => void;
}

export default function TipsSection({ tips, onTipsChange }: TipsSectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>Tips</h2>
      </div>

      <textarea
        id="recipe-tips"
        placeholder="Add extra cooking tips, substitutions, serving notes, or anything helpful."
        value={tips}
        onChange={(event) => onTipsChange(event.target.value)}
        className={styles.textarea}
        rows={4}
      />
    </section>
  );
}