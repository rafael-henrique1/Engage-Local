import prisma from "../lib/prisma";
import { AppError } from "../middlewares/error";
import { CreateProjectInput, ProjectFilterInput, UpdateProjectInput } from "../schemas/project";
import logger from "../lib/logger";

export class ProjectService {
  static async create(data: CreateProjectInput, userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user) {
      throw new AppError(404, "Usuário não encontrado");
    }

    // Se o usuário tentar criar um projeto para uma organização
    if (data.orgId) {
      // Verificar se o usuário pertence à organização
      if (user.orgId !== data.orgId) {
        throw new AppError(403, "Você não tem permissão para criar projetos para esta organização");
      }
    }

    const project = await prisma.project.create({
      data: {
        ...data,
        creatorId: userId,
        status: "DRAFT",
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    logger.info("Projeto criado", { projectId: project.id, userId });

    return project;
  }

  static async update(id: string, data: UpdateProjectInput, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        creator: true,
        organization: true,
      },
    });

    if (!project) {
      throw new AppError(404, "Projeto não encontrado");
    }

    // Verificar permissões
    const canEdit =
      project.creatorId === userId || // Criador do projeto
      (project.orgId && // Ou admin da organização
        await prisma.user.findFirst({
          where: {
            id: userId,
            orgId: project.orgId,
            role: "ORG_ADMIN",
          },
        }));

    if (!canEdit) {
      throw new AppError(403, "Você não tem permissão para editar este projeto");
    }

    // Validar transição de status
    if (data.status && !this.isValidStatusTransition(project.status, data.status)) {
      throw new AppError(400, "Transição de status inválida");
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    logger.info("Projeto atualizado", { projectId: id, userId });

    return updatedProject;
  }

  static async findById(id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        votes: {
          select: {
            id: true,
            value: true,
            userId: true,
          },
        },
        missions: {
          where: {
            status: "ACTIVE",
          },
          select: {
            id: true,
            title: true,
            points: true,
          },
        },
      },
    });

    if (!project) {
      throw new AppError(404, "Projeto não encontrado");
    }

    return project;
  }

  static async findAll(filters: ProjectFilterInput) {
    const { page, limit, sortBy, sortOrder, ...where } = filters;
    const skip = (page - 1) * limit;

    // Construir query where dinâmica
    const whereClause: any = {};
    if (where.status) whereClause.status = where.status;
    if (where.category) whereClause.category = where.category;
    if (where.location) whereClause.location = where.location;
    if (where.creatorId) whereClause.creatorId = where.creatorId;
    if (where.orgId) whereClause.orgId = where.orgId;
    if (where.search) {
      whereClause.OR = [
        { title: { contains: where.search } },
        { description: { contains: where.search } },
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: whereClause,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
          _count: {
            select: {
              votes: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.project.count({ where: whereClause }),
    ]);

    return {
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async delete(id: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        creator: true,
        organization: true,
      },
    });

    if (!project) {
      throw new AppError(404, "Projeto não encontrado");
    }

    // Verificar permissões
    const canDelete =
      project.creatorId === userId || // Criador do projeto
      (project.orgId && // Ou admin da organização
        await prisma.user.findFirst({
          where: {
            id: userId,
            orgId: project.orgId,
            role: "ORG_ADMIN",
          },
        }));

    if (!canDelete) {
      throw new AppError(403, "Você não tem permissão para excluir este projeto");
    }

    await prisma.project.delete({
      where: { id },
    });

    logger.info("Projeto excluído", { projectId: id, userId });

    return true;
  }

  private static isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
    const transitions: { [key: string]: string[] } = {
      DRAFT: ["PENDING"],
      PENDING: ["ACTIVE", "CANCELLED"],
      ACTIVE: ["COMPLETED", "CANCELLED"],
      COMPLETED: [],
      CANCELLED: [],
    };

    return transitions[currentStatus]?.includes(newStatus) ?? false;
  }
}
