import request from "supertest";
import { createTestApp } from "./helpers/createTestApp";

test("GET /health returns ok:true", async () => {
  const app = createTestApp();

  const res = await request(app).get("/health");

  expect(res.status).toBe(200);
  expect(res.body).toEqual({ ok: true });
});
