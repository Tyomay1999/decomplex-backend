import { env } from "./env";

export const SUPPORTED_LOCALES = ["en", "hy", "ru"] as const;
export type LocaleCode = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: LocaleCode = SUPPORTED_LOCALES.includes(
  env.defaultLocale as LocaleCode,
)
  ? (env.defaultLocale as LocaleCode)
  : "en";

export function resolveLocale(raw?: string | null): LocaleCode {
  if (!raw) return DEFAULT_LOCALE;

  const normalized = raw.toLowerCase().split("-")[0];

  if (SUPPORTED_LOCALES.includes(normalized as LocaleCode)) {
    return normalized as LocaleCode;
  }

  return DEFAULT_LOCALE;
}
