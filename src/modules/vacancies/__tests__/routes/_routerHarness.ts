import type { NextFunction, Request, Response, RequestHandler } from "express";
import { Router } from "express";

export function handle(
  router: Router,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return new Promise((resolve) => {
    let done = false;

    const resolveOnce = (): void => {
      if (done) return;
      done = true;
      resolve();
    };

    const nextWrapped: NextFunction = ((err?: unknown) => {
      (next as unknown as jest.Mock)(err);
      resolveOnce();
    }) as NextFunction;

    const jsonFn = res.json as unknown as jest.Mock | undefined;
    const sendFn = res.send as unknown as jest.Mock | undefined;
    const endOriginal = res.end ? res.end.bind(res) : undefined;

    if (jsonFn) {
      const original = jsonFn;
      (res as unknown as { json: jest.Mock }).json = jest.fn((...args: unknown[]) => {
        const ret = original(...args);
        resolveOnce();
        return ret;
      });
    }

    if (sendFn) {
      const original = sendFn;
      (res as unknown as { send: jest.Mock }).send = jest.fn((...args: unknown[]) => {
        const ret = original(...args);
        resolveOnce();
        return ret;
      });
    }

    if (endOriginal) {
      res.end = ((...args: Parameters<Response["end"]>) => {
        const ret = endOriginal(...args);
        resolveOnce();
        return ret;
      }) as Response["end"];
    }

    const fn = router as unknown as RequestHandler;
    fn(req, res, nextWrapped);
  });
}
