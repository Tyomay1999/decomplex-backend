import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes";
import { vacanciesRouter } from "../modules/vacancies/vacancies.routes";
import { applicationsRouter } from "../modules/applications/applications.routes";

const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/vacancies", vacanciesRouter);
apiRouter.use("/applications", applicationsRouter);

export { apiRouter };
