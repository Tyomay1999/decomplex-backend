import { createTestApp } from "../helpers/createTestApp";
import { acceptNot404, probeFirstOk } from "./_httpProbe";

describe("root-level: api mounts smoke", () => {
  it("auth router is mounted under /api/auth (at least one known endpoint is not 404)", async () => {
    const app = createTestApp();

    const candidates = [
      "/api/auth/login",
      "/api/auth/register-candidate",
      "/api/auth/register-company",
      "/api/auth/register-company-user",
      "/api/auth/refresh-token",
      "/api/auth/me",
      "/api/auth/current",
      "/api/auth/logout",
    ] as const;

    const result = await probeFirstOk(app, "post", candidates, acceptNot404);

    if (!result.ok) {
      throw new Error(
        JSON.stringify({
          module: "auth",
          tried: result.tried,
          lastStatus: result.last?.status,
          lastBody: result.last?.body,
        }),
      );
    }

    expect(result.res.status).not.toBe(404);
  });

  it("vacancies router is mounted under /api/vacancies (at least one probe is not 404)", async () => {
    const app = createTestApp();

    const candidates = [
      "/api/vacancies",
      "/api/vacancies/list",
      "/api/vacancies/123",
      "/api/vacancies/123/applications",
      "/api/vacancies/create",
      "/api/vacancies/123/archive",
      "/api/vacancies/123/update",
    ] as const;

    const result = await probeFirstOk(app, "get", candidates, acceptNot404);

    if (!result.ok) {
      throw new Error(
        JSON.stringify({
          module: "vacancies",
          tried: result.tried,
          lastStatus: result.last?.status,
          lastBody: result.last?.body,
        }),
      );
    }

    expect(result.res.status).not.toBe(404);
  });

  it("applications router is mounted under /api/applications (at least one probe is not 404)", async () => {
    const app = createTestApp();

    const candidates = [
      "/api/applications",
      "/api/applications/my",
      "/api/applications/list-my",
    ] as const;

    const result = await probeFirstOk(app, "get", candidates, acceptNot404);

    if (!result.ok) {
      throw new Error(
        JSON.stringify({
          module: "applications",
          tried: result.tried,
          lastStatus: result.last?.status,
          lastBody: result.last?.body,
        }),
      );
    }

    expect(result.res.status).not.toBe(404);
  });
});
