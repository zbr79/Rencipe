"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useCart } from "../contexts/CartContext";
import styles from "./top-bar.module.css";

const userId = "507f1f77bcf86cd799439011";

export default function TopBar() {
  const pathname = usePathname();
  const { cartCount, fetchCart } = useCart();
  const hasFetchedCart = useRef(false);

  useEffect(() => {
    if (hasFetchedCart.current) return;
    hasFetchedCart.current = true;
    fetchCart(userId);
  }, [fetchCart]);

  if (pathname === "/login") return null;

  const navLinks = [
    { href: "/recipes", label: "Recipes" },
    { href: "/saved", label: "Saved" },
    { href: "/meal-plans", label: "Meal Plans" },
    { href: "/cart", label: "Cart" },
  ];

  return (
    <header className={styles.topBar}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <span className={`material-symbols-outlined ${styles.logoIcon}`}>restaurant</span>
          <span className={styles.logoText}>Rencipe</span>
        </Link>

        <nav className={styles.navLinks} aria-label="Main navigation">
          {navLinks.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <Link href="/cart" className={styles.cartButton} title="Shopping Cart" aria-label="Shopping Cart">
          <span className="material-symbols-outlined">shopping_cart</span>
          {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
        </Link>
      </div>
    </header>
  );
}
