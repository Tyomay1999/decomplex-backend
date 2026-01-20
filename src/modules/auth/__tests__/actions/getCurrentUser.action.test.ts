import { getCurrentUserAction } from "../../actions/getCurrentUser.action";

import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getCurrentUserAction", () => {
  test("returns user from req.user when present", async () => {
    const req = makeReq({
      user: {
        userType: "candidate",
        id: "cand1",
        language: "en",
      },
    });
    const res = makeRes();
    const next = makeNext();

    await getCurrentUserAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(0);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        user: expect.objectContaining({
          userType: "candidate",
          id: "cand1",
          language: "en",
        }),
      },
    });
  });

  test("returns null when req.user is missing", async () => {
    const req = makeReq();
    const res = makeRes();
    const next = makeNext();

    await getCurrentUserAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(0);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        user: null,
      },
    });
  });
});
