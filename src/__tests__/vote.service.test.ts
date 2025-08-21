import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { VoteService } from "../services/vote.service";
import { ProjectService } from "../services/project.service";
import prisma from "../lib/prisma";

describe("VoteService", () => {
  const testUser = {
    name: "Test User",
    email: "test@example.com",
    password: "Test@123456",
    role: "USER" as const,
  };

  const testProject = {
    title: "Test Project",
    description: "This is a test project",
    category: "ENVIRONMENT",
    location: "Test City",
    goals: [
      {
        description: "First goal",
        target: 100,
      },
    ],
  };

  let userId: string;
  let projectId: string;

  beforeAll(async () => {
    // Criar usuário e projeto de teste
    const user = await prisma.user.create({
      data: {
        ...testUser,
        password: "hashed_password",
      },
    });
    userId = user.id;

    const project = await ProjectService.create(testProject, userId);
    projectId = project.id;

    // Ativar o projeto para votação
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "ACTIVE" },
    });
  });

  beforeEach(async () => {
    // Limpar votos antes de cada teste
    await prisma.vote.deleteMany();
  });

  afterAll(async () => {
    // Limpar banco de dados de teste
    await prisma.vote.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("should create a new vote", async () => {
    const vote = await VoteService.vote(
      projectId,
      userId,
      { value: 1 },
      "127.0.0.1"
    );

    expect(vote).toHaveProperty("id");
    expect(vote.value).toBe(1);
    expect(vote.userId).toBe(userId);
    expect(vote.projectId).toBe(projectId);
  });

  it("should not allow voting on inactive projects", async () => {
    // Criar projeto inativo
    const inactiveProject = await ProjectService.create(
      { ...testProject, title: "Inactive Project" },
      userId
    );

    await expect(
      VoteService.vote(inactiveProject.id, userId, { value: 1 }, "127.0.0.1")
    ).rejects.toThrow("Este projeto não está aberto para votação");
  });

  it("should update existing vote", async () => {
    // Criar voto inicial
    await VoteService.vote(projectId, userId, { value: 1 }, "127.0.0.1");

    // Atualizar voto
    const updatedVote = await VoteService.vote(
      projectId,
      userId,
      { value: -1 },
      "127.0.0.1"
    );

    expect(updatedVote.value).toBe(-1);
  });

  it("should not allow same vote value twice", async () => {
    await VoteService.vote(projectId, userId, { value: 1 }, "127.0.0.1");

    await expect(
      VoteService.vote(projectId, userId, { value: 1 }, "127.0.0.1")
    ).rejects.toThrow("Você já votou desta forma neste projeto");
  });

  it("should get project vote statistics", async () => {
    // Criar múltiplos votos
    await Promise.all([
      VoteService.vote(projectId, userId, { value: 1 }, "127.0.0.1"),
      VoteService.vote(projectId, "user2", { value: 1 }, "127.0.0.2"),
      VoteService.vote(projectId, "user3", { value: -1 }, "127.0.0.3"),
    ]);

    const stats = await VoteService.getProjectVotes(projectId);

    expect(stats.upvotes).toBe(2);
    expect(stats.downvotes).toBe(1);
    expect(stats.total).toBe(3);
    expect(stats.score).toBe(1);
  });

  it("should get vote statistics by timeframe", async () => {
    // Criar votos
    await VoteService.vote(projectId, userId, { value: 1 }, "127.0.0.1");

    const stats = await VoteService.getVoteStats({
      projectId,
      timeframe: "day",
    });

    expect(stats).toHaveProperty("timeframe", "day");
    expect(stats.upvotes).toBe(1);
    expect(stats.downvotes).toBe(0);
  });

  it("should get user vote for project", async () => {
    await VoteService.vote(projectId, userId, { value: 1 }, "127.0.0.1");

    const vote = await VoteService.getUserVote(projectId, userId);

    expect(vote).toHaveProperty("id");
    expect(vote?.value).toBe(1);
  });

  it("should delete vote", async () => {
    await VoteService.vote(projectId, userId, { value: 1 }, "127.0.0.1");
    
    await VoteService.deleteVote(projectId, userId);

    const vote = await VoteService.getUserVote(projectId, userId);
    expect(vote).toBeNull();
  });
});
