import { Router } from "express";
import { ProjectController } from "../controllers/project.controller";
import { auth, validate } from "../middlewares/auth";
import { createProjectSchema, updateProjectSchema } from "../schemas/project";
import voteRoutes from "./vote";

const router = Router();

// Rotas públicas
router.get("/", ProjectController.findAll);
router.get("/:id", ProjectController.findById);

// Rotas de votação (aninhadas)
router.use("/:id/votes", voteRoutes);

// Rotas protegidas
router.use(auth);
router.post("/", validate(createProjectSchema), ProjectController.create);
router.put("/:id", validate(updateProjectSchema), ProjectController.update);
router.delete("/:id", ProjectController.delete);

export default router;
