"use client";

import Link from "next/link";
import Image from "next/image";
import AccountAvatar from "./AccountAvatar";
import { getAccountDisplayName, type AccountIdentity } from "../utils/accountAvatar";
import { getImageFocusStyle, type RecipeImageFocus } from "../utils/imageFocus";
import styles from "./recipe-card.module.css";

interface RecipeCardProps {
  href: string;
  title: string;
  subtitle?: string;
  image?: string;
  imageFocus?: RecipeImageFocus;
  imageIcon?: string;
  badge?: string;
  author?: AccountIdentity | null;
  saved: boolean;
  saveLabel?: string;
  onToggleSave: () => void;
}

export default function RecipeCard({
  href,
  title,
  subtitle,
  image,
  imageFocus,
  imageIcon = "restaurant",
  badge,
  author,
  saved,
  saveLabel = "Save recipe",
  onToggleSave,
}: RecipeCardProps) {
  return (
    <article className={styles.recipeCard}>
      <Link href={href} className={styles.cardLink}>
        <div className={styles.cardImage}>
          {image ? (
            <Image
              src={image}
              alt={title}
              width={1600}
              height={900}
              unoptimized
              style={getImageFocusStyle(imageFocus?.card)}
            />
          ) : (
            <div className={styles.imagePlaceholder}>
              <span className="material-symbols-rounded" aria-hidden="true">{imageIcon}</span>
            </div>
          )}
          {badge && <span className={styles.cardBadge}>{badge}</span>}
        </div>
        <div className={styles.cardContent}>
          <h2 className={styles.cardTitle}>{title}</h2>
          {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
        </div>
      </Link>
      <div className={styles.cardFooter}>
        <div className={styles.uploaderLine}>
          {author && (
            <>
              <AccountAvatar account={author} size={24} />
              <span>{getAccountDisplayName(author)}</span>
            </>
          )}
        </div>
        <button
          type="button"
          className={`${styles.saveButton} ${saved ? styles.saveButtonActive : ""}`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleSave();
          }}
          title={saved ? "Remove from saved" : saveLabel}
          aria-label={saved ? "Remove from saved" : saveLabel}
        >
          <span className="material-symbols-outlined">{saved ? "favorite" : "favorite_border"}</span>
        </button>
      </div>
    </article>
  );
}