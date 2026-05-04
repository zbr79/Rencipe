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
        <h2>Cooking Steps</h2>
      </div>

      <div className={styles.stepsList}>
        {steps.map((step, idx) => (
          <div key={idx} className={styles.stepContainer}>
            <div className={styles.stepHeader}>
              <h3 className={styles.stepTitle}>Step {step.stepNumber}</h3>
              <button
                type="button"
                onClick={() => onRemoveStep(idx)}
                className={styles.deleteBtn}
                aria-label={`Remove step ${step.stepNumber}`}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className={styles.stepContent}>
              {/* Image Upload Area */}
              <div className={styles.imageUploadArea}>
                {stepImages[step.stepNumber] ? (
                  <>
                    <div className={styles.imageContainer}>
                      <img 
                        src={stepImages[step.stepNumber]} 
                        alt={`Step ${step.stepNumber}`}
                        className={styles.stepImage}
                      />
                    </div>
                    <div className={styles.imageActions}>
                      <input
                        id={`file-${idx}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => onStepImageChange(e, step.stepNumber)}
                        style={{ display: "none" }}
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById(`file-${idx}`)?.click()}
                        className={styles.changeImageBtn}
                      >
                        Change image
                      </button>
                      {onRemoveStepImage && (
                        <button
                          type="button"
                          onClick={() => onRemoveStepImage(step.stepNumber)}
                          className={styles.removeImageBtn}
                        >
                          Remove image
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <label htmlFor={`file-${idx}`} className={styles.uploadPlaceholder}>
                    <div className={styles.uploadIcon}>
                      <span className="material-symbols-outlined">add_photo_alternate</span>
                      <span>Step Image</span>
                    </div>
                    <div className={styles.uploadText}>Clear step photos make the recipe easier to follow</div>
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
                placeholder="Add step instructions"
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
        <span className="material-symbols-outlined">add</span>
        <span>Add Step</span>
      </button>
    </section>
  );
}
