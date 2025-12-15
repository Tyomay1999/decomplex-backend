import { NextFunction, Request, Response } from "express";
import { resolveLocale } from "../config/i18n";

export function localeMiddleware(req: Request, _res: Response, next: NextFunction): void {
  let rawLocale: string | undefined;

  if (typeof req.query.lang === "string") {
    rawLocale = req.query.lang;
  }

  if (!rawLocale) {
    const headerLang = req.headers["accept-language"];
    if (typeof headerLang === "string" && headerLang.length > 0) {
      rawLocale = headerLang.split(",")[0]; // "en-US,en;q=0.9" -> "en-US"
    }
  }

  if (!rawLocale && req.user?.language) {
    rawLocale = req.user.language;
  }

  const locale = resolveLocale(rawLocale);
  req.locale = locale;

  return next();
}
