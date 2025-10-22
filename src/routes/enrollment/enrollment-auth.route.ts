import { Router } from "express";
import {
  login,
  refresh,
  logout,
} from "../../controllers/enrollment/enrollment-auth.controller";

const router = Router();

router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router;
