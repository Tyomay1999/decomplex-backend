import type { Request } from "express";
import { getMeAction } from "../../actions/getMe.action";
import * as candidateMethods from "../../../../database/methods/candidateMethods";
import * as companyUserMethods from "../../../../database/methods/companyUserMethods";
import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";

jest.mock("../../../../database/methods/candidateMethods");
jest.mock("../../../../database/methods/companyUserMethods");

const getCandidateByIdMock = jest.mocked(candidateMethods.getCandidateById);
const findCompanyUserByIdOrThrowMock = jest.mocked(companyUserMethods.findCompanyUserByIdOrThrow);

type CompanyAssoc = {
  id: string;
  name: string;
  defaultLocale: string;
  status: string;
};

type CompanyUserWithCompany = companyUserMethods.CompanyUserInstance & {
  company?: CompanyAssoc;
  companyId: string;
  id: string;
  email: string;
  role: string;
  language: string;
  position?: string | null;
};

function makeGetMeReq(user?: Express.UserPayload): Request {
  const req = makeReq() as Request;
  if (user) req.user = user;
  return req;
}

beforeEach(() => {
  getCandidateByIdMock.mockReset();
  findCompanyUserByIdOrThrowMock.mockReset();
});

describe("getMeAction", () => {
  test("calls next(error) when user is missing", async () => {
    const req = makeGetMeReq();
    const res = makeRes();
    const next = makeNext();

    await getMeAction(req, res, next);

    expect(res.status).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test("returns candidate payload", async () => {
    getCandidateByIdMock.mockResolvedValue({
      id: "c1",
      email: "a@b.com",
      firstName: "A",
      lastName: "B",
      language: "en",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const req = makeGetMeReq({ userType: "candidate", id: "c1", language: "en" });
    const res = makeRes();
    const next = makeNext();

    await getMeAction(req, res, next);

    expect(getCandidateByIdMock).toHaveBeenCalledTimes(1);
    expect(getCandidateByIdMock).toHaveBeenCalledWith("c1");

    expect(next).toHaveBeenCalledTimes(0);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          userType: "candidate",
          user: expect.objectContaining({
            id: "c1",
            email: "a@b.com",
            role: "candidate",
            language: "en",
            firstName: "A",
            lastName: "B",
          }),
        }),
      }),
    );
  });

  test("calls next(error) when candidate is not found", async () => {
    getCandidateByIdMock.mockResolvedValue(null);

    const req = makeGetMeReq({ userType: "candidate", id: "c404", language: "en" });
    const res = makeRes();
    const next = makeNext();

    await getMeAction(req, res, next);

    expect(getCandidateByIdMock).toHaveBeenCalledTimes(1);
    expect(getCandidateByIdMock).toHaveBeenCalledWith("c404");

    expect(res.status).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test("returns company payload", async () => {
    const record: CompanyUserWithCompany = {
      id: "u1",
      email: "c@c.com",
      role: "admin",
      language: "en",
      position: null,
      companyId: "co1",
      company: {
        id: "co1",
        name: "Acme",
        defaultLocale: "en",
        status: "active",
      },
    } as CompanyUserWithCompany;

    findCompanyUserByIdOrThrowMock.mockResolvedValue(record);

    const req = makeGetMeReq({
      userType: "company",
      id: "u1",
      companyId: "co1",
      email: "c@c.com",
      role: "admin",
      language: "en",
    });
    const res = makeRes();
    const next = makeNext();

    await getMeAction(req, res, next);

    expect(findCompanyUserByIdOrThrowMock).toHaveBeenCalledTimes(1);
    expect(findCompanyUserByIdOrThrowMock).toHaveBeenCalledWith("u1", { include: ["company"] });

    expect(next).toHaveBeenCalledTimes(0);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          userType: "company",
          user: expect.objectContaining({
            id: "u1",
            email: "c@c.com",
            role: "admin",
            language: "en",
            companyId: "co1",
          }),
          company: expect.objectContaining({
            id: "co1",
            name: "Acme",
            defaultLocale: "en",
            status: "active",
          }),
        }),
      }),
    );
  });

  test("calls next(error) when company is missing on company user record", async () => {
    const record: CompanyUserWithCompany = {
      id: "u1",
      email: "c@c.com",
      role: "admin",
      language: "en",
      position: null,
      companyId: "co1",
      company: undefined,
    } as CompanyUserWithCompany;

    findCompanyUserByIdOrThrowMock.mockResolvedValue(record);

    const req = makeGetMeReq({
      userType: "company",
      id: "u1",
      companyId: "co1",
      email: "c@c.com",
      role: "admin",
      language: "en",
    });
    const res = makeRes();
    const next = makeNext();

    await getMeAction(req, res, next);

    expect(res.status).toHaveBeenCalledTimes(0);
    expect(res.json).toHaveBeenCalledTimes(0);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
