import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { auth } from "../middlewares/auth";
import { validate } from "../middlewares/auth";
import { loginSchema, registerSchema } from "../schemas/auth";

const router = Router();

router.post("/register", validate(registerSchema), AuthController.register);
router.post("/login", validate(loginSchema), AuthController.login);
router.post("/refresh", AuthController.refresh);
router.post("/logout", auth, AuthController.logout);
router.get("/me", auth, AuthController.me);

export default router;
