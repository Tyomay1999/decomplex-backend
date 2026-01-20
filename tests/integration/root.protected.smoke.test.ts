import { createTestApp } from "../helpers/createTestApp";
import { acceptProtectedFail, probeFirstOk } from "./_httpProbe";

describe("root-level: protected endpoints without auth", () => {
  it("GET /api/auth/me fails without auth (401/403)", async () => {
    const app = createTestApp();

    const candidates = ["/api/auth/me", "/api/auth/current"] as const;

    const result = await probeFirstOk(app, "get", candidates, acceptProtectedFail);

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

    expect([401, 403]).toContain(result.res.status);
  });

  it("POST /api/vacancies (create-like) fails without auth (401/403)", async () => {
    const app = createTestApp();

    const candidates = ["/api/vacancies", "/api/vacancies/create"] as const;

    const result = await probeFirstOk(app, "post", candidates, acceptProtectedFail);

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

    expect([401, 403]).toContain(result.res.status);
  });

  it("GET /api/applications/my fails without auth (401/403)", async () => {
    const app = createTestApp();

    const candidates = ["/api/applications/my", "/api/applications/list-my"] as const;

    const result = await probeFirstOk(app, "get", candidates, acceptProtectedFail);

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

    expect([401, 403]).toContain(result.res.status);
  });
});
