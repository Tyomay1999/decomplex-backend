import type { UploadedFile, FileArray } from "express-fileupload";
import type { LocaleCode } from "../../config/i18n";

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

    interface Request {
      auth?: AuthPayload;
      user?: UserPayload;
      fileInfo?: FileInfo;
      files?: FileArray | Record<string, UploadedFile | UploadedFile[]>;
      requestId?: string;
      locale?: LocaleCode;
      fingerprint?: RequestFingerprint;
    }
  }
}

export {};
