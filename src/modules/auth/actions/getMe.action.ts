import type { Request, Response, NextFunction } from "express";
import { notFound, unauthorized } from "../../../errors/DomainError";

import { getCandidateById } from "../../../database/methods/candidateMethods";
import { findCompanyUserByIdOrThrow } from "../../../database/methods/companyUserMethods";

export async function getMeAction(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;

    if (!user) {
      throw unauthorized({ code: "UNAUTHORIZED", message: "User is not authenticated" });
    }

    if (user.userType === "candidate") {
      const candidate = await getCandidateById(user.id);

      if (!candidate) {
        throw notFound("CANDIDATE_NOT_FOUND", "Candidate not found", { id: user.id });
      }

      return res.status(200).json({
        success: true,
        data: {
          userType: "candidate",
          user: {
            id: candidate.id,
            email: candidate.email,
            role: "candidate",
            language: candidate.language,
            firstName: candidate.firstName,
            lastName: candidate.lastName,
          },
        },
      });
    }

    const companyUser = await findCompanyUserByIdOrThrow(user.id, { include: ["company"] });
    const company = (
      companyUser as typeof companyUser & {
        company?: { id: string; name: string; defaultLocale: string; status: string };
      }
    ).company;

    if (!company) {
      throw notFound("COMPANY_NOT_FOUND", "Company not found for this user", { userId: user.id });
    }

    return res.status(200).json({
      success: true,
      data: {
        userType: "company",
        user: {
          id: companyUser.id,
          email: companyUser.email,
          role: companyUser.role,
          language: companyUser.language,
          position: companyUser.position,
          companyId: companyUser.companyId,
        },
        company: {
          id: company.id,
          name: company.name,
          defaultLocale: company.defaultLocale,
          status: company.status,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
