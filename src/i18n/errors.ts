import type { LocaleCode } from "../config/i18n";
import type { DomainErrorCode } from "../errors/DomainError";

type Dict = Record<DomainErrorCode, string>;

const en: Dict = {
    COMPANY_NOT_FOUND: "Company not found",
    CANDIDATE_NOT_FOUND: "Candidate not found",
    CANDIDATE_EMAIL_CONFLICT: "Email is already in use",
    COMPANY_EMAIL_CONFLICT: "Email is already in use",
    USER_NOT_FOUND: "User not found",
    INVALID_CREDENTIALS: "Invalid credentials",
    INSUFFICIENT_PERMISSIONS: "Insufficient permissions",
    COMPANY_USER_NOT_FOUND: "Company user not found",
    VACANCY_NOT_FOUND: "Vacancy not found",
    COMPANY_USER_EMAIL_CONFLICT: "Email is already in use",
    APPLICATION_ALREADY_EXISTS: "Application already exists",
    VALIDATION_FAILED: "Validation failed",
    OWNERSHIP_REQUIRED: "Ownership required",
    UNAUTHORIZED: "Unauthorized",
    FORBIDDEN: "Forbidden",
    INVALID_ACCESS_TOKEN: "Invalid access token",
    INVALID_REFRESH_TOKEN: "Invalid refresh token",
    REFRESH_TOKEN_REVOKED: "Refresh token revoked",
    FINGERPRINT_MISMATCH: "Fingerprint mismatch",
    COMPANY_REQUIRED: "Company required",
    UNKNOWN_DOMAIN_ERROR: "Unknown error",
};

const ru: Dict = {
    COMPANY_NOT_FOUND: "Компания не найдена",
    CANDIDATE_NOT_FOUND: "Кандидат не найден",
    CANDIDATE_EMAIL_CONFLICT: "Email уже используется",
    COMPANY_EMAIL_CONFLICT: "Email уже используется",
    USER_NOT_FOUND: "Пользователь не найден",
    INVALID_CREDENTIALS: "Неверные данные для входа",
    INSUFFICIENT_PERMISSIONS: "Недостаточно прав",
    COMPANY_USER_NOT_FOUND: "Пользователь компании не найден",
    VACANCY_NOT_FOUND: "Вакансия не найдена",
    COMPANY_USER_EMAIL_CONFLICT: "Email уже используется",
    APPLICATION_ALREADY_EXISTS: "Отклик уже существует",
    VALIDATION_FAILED: "Ошибка валидации",
    OWNERSHIP_REQUIRED: "Требуется владение ресурсом",
    UNAUTHORIZED: "Не авторизован",
    FORBIDDEN: "Доступ запрещён",
    INVALID_ACCESS_TOKEN: "Неверный access token",
    INVALID_REFRESH_TOKEN: "Неверный refresh token",
    REFRESH_TOKEN_REVOKED: "Refresh token отозван",
    FINGERPRINT_MISMATCH: "Fingerprint не совпадает",
    COMPANY_REQUIRED: "Требуется компания",
    UNKNOWN_DOMAIN_ERROR: "Неизвестная ошибка",
};

const hy: Dict = {
    COMPANY_NOT_FOUND: "Ընկերությունը չի գտնվել",
    CANDIDATE_NOT_FOUND: "Թեկնածուն չի գտնվել",
    CANDIDATE_EMAIL_CONFLICT: "Էլ․փոստը արդեն օգտագործվում է",
    COMPANY_EMAIL_CONFLICT: "Էլ․փոստը արդեն օգտագործվում է",
    USER_NOT_FOUND: "Օգտատերը չի գտնվել",
    INVALID_CREDENTIALS: "Մուտքի տվյալները սխալ են",
    INSUFFICIENT_PERMISSIONS: "Իրավասությունները բավարար չեն",
    COMPANY_USER_NOT_FOUND: "Ընկերության օգտատերը չի գտնվել",
    VACANCY_NOT_FOUND: "Աշխատատեղը չի գտնվել",
    COMPANY_USER_EMAIL_CONFLICT: "Էլ․փոստը արդեն օգտագործվում է",
    APPLICATION_ALREADY_EXISTS: "Դիմումը արդեն կա",
    VALIDATION_FAILED: "Վավերացումը ձախողվեց",
    OWNERSHIP_REQUIRED: "Պահանջվում է սեփականություն",
    UNAUTHORIZED: "Չեք մուտք գործել",
    FORBIDDEN: "Մուտքը արգելված է",
    INVALID_ACCESS_TOKEN: "Access token-ը սխալ է",
    INVALID_REFRESH_TOKEN: "Refresh token-ը սխալ է",
    REFRESH_TOKEN_REVOKED: "Refresh token-ը չեղարկված է",
    FINGERPRINT_MISMATCH: "Fingerprint-ը չի համապատասխանում",
    COMPANY_REQUIRED: "Պահանջվում է ընկերություն",
    UNKNOWN_DOMAIN_ERROR: "Անհայտ սխալ",
};

const dict: Record<LocaleCode, Dict> = { en, ru, hy };

export function translateDomainError(
    locale: LocaleCode,
    code: DomainErrorCode,
    fallback: string,
): string {
    return dict[locale]?.[code] ?? dict.en[code] ?? fallback;
}
