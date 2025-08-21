import { Request, Response } from "express";
import { VoteService } from "../services/vote.service";
import { voteStatsSchema } from "../schemas/vote";

export class VoteController {
  static async vote(req: Request, res: Response) {
    const { id: projectId } = req.params;
    const userId = req.user!.sub;
    const ipAddress = req.ip;

    const vote = await VoteService.vote(projectId, userId, req.body, ipAddress);
    return res.status(201).json(vote);
  }

  static async getProjectVotes(req: Request, res: Response) {
    const { id: projectId } = req.params;
    const votes = await VoteService.getProjectVotes(projectId);
    return res.json(votes);
  }

  static async getVoteStats(req: Request, res: Response) {
    const { id: projectId } = req.params;
    const input = voteStatsSchema.parse({ projectId, ...req.query });
    const stats = await VoteService.getVoteStats(input);
    return res.json(stats);
  }

  static async getUserVote(req: Request, res: Response) {
    const { id: projectId } = req.params;
    const userId = req.user!.sub;
    const vote = await VoteService.getUserVote(projectId, userId);
    return res.json(vote);
  }

  static async deleteVote(req: Request, res: Response) {
    const { id: projectId } = req.params;
    const userId = req.user!.sub;
    await VoteService.deleteVote(projectId, userId);
    return res.status(204).send();
  }
}
