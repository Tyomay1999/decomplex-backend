import request from "supertest";
import type { Cookie, HttpResult } from "./types";

type Opts = { cookies?: Cookie[]; headers?: Record<string, string> };

type FormPayload = {
  fields: Record<string, string>;
  file?: { fieldName: string; filePath: string; filename?: string };
};

export type HttpClient = {
  get: <T>(path: string, opts?: Opts) => Promise<HttpResult<T>>;
  post: <T, B extends object>(path: string, body: B, opts?: Opts) => Promise<HttpResult<T>>;
  postForm: <T>(path: string, form: FormPayload, opts?: Opts) => Promise<HttpResult<T>>;
  patch: <T, B extends object>(path: string, body: B, opts?: Opts) => Promise<HttpResult<T>>;
  delete: <T>(path: string, opts?: Opts) => Promise<HttpResult<T>>;
};

const extractCookies = (setCookie: unknown): Cookie[] => {
  if (typeof setCookie === "string") return [setCookie];
  if (!Array.isArray(setCookie)) return [];
  const out: Cookie[] = [];
  for (const x of setCookie) {
    if (typeof x === "string") out.push(x);
  }
  return out;
};

const applyCookies = (r: request.Test, cookies?: Cookie[]): request.Test => {
  if (!Array.isArray(cookies) || cookies.length === 0) return r;
  return r.set("Cookie", cookies);
};

const applyHeaders = (r: request.Test, headers?: Record<string, string>): request.Test => {
  if (!headers) return r;
  let out = r;
  for (const key of Object.keys(headers)) {
    out = out.set(key, headers[key]);
  }
  return out;
};

const apply = (
  r: request.Test,
  cookies?: Cookie[],
  headers?: Record<string, string>,
): request.Test => applyHeaders(applyCookies(r, cookies), headers);

export const createHttpClient = (baseUrl: string): HttpClient => ({
  get: async <T>(path: string, opts?: Opts): Promise<HttpResult<T>> => {
    const res = await apply(request(baseUrl).get(path), opts?.cookies, opts?.headers);
    return {
      status: res.status,
      body: res.body as T,
      cookies: extractCookies(res.headers["set-cookie"]),
      headers: res.headers as Record<string, unknown>,
    };
  },

  post: async <T, B extends object>(path: string, body: B, opts?: Opts): Promise<HttpResult<T>> => {
    const res = await apply(request(baseUrl).post(path).send(body), opts?.cookies, opts?.headers);
    return {
      status: res.status,
      body: res.body as T,
      cookies: extractCookies(res.headers["set-cookie"]),
      headers: res.headers as Record<string, unknown>,
    };
  },

  patch: async <T, B extends object>(
    path: string,
    body: B,
    opts?: Opts,
  ): Promise<HttpResult<T>> => {
    const res = await apply(request(baseUrl).patch(path).send(body), opts?.cookies, opts?.headers);
    return {
      status: res.status,
      body: res.body as T,
      cookies: extractCookies(res.headers["set-cookie"]),
      headers: res.headers as Record<string, unknown>,
    };
  },

  delete: async <T>(path: string, opts?: Opts): Promise<HttpResult<T>> => {
    const res = await apply(request(baseUrl).delete(path), opts?.cookies, opts?.headers);
    return {
      status: res.status,
      body: res.body as T,
      cookies: extractCookies(res.headers["set-cookie"]),
      headers: res.headers as Record<string, unknown>,
    };
  },

  postForm: async <T>(path: string, form: FormPayload, opts?: Opts): Promise<HttpResult<T>> => {
    let r = apply(request(baseUrl).post(path), opts?.cookies, opts?.headers);

    for (const key of Object.keys(form.fields)) {
      r = r.field(key, form.fields[key]);
    }

    const file = form.file;
    if (file) {
      r =
        typeof file.filename === "string"
          ? r.attach(file.fieldName, file.filePath, { filename: file.filename })
          : r.attach(file.fieldName, file.filePath);
    }

    const res = await r;
    return {
      status: res.status,
      body: res.body as T,
      cookies: extractCookies(res.headers["set-cookie"]),
      headers: res.headers as Record<string, unknown>,
    };
  },
});
