import type { Request } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { ParsedQs } from "qs";
import { validateApplyVacancy } from "../../validators/applyVacancy.validation";
import { makeNext, makeReq, makeRes } from "../../../../../tests/helpers/http";

type Body = {
  coverLetter?: unknown;
} & Record<string, unknown>;

type FileInfoShape = {
  url: string;
  path: string;
  fileName: string;
  size: number;
  company: string;
  position: string;
  userId: string;
};

function makeR(
  params: ParamsDictionary,
  body: Body,
  fileUrl?: string,
): Request<ParamsDictionary, unknown, Body, ParsedQs> {
  const req = makeReq() as Request<ParamsDictionary, unknown, Body, ParsedQs>;
  req.params = params;
  req.body = body;

  if (fileUrl) {
    const fileInfo: FileInfoShape = {
      url: fileUrl,
      path: "p",
      fileName: "f",
      size: 1,
      company: "",
      position: "",
      userId: "",
    };
    (req as unknown as { fileInfo: FileInfoShape }).fileInfo = fileInfo;
  }

  return req;
}

describe("validateApplyVacancy", () => {
  test("passes when params and body valid and fileInfo present", () => {
    const req = makeR(
      { id: "11111111-1111-4111-8111-111111111111" },
      { coverLetter: "x", extra: "x" },
      "u",
    );

    const res = makeRes();
    const next = makeNext();

    validateApplyVacancy(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ coverLetter: "x", extra: "x" });
  });

  test("calls next(error) when id invalid", () => {
    const req = makeR({ id: "x" }, {}, "u");

    const res = makeRes();
    const next = makeNext();

    validateApplyVacancy(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test("calls next(error) when coverLetter invalid", () => {
    const req = makeR({ id: "11111111-1111-4111-8111-111111111111" }, { coverLetter: 1 }, "u");

    const res = makeRes();
    const next = makeNext();

    validateApplyVacancy(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test("calls next(error) when fileInfo missing", () => {
    const req = makeR({ id: "11111111-1111-4111-8111-111111111111" }, { coverLetter: "x" });

    const res = makeRes();
    const next = makeNext();

    validateApplyVacancy(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
