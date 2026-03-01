"use client";

import styles from "./styles.module.css";

interface Step {
  stepNumber: number;
  instruction: string;
  image?: string;
}

interface StepsSectionProps {
  steps: Step[];
  stepImages: { [key: number]: string };
  onStepsChange: (steps: Step[]) => void;
  onStepImageChange: (e: React.ChangeEvent<HTMLInputElement>, stepNumber: number) => void;
  onRemoveStep: (index: number) => void;
  onRemoveStepImage?: (stepNumber: number) => void;
  onAddStep: () => void;
}

export default function StepsSection({
  steps,
  stepImages,
  onStepsChange,
  onStepImageChange,
  onRemoveStep,
  onRemoveStepImage,
  onAddStep,
}: StepsSectionProps) {
  const handleInstructionChange = (index: number, instruction: string) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], instruction };
    onStepsChange(updated);
  };

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>烹饪步骤</h2>
        <span className={styles.infoIcon}>ⓘ</span>
      </div>

      <div className={styles.stepsList}>
        {steps.map((step, idx) => (
          <div key={idx} className={styles.stepContainer}>
            <div className={styles.stepHeader}>
              <h3 className={styles.stepTitle}>步骤 {step.stepNumber}</h3>
              <button
                type="button"
                onClick={() => onRemoveStep(idx)}
                className={styles.deleteBtn}
              >
                ✕
              </button>
            </div>

            <div className={styles.stepContent}>
              {/* Image Upload Area */}
              <div className={styles.imageUploadArea}>
                {stepImages[step.stepNumber] ? (
                  <div className={styles.imageContainer}>
                    <img 
                      src={stepImages[step.stepNumber]} 
                      alt={`Step ${step.stepNumber}`}
                      className={styles.stepImage}
                    />
                    <div className={styles.imageActions}>
                      <label htmlFor={`file-${idx}`} className={styles.changeImageLabel}>
                        更换图片
                      </label>
                      {onRemoveStepImage && (
                        <button
                          type="button"
                          onClick={() => onRemoveStepImage(step.stepNumber)}
                          className={styles.removeImageBtn}
                        >
                          删除图片
                        </button>
                      )}
                    </div>
                    <input
                      id={`file-${idx}`}
                      type="file"
                      accept="image/*"
                      onChange={(e) => onStepImageChange(e, step.stepNumber)}
                      style={{ display: "none" }}
                    />
                  </div>
                ) : (
                  <label htmlFor={`file-${idx}`} className={styles.uploadPlaceholder}>
                    <div className={styles.uploadIcon}>+ 步骤图</div>
                    <div className={styles.uploadText}>清晰的步骤会让菜谱更受欢迎</div>
                    <input
                      id={`file-${idx}`}
                      type="file"
                      accept="image/*"
                      onChange={(e) => onStepImageChange(e, step.stepNumber)}
                      style={{ display: "none" }}
                    />
                  </label>
                )}
              </div>

              {/* Description */}
              <textarea
                placeholder="添加步骤说明"
                value={step.instruction}
                onChange={(e) => handleInstructionChange(idx, e.target.value)}
                className={styles.textarea}
                rows={3}
              />
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={onAddStep} className={styles.addBtn}>
        + 添加步骤
      </button>
    </section>
  );
}
