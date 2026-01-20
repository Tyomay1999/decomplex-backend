import type { Response as SupertestResponse } from "supertest";
import request from "supertest";
import type { Express } from "express";

type Method = "get" | "post" | "put" | "patch" | "delete";

export type ProbeResult =
  | {
      ok: true;
      path: string;
      res: SupertestResponse;
    }
  | {
      ok: false;
      tried: readonly string[];
      last?: SupertestResponse;
    };

const normalizePath = (p: string): string => {
  if (!p.startsWith("/")) return `/${p}`;
  return p;
};

export const probeFirstOk = async (
  app: Express,
  method: Method,
  paths: readonly string[],
  acceptStatus: (status: number) => boolean,
): Promise<ProbeResult> => {
  const tried: string[] = [];
  let last: SupertestResponse | undefined;

  for (const raw of paths) {
    const path = normalizePath(raw);
    tried.push(path);

    const r = await request(app)[method](path);
    last = r;

    if (acceptStatus(r.status)) {
      return { ok: true, path, res: r };
    }
  }

  return { ok: false, tried, last };
};

export const acceptNot404 = (status: number): boolean => status !== 404;

export const acceptProtectedFail = (status: number): boolean => status === 401 || status === 403;

export const acceptPublicOk = (status: number): boolean => status >= 200 && status < 300;
