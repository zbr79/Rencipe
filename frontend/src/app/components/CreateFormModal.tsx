"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCreateForm } from "../contexts/CreateFormContext";
import styles from "./create-form-modal.module.css";

export default function CreateFormModal() {
  const { isOpen, closeCreateForm, setRecipeImage, setRecipeImageFile } = useCreateForm();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRecipeImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRecipeImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        const imageData = reader.result as string;
        setRecipeImage(imageData);
        
        // Auto-navigate to create page immediately
        closeCreateForm();
        router.push("/create");
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={closeCreateForm}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={closeCreateForm}>
          ✕
        </button>

        <div className={styles.menuContainer}>
          <h1 className={styles.menuTitle}>选择操作</h1>
          
          <button
            className={styles.menuOption}
            onClick={() => fileInputRef.current?.click()}
          >
            <span className={styles.menuIcon}>📝</span>
            <span className={styles.menuLabel}>创建菜单</span>
          </button>

          <button className={styles.menuOption} disabled style={{ opacity: 0.5 }}>
            <span className={styles.menuIcon}>📋</span>
            <span className={styles.menuLabel}>新建计划</span>
          </button>

          <button className={styles.menuOption} disabled style={{ opacity: 0.5 }}>
            <span className={styles.menuIcon}>🎨</span>
            <span className={styles.menuLabel}>发布作品</span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleRecipeImageChange}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}
