interface PhotoUploadStepProps {
  recipeImage: string | null;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onContinue: () => void;
}

export default function PhotoUploadStep({
  recipeImage,
  onImageChange,
  onContinue,
}: PhotoUploadStepProps) {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>上传食谱封面</h1>
      <p style={styles.subtitle}>从一张精美的照片开始分享你的食谱</p>

      <div style={styles.uploadArea}>
        {recipeImage ? (
          <div style={styles.previewContainer}>
            <img src={recipeImage} alt="Recipe cover" style={styles.preview} />
            <label htmlFor="photoUpload" style={styles.changeButton}>
              更改照片
            </label>
          </div>
        ) : (
          <label htmlFor="photoUpload" style={styles.uploadLabel}>
            <div style={styles.uploadIcon}>📸</div>
            <p style={styles.uploadText}>点击选择照片或拖放</p>
            <p style={styles.uploadSubtext}>支持 JPG, PNG, GIF</p>
          </label>
        )}
        <input
          id="photoUpload"
          type="file"
          accept="image/*"
          onChange={onImageChange}
          style={{ display: "none" }}
        />
      </div>

      <button
        onClick={onContinue}
        disabled={!recipeImage}
        style={{
          ...styles.continueButton,
          opacity: recipeImage ? 1 : 0.5,
          cursor: recipeImage ? "pointer" : "not-allowed",
        }}
      >
        继续
      </button>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    maxWidth: "500px",
    padding: "40px 32px",
    background: "var(--card-bg)",
    borderRadius: "12px",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
    textAlign: "center" as const,
  } as React.CSSProperties,
  title: {
    fontSize: "28px",
    fontWeight: "800",
    color: "var(--foreground)",
    margin: "0 0 8px",
  } as React.CSSProperties,
  subtitle: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    margin: "0 0 32px",
  } as React.CSSProperties,
  uploadArea: {
    marginBottom: "28px",
  } as React.CSSProperties,
  uploadLabel: {
    display: "block",
    border: "2px dashed var(--border)",
    borderRadius: "12px",
    padding: "48px 20px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  } as React.CSSProperties,
  uploadIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  } as React.CSSProperties,
  uploadText: {
    fontSize: "16px",
    fontWeight: "600",
    color: "var(--foreground)",
    margin: "0 0 8px",
  } as React.CSSProperties,
  uploadSubtext: {
    fontSize: "13px",
    color: "var(--text-secondary)",
    margin: 0,
  } as React.CSSProperties,
  previewContainer: {
    position: "relative" as const,
  },
  preview: {
    width: "100%",
    height: "420px",
    objectFit: "cover" as const,
    borderRadius: "12px",
    marginBottom: "16px",
  } as React.CSSProperties,
  changeButton: {
    display: "inline-block",
    padding: "8px 16px",
    background: "var(--primary)",
    color: "white",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  } as React.CSSProperties,
  continueButton: {
    width: "100%",
    padding: "12px 24px",
    background: "var(--success)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  } as React.CSSProperties,
};
