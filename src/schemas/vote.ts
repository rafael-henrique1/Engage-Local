import { z } from "zod";

export const createVoteSchema = z.object({
  value: z.number().min(-1).max(1),
  deviceId: z.string().optional(),
});

export const voteStatsSchema = z.object({
  projectId: z.string(),
  timeframe: z.enum(["day", "week", "month", "all"]).default("all"),
});

export type CreateVoteInput = z.infer<typeof createVoteSchema>;
export type VoteStatsInput = z.infer<typeof voteStatsSchema>;
