import { createTestApp } from "../helpers/createTestApp";
import { acceptPublicOk, probeFirstOk } from "./_httpProbe";

describe("root-level: health", () => {
  it("GET /health returns 200 and { ok: true }", async () => {
    const app = createTestApp();

    const result = await probeFirstOk(app, "get", ["/health"], acceptPublicOk);

    if (!result.ok) {
      throw new Error(
        JSON.stringify({
          tried: result.tried,
          lastStatus: result.last?.status,
          lastBody: result.last?.body,
        }),
      );
    }

    expect(result.res.body).toEqual({ ok: true });
  });
});
