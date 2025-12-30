import { Router } from "express";

import { auth as authMiddleware } from "../../middleware/auth";
import { fingerprintMiddleware } from "../../middleware/fingerprint";
import { requireCandidate } from "../../middleware/requireCandidate";

import { listMyApplicationsAction } from "./actions/listMyApplications.action";

const router = Router();

router.get(
  "/my",
  fingerprintMiddleware,
  authMiddleware,
  requireCandidate,
  listMyApplicationsAction,
);

export const applicationsRouter = router;
