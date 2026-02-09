import type { UploadedFile, FileArray } from "express-fileupload";
import type { LocaleCode } from "../../config/i18n";

type NormalizedVacanciesQuery = {
  companyId?: string;
  status?: "active" | "archived";
  jobType?: "full_time" | "part_time" | "remote" | "hybrid";
  q?: string;
  limit?: number;
  cursor?: string;
};

declare global {
  namespace Express {
    interface AuthPayload {
      userId: string;
    }

    type UserPayload =
      | {
          userType: "candidate";
          id: string;
          language: LocaleCode;
        }
      | {
          userType: "company";
          id: string;
          companyId: string;
          email: string;
          role: "admin" | "recruiter";
          language: LocaleCode;
          position?: string;
        };

    interface FileInfo {
      fileName: string;
      path: string;
      url: string;
      size: number;
      mimetype?: string;

      company: string;
      position: string;
      userId: string;
    }

    interface RequestFingerprint {
      hash: string;
      ip?: string;
      userAgent?: string;
      acceptLanguage?: string;
      origin?: string;
      referer?: string;
    }

    type ValidatedVacancyApplicationsParams = {
      id: string;
    };

    type ValidatedVacancyApplicationsQuery = {
      limit?: number;
      cursor?: string;
      status?: string;
      q?: string;
    };

    interface Request {
      auth?: AuthPayload;
      user?: UserPayload;
      fileInfo?: FileInfo;
      files?: FileArray | Record<string, UploadedFile | UploadedFile[]>;
      requestId?: string;
      locale?: LocaleCode;
      fingerprint?: RequestFingerprint;
      validatedQuery?: NormalizedVacanciesQuery;
      validatedParams?: ValidatedVacancyApplicationsParams;
      validatedVacancyApplicationsQuery?: ValidatedVacancyApplicationsQuery;
    }
  }
}

export {};
