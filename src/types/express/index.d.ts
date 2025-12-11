import type { UploadedFile, FileArray } from "express-fileupload";
import type { LocaleCode } from "../../config/i18n";

declare global {
  namespace Express {
    interface AuthPayload {
      userId: string;
    }

    interface UserPayload {
      id: string;
      company?: string;
      position?: string;
      language?: LocaleCode;
    }

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
