import { logoutAction } from "../../actions/logout.action";

import * as redisClient from "../../../../messaging/redis/client";

import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";

jest.mock("../../../../messaging/redis/client");

type RedisLike = {
  del: (key: string) => Promise<number>;
};

const getRedisClientMock = jest.mocked(redisClient.getRedisClient);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("logoutAction", () => {
  test("calls next(error) when user is not authenticated", async () => {
    const req = makeReq({
      body: { refreshToken: "rt1" },
    });
    const res = makeRes();
    const next = makeNext();

    await logoutAction(req, res, next);

    expect(getRedisClientMock).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test("deletes refresh token key when refreshToken provided and returns success", async () => {
    const redis: RedisLike = {
      del: jest.fn().mockResolvedValue(1) as unknown as RedisLike["del"],
    };

    getRedisClientMock.mockReturnValue(redis as never);

    const req = makeReq({
      user: {
        userType: "candidate",
        id: "cand1",
        language: "en",
      },
      body: { refreshToken: "rt1" },
    });
    const res = makeRes();
    const next = makeNext();

    await logoutAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(0);

    expect(getRedisClientMock).toHaveBeenCalledTimes(1);

    expect(redis.del).toHaveBeenCalledTimes(1);
    expect(redis.del).toHaveBeenCalledWith("refresh:rt1");

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Logged out successfully",
    });
  });

  test("does not delete anything when refreshToken is missing and returns success", async () => {
    const redis: RedisLike = {
      del: jest.fn().mockResolvedValue(0) as unknown as RedisLike["del"],
    };

    getRedisClientMock.mockReturnValue(redis as never);

    const req = makeReq({
      user: {
        userType: "company",
        id: "u1",
        companyId: "co1",
        email: "c@c.com",
        role: "admin",
        language: "en",
      },
      body: {},
    });
    const res = makeRes();
    const next = makeNext();

    await logoutAction(req, res, next);

    expect(next).toHaveBeenCalledTimes(0);

    expect(getRedisClientMock).toHaveBeenCalledTimes(1);

    expect(redis.del).toHaveBeenCalledTimes(0);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Logged out successfully",
    });
  });

  test("calls next(error) when redis client throws", async () => {
    const redis: RedisLike = {
      del: jest.fn().mockRejectedValue(new Error("redis fail")) as unknown as RedisLike["del"],
    };

    getRedisClientMock.mockReturnValue(redis as never);

    const req = makeReq({
      user: {
        userType: "candidate",
        id: "cand1",
        language: "en",
      },
      body: { refreshToken: "rt1" },
    });
    const res = makeRes();
    const next = makeNext();

    await logoutAction(req, res, next);

    expect(res.json).toHaveBeenCalledTimes(0);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
