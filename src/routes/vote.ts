import { Router } from "express";
import { VoteController } from "../controllers/vote.controller";
import { auth, validate } from "../middlewares/auth";
import { createVoteSchema } from "../schemas/vote";

const router = Router({ mergeParams: true }); // Importante para acessar params da rota pai

// Rotas públicas
router.get("/", VoteController.getProjectVotes);
router.get("/stats", VoteController.getVoteStats);

// Rotas protegidas
router.use(auth);
router.post("/", validate(createVoteSchema), VoteController.vote);
router.get("/me", VoteController.getUserVote);
router.delete("/", VoteController.deleteVote);

export default router;
