import type { UploadedFile, FileArray } from "express-fileupload";

declare global {
  namespace Express {
    interface AuthPayload {
      userId: string;
    }

    interface UserPayload {
      id: string;
      company?: string;
      position?: string;
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

    interface Request {
      auth?: AuthPayload;
      user?: UserPayload;
      fileInfo?: FileInfo;
      files?: FileArray | Record<string, UploadedFile | UploadedFile[]>;
      requestId?: string;
    }
  }
}
