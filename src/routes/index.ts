import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes";
import { vacanciesRouter } from "../modules/vacancies/vacancies.routes";

const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/vacancies", vacanciesRouter);

export { apiRouter };
