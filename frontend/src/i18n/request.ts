import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale = locale || 'en';
  
  try {
    const messages = (await import(`../../messages/${resolvedLocale}.json`)).default;
    return {
      locale: resolvedLocale,
      messages,
    };
  } catch (error) {
    console.error(`[i18n] Failed to load messages for locale: ${resolvedLocale}`, error);
    return {
      locale: resolvedLocale,
      messages: {},
    };
  }
});
