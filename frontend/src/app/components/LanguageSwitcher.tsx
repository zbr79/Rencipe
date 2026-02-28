'use client';

import { useLocale } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './LanguageSwitcher.module.css';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  // Remove current locale from pathname
  const pathWithoutLocale = pathname.replace(`/${locale}`, '');

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文' }
  ];

  return (
    <div className={styles.switcher}>
      {languages.map((lang) => (
        <Link
          key={lang.code}
          href={`/${lang.code}${pathWithoutLocale}`}
          className={`${styles.button} ${locale === lang.code ? styles.active : ''}`}
        >
          {lang.name}
        </Link>
      ))}
    </div>
  );
}
