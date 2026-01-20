import { NextFunction, Request, Response } from "express";
import { resolveLocale } from "../config/i18n";

export function localeMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const queryLang = typeof req.query.lang === "string" ? req.query.lang : undefined;

  const headerLangRaw =
    typeof req.headers["accept-language"] === "string" ? req.headers["accept-language"] : undefined;

  const headerLang = headerLangRaw ? headerLangRaw.split(",")[0] : undefined;

  const userLang = req.user?.language;

  req.locale = resolveLocale(queryLang ?? headerLang ?? userLang);

  next();
}
