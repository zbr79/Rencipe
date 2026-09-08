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
  invalidSteps?: boolean;
  onStepsChange: (steps: Step[]) => void;
  onStepImageChange: (e: React.ChangeEvent<HTMLInputElement>, stepNumber: number) => void;
  onRemoveStep: (index: number) => void;
  onRemoveStepImage?: (stepNumber: number) => void;
  onAddStep: () => void;
}

export default function StepsSection({
  steps,
  stepImages,
  invalidSteps = false,
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

  const openFilePicker = (inputId: string) => {
    document.getElementById(inputId)?.click();
  };

  return (
    <section className={`${styles.section} ${invalidSteps ? styles.sectionInvalid : ""}`}>
      <div className={styles.sectionHeader}>
        <h2 className={invalidSteps ? styles.sectionTitleInvalid : ""}>Cooking Steps</h2>
      </div>

      <div className={styles.stepsList}>
        {steps.map((step, idx) => {
          const fileInputId = `step-image-${step.stepNumber}`;
          const stepImage = stepImages[step.stepNumber];

          return (
            <div key={idx} className={`${styles.stepContainer} ${invalidSteps ? styles.stepContainerInvalid : ""}`}>
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
                <textarea
                  placeholder="Add step instructions"
                  value={step.instruction}
                  onChange={(e) => handleInstructionChange(idx, e.target.value)}
                  aria-invalid={invalidSteps}
                  className={`${styles.textarea} ${invalidSteps ? styles.inputInvalid : ""}`}
                  rows={3}
                />

                <div className={styles.stepImageSection}>
                  <input
                    id={fileInputId}
                    type="file"
                    accept="image/*"
                    onChange={(e) => onStepImageChange(e, step.stepNumber)}
                    className={styles.fileInput}
                  />

                  <div className={styles.imageToolbar}>
                    <button
                      type="button"
                      onClick={() => openFilePicker(fileInputId)}
                      className={`${styles.imageActionBtn} ${stepImage ? styles.secondaryImageBtn : styles.addImageBtn}`}
                      aria-label={`${stepImage ? "Replace" : "Add"} image for step ${step.stepNumber}`}
                    >
                      <span className="material-symbols-outlined">add_photo_alternate</span>
                      <span>{stepImage ? "Replace image" : "Add image"}</span>
                    </button>

                    {stepImage && onRemoveStepImage && (
                      <button
                        type="button"
                        onClick={() => onRemoveStepImage(step.stepNumber)}
                        className={`${styles.imageActionBtn} ${styles.removeImageBtn}`}
                        aria-label={`Delete image for step ${step.stepNumber}`}
                      >
                        <span className="material-symbols-outlined">delete</span>
                        <span>Delete image</span>
                      </button>
                    )}
                  </div>

                  {stepImage && (
                    <div className={styles.imagePreviewCard}>
                      <img
                        src={stepImage}
                        alt={`Step ${step.stepNumber}`}
                        className={styles.stepImage}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button type="button" onClick={onAddStep} className={styles.addBtn}>
        <span className="material-symbols-outlined">add</span>
        <span>Add Step</span>
      </button>
    </section>
  );
}
