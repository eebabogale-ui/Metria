import { Router, type IRouter } from "express";
import healthRouter from "./health";
import hospitalityRouter from "./hospitality";

const router: IRouter = Router();

router.use(healthRouter);
router.use(hospitalityRouter);

export default router;
