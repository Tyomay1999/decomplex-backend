import { Router } from "express";
import { auth as authMiddleware } from "../../middleware/auth";
import { fingerprintMiddleware } from "../../middleware/fingerprint";
import { requireCompanyRole } from "../../middleware/requireCompanyRole";

import { listVacanciesAction } from "./actions/listVacancies.action";
import { getVacancyByIdAction } from "./actions/getVacancyById.action";
import { createVacancyAction } from "./actions/createVacancy.action";
import { updateVacancyAction } from "./actions/updateVacancy.action";
import { archiveVacancyAction } from "./actions/archiveVacancy.action";

import { validateCreateVacancy } from "./validators/createVacancy.validation";
import { validateUpdateVacancy } from "./validators/updateVacancy.validation";

import { requireCandidate } from "../../middleware/requireCandidate";
import { saveUserFileMiddleware } from "../../middleware/saveUserFile";
import { validateApplyVacancy } from "./validators/applyVacancy.validation";
import { applyVacancyAction } from "./actions/applyVacancy.action";
import { listVacancyApplicationsAction } from "./actions/listVacancyApplications.action";

const router = Router();

router.get("/", listVacanciesAction);
router.get("/:id", getVacancyByIdAction);

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
  validateUpdateVacancy,
  updateVacancyAction,
);

router.delete(
  "/:id",
  fingerprintMiddleware,
  authMiddleware,
  requireCompanyRole(["admin", "recruiter"]),
  archiveVacancyAction,
);

export const vacanciesRouter = router;
