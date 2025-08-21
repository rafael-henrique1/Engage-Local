import prisma from "../lib/prisma";
import { AppError } from "../middlewares/error";
import { CreateVoteInput, VoteStatsInput } from "../schemas/vote";
import logger from "../lib/logger";

export class VoteService {
  static async vote(
    projectId: string,
    userId: string,
    data: CreateVoteInput,
    ipAddress: string
  ) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new AppError(404, "Projeto não encontrado");
    }

    if (project.status !== "ACTIVE") {
      throw new AppError(400, "Este projeto não está aberto para votação");
    }

    // Verificar se o usuário já votou neste projeto
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });

    // Verificar limite de votos por IP nas últimas 24h
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const ipVotesCount = await prisma.vote.count({
      where: {
        ipAddress,
        createdAt: {
          gte: last24Hours,
        },
      },
    });

    if (ipVotesCount >= 100) {
      throw new AppError(
        429,
        "Limite de votos excedido. Tente novamente em 24 horas"
      );
    }

    let vote;
    if (existingVote) {
      // Atualizar voto existente
      if (existingVote.value === data.value) {
        throw new AppError(400, "Você já votou desta forma neste projeto");
      }

      vote = await prisma.vote.update({
        where: {
          id: existingVote.id,
        },
        data: {
          value: data.value,
          ipAddress,
          deviceId: data.deviceId,
        },
      });

      logger.info("Voto atualizado", {
        userId,
        projectId,
        value: data.value,
      });
    } else {
      // Criar novo voto
      vote = await prisma.vote.create({
        data: {
          projectId,
          userId,
          value: data.value,
          ipAddress,
          deviceId: data.deviceId,
        },
      });

      logger.info("Novo voto registrado", {
        userId,
        projectId,
        value: data.value,
      });
    }

    // Criar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId,
        action: existingVote ? "UPDATE_VOTE" : "CREATE_VOTE",
        entityType: "VOTE",
        entityId: vote.id,
        metadata: {
          projectId,
          value: data.value,
          ipAddress,
          deviceId: data.deviceId,
        },
      },
    });

    return vote;
  }

  static async getProjectVotes(projectId: string) {
    const votes = await prisma.vote.groupBy({
      by: ["value"],
      where: {
        projectId,
      },
      _count: true,
    });

    const voteCount = votes.reduce(
      (acc, curr) => {
        if (curr.value === 1) acc.upvotes = curr._count;
        if (curr.value === -1) acc.downvotes = curr._count;
        return acc;
      },
      { upvotes: 0, downvotes: 0 }
    );

    return {
      ...voteCount,
      total: voteCount.upvotes + voteCount.downvotes,
      score: voteCount.upvotes - voteCount.downvotes,
    };
  }

  static async getVoteStats({ projectId, timeframe }: VoteStatsInput) {
    const timeframeDate = new Date();
    switch (timeframe) {
      case "day":
        timeframeDate.setDate(timeframeDate.getDate() - 1);
        break;
      case "week":
        timeframeDate.setDate(timeframeDate.getDate() - 7);
        break;
      case "month":
        timeframeDate.setMonth(timeframeDate.getMonth() - 1);
        break;
      default:
        timeframeDate.setFullYear(2000); // Prakticamente desde sempre
    }

    const votes = await prisma.vote.groupBy({
      by: ["value"],
      where: {
        projectId,
        createdAt: {
          gte: timeframeDate,
        },
      },
      _count: true,
    });

    const voteCount = votes.reduce(
      (acc, curr) => {
        if (curr.value === 1) acc.upvotes = curr._count;
        if (curr.value === -1) acc.downvotes = curr._count;
        return acc;
      },
      { upvotes: 0, downvotes: 0 }
    );

    return {
      timeframe,
      ...voteCount,
      total: voteCount.upvotes + voteCount.downvotes,
      score: voteCount.upvotes - voteCount.downvotes,
    };
  }

  static async getUserVote(projectId: string, userId: string) {
    const vote = await prisma.vote.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });

    return vote;
  }

  static async deleteVote(projectId: string, userId: string) {
    const vote = await prisma.vote.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });

    if (!vote) {
      throw new AppError(404, "Voto não encontrado");
    }

    await prisma.vote.delete({
      where: {
        id: vote.id,
      },
    });

    // Criar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId,
        action: "DELETE_VOTE",
        entityType: "VOTE",
        entityId: vote.id,
        metadata: {
          projectId,
        },
      },
    });

    logger.info("Voto removido", { userId, projectId });

    return true;
  }
}
