import { Request, Response } from "express";
import { ProjectService } from "../services/project.service";
import { projectFilterSchema } from "../schemas/project";

export class ProjectController {
  static async create(req: Request, res: Response) {
    const userId = req.user!.sub;
    const project = await ProjectService.create(req.body, userId);
    return res.status(201).json(project);
  }

  static async update(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.sub;
    const project = await ProjectService.update(id, req.body, userId);
    return res.json(project);
  }

  static async findById(req: Request, res: Response) {
    const { id } = req.params;
    const project = await ProjectService.findById(id);
    return res.json(project);
  }

  static async findAll(req: Request, res: Response) {
    const filters = projectFilterSchema.parse({
      ...req.query,
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 10),
    });
    
    const result = await ProjectService.findAll(filters);
    return res.json(result);
  }

  static async delete(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.sub;
    await ProjectService.delete(id, userId);
    return res.status(204).send();
  }
}
