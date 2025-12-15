import { Router } from "express";

import { loginAction } from "./actions/login.action";
import { getCurrentUserAction } from "./actions/getCurrentUser.action";
import { refreshTokenAction } from "./actions/refreshToken.action";

import { validateLogin } from "./validators/login.validation";
import { validateCompanyRegister } from "./validators/companyRegister.validation";
import { validateCandidateRegister } from "./validators/candidateRegister.validation";
import { validateCompanyUserRegister } from "./validators/companyUserRegister.validation";

import { registerCompanyAction } from "./actions/registerCompany.action";
import { registerCandidateAction } from "./actions/registerCandidate.action";
import { registerCompanyUserAction } from "./actions/registerCompanyUser.action";

import { auth as authMiddleware } from "../../middleware/auth";
import { fingerprintMiddleware } from "../../middleware/fingerprint";
import { logoutAction } from "./actions/logout.action";

const router = Router();

router.post("/login", fingerprintMiddleware, validateLogin, loginAction);
router.post("/refresh", refreshTokenAction);
router.get("/current", fingerprintMiddleware, authMiddleware, getCurrentUserAction);

router.post("/register/company", validateCompanyRegister, registerCompanyAction);

router.post("/register/candidate", validateCandidateRegister, registerCandidateAction);

router.post(
  "/register/company-user",
  authMiddleware,
  validateCompanyUserRegister,
  registerCompanyUserAction,
);

router.patch("/logout", authMiddleware, logoutAction);

export const authRouter = router;
