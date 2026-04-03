import { getRequestConfig } from "next-intl/server";

export const locales = ["fr", "en", "es", "pt"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

export default getRequestConfig(async ({ locale }) => ({
  locale: locale ?? defaultLocale,
  messages: (await import(`../messages/${locale ?? defaultLocale}.json`)).default,
}));
