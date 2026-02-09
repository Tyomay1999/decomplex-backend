import type { Request } from "express";
import express, { Router } from "express";

import { authRouter } from "../../auth.routes";

import { localeMiddleware } from "../../../../middleware/locale";
import { fingerprintMiddleware } from "../../../../middleware/fingerprint";
import { errorHandler } from "../../../../middleware/errorHandler";

import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";
import { handle } from "../../../../../tests/helpers/routerHandle";

import * as authService from "../../../../services/authService";

jest.mock("../../../../services/authService");

const verifyAccessTokenMock = jest.mocked(authService.verifyAccessToken);

function makeAppRouter(): Router {
    const router = Router();

    router.use(express.json());

    router.use(localeMiddleware);
    router.use(fingerprintMiddleware);

    router.use("/auth", authRouter);

    router.use(errorHandler);

    return router;
}

describe("GET /auth/me (i18n error responses)", () => {
    test.each([
        ["en", "Unauthorized"],
        ["ru", "Не авторизован"],
        ["hy", "Չեք մուտք գործել"],
    ] as const)("returns localized UNAUTHORIZED for Accept-Language=%s", async (lang, expected) => {
        const router = makeAppRouter();

        const req = makeReq({
            headers: { "accept-language": lang },
        }) as Request;

        req.method = "GET";
        req.url = "/auth/me";

        const res = makeRes();
        const next = makeNext();

        await handle(router, req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: {
                code: "UNAUTHORIZED",
                message: expected,
            },
        });
    });

    test("falls back to en for unsupported locale", async () => {
        const router = makeAppRouter();

        const req = makeReq({
            headers: { "accept-language": "fr-FR,fr;q=0.9" },
        }) as Request;

        req.method = "GET";
        req.url = "/auth/me";

        const res = makeRes();
        const next = makeNext();

        await handle(router, req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: {
                code: "UNAUTHORIZED",
                message: "Unauthorized",
            },
        });
    });
});

test("query lang overrides Accept-Language", async () => {
    const router = makeAppRouter();

    const req = makeReq({
        headers: { "accept-language": "en" },
        query: { lang: "ru" },
    }) as Request;

    req.method = "GET";
    req.url = "/auth/me?lang=ru";

    const res = makeRes();
    const next = makeNext();

    await handle(router, req, res, next);

    expect(next).toHaveBeenCalledTimes(0);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Не авторизован" },
    });
});

test.each([
    ["en", "Fingerprint mismatch"],
    ["ru", "Fingerprint не совпадает"],
    ["hy", "Fingerprint-ը չի համապատասխանում"],
] as const)(
    "returns localized FINGERPRINT_MISMATCH for Accept-Language=%s",
    async (lang, expected) => {
        verifyAccessTokenMock.mockReturnValue({
            userType: "candidate",
            userId: "cand1",
            email: "a@b.com",
            role: "candidate",
            language: "en",
            fingerprint: "fingerprint-from-token",
        });

        const router = makeAppRouter();

        const req = makeReq({
            headers: {
                authorization: "Bearer access",
                "accept-language": lang,
                "x-client-fingerprint": "fingerprint-from-request",
            },
        }) as Request;

        req.method = "GET";
        req.url = "/auth/me";

        const res = makeRes();
        const next = makeNext();

        await handle(router, req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: {
                code: "FINGERPRINT_MISMATCH",
                message: expected,
            },
        });
    },
);