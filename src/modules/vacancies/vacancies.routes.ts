// src/modules/vacancies/vacancies.routes.ts
import { Router } from "express";
import { auth as authMiddleware } from "../../middleware/auth";
import { fingerprintMiddleware } from "../../middleware/fingerprint";
import { requireCompanyRole } from "../../middleware/requireCompanyRole";
import { requireCandidate } from "../../middleware/requireCandidate";
import { saveUserFileMiddleware } from "../../middleware/saveUserFile";

import { listVacanciesAction } from "./actions/listVacancies.action";
import { getVacancyByIdAction } from "./actions/getVacancyById.action";
import { createVacancyAction } from "./actions/createVacancy.action";
import { updateVacancyAction } from "./actions/updateVacancy.action";
import { archiveVacancyAction } from "./actions/archiveVacancy.action";
import { applyVacancyAction } from "./actions/applyVacancy.action";
import { listVacancyApplicationsAction } from "./actions/listVacancyApplications.action";

import { validateListVacancies } from "./validators/listVacancies.validation";
import { validateIdParam } from "./validators/idParam.validation";
import { validateCreateVacancy } from "./validators/createVacancy.validation";
import { validateUpdateVacancy } from "./validators/updateVacancy.validation";
import { validateApplyVacancy } from "./validators/applyVacancy.validation";
import { validateListVacancyApplications } from "./validators/listVacancyApplications.validation";

const router = Router();

router.get("/", validateListVacancies, listVacanciesAction);

router.get("/:id", fingerprintMiddleware, authMiddleware, validateIdParam, getVacancyByIdAction);

router.post(
  "/",
  fingerprintMiddleware,
  authMiddleware,
  requireCompanyRole(["admin", "recruiter"]),
  validateCreateVacancy,
  createVacancyAction,
);

router.get(
  "/:id/applications",
  fingerprintMiddleware,
  authMiddleware,
  requireCompanyRole(["admin", "recruiter"]),
  validateListVacancyApplications,
  listVacancyApplicationsAction,
);

router.post(
  "/:id/apply",
  fingerprintMiddleware,
  authMiddleware,
  requireCandidate,
  saveUserFileMiddleware,
  validateApplyVacancy,
  applyVacancyAction,
);

router.patch(
  "/:id",
  fingerprintMiddleware,
  authMiddleware,
  requireCompanyRole(["admin", "recruiter"]),
  validateIdParam,
  validateUpdateVacancy,
  updateVacancyAction,
);

router.delete(
  "/:id",
  fingerprintMiddleware,
  authMiddleware,
  requireCompanyRole(["admin", "recruiter"]),
  validateIdParam,
  archiveVacancyAction,
);

export const vacanciesRouter = router;
