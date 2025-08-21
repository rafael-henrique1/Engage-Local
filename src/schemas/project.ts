import { z } from "zod";

export const createProjectSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().min(10),
  category: z.string(),
  location: z.string(),
  goals: z.array(z.object({
    description: z.string(),
    target: z.number().optional(),
    deadline: z.string().datetime().optional(),
  })).min(1),
  metrics: z.object({
    volunteersNeeded: z.number().min(1).optional(),
    estimatedImpact: z.string().optional(),
    duration: z.string().optional(),
  }).optional(),
  orgId: z.string().optional(),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  status: z.enum(["DRAFT", "PENDING", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
});

export const projectFilterSchema = z.object({
  status: z.enum(["DRAFT", "PENDING", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  creatorId: z.string().optional(),
  orgId: z.string().optional(),
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  sortBy: z.enum(["createdAt", "title", "votes"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectFilterInput = z.infer<typeof projectFilterSchema>;
