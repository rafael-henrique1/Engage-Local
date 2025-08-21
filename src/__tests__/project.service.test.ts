import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { ProjectService } from "../services/project.service";
import prisma from "../lib/prisma";

describe("ProjectService", () => {
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

  beforeAll(async () => {
    // Criar usuário de teste
    const user = await prisma.user.create({
      data: {
        ...testUser,
        password: "hashed_password", // Em um caso real, usaríamos bcrypt
      },
    });
    userId = user.id;
  });

  beforeEach(async () => {
    // Limpar projetos antes de cada teste
    await prisma.project.deleteMany();
  });

  afterAll(async () => {
    // Limpar banco de dados de teste
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("should create a new project", async () => {
    const project = await ProjectService.create(testProject, userId);

    expect(project).toHaveProperty("id");
    expect(project.title).toBe(testProject.title);
    expect(project.status).toBe("DRAFT");
    expect(project.creatorId).toBe(userId);
  });

  it("should find a project by id", async () => {
    const created = await ProjectService.create(testProject, userId);
    const found = await ProjectService.findById(created.id);

    expect(found.id).toBe(created.id);
    expect(found.title).toBe(testProject.title);
  });

  it("should update a project", async () => {
    const created = await ProjectService.create(testProject, userId);
    const updated = await ProjectService.update(
      created.id,
      { title: "Updated Title" },
      userId
    );

    expect(updated.id).toBe(created.id);
    expect(updated.title).toBe("Updated Title");
  });

  it("should not update a project with invalid status transition", async () => {
    const created = await ProjectService.create(testProject, userId);
    
    await expect(
      ProjectService.update(
        created.id,
        { status: "COMPLETED" },
        userId
      )
    ).rejects.toThrow("Transição de status inválida");
  });

  it("should list projects with pagination", async () => {
    // Criar múltiplos projetos
    await Promise.all([
      ProjectService.create(testProject, userId),
      ProjectService.create({ ...testProject, title: "Project 2" }, userId),
      ProjectService.create({ ...testProject, title: "Project 3" }, userId),
    ]);

    const result = await ProjectService.findAll({
      page: 1,
      limit: 2,
      sortBy: "createdAt",
      sortOrder: "desc",
    });

    expect(result.projects).toHaveLength(2);
    expect(result.pagination.total).toBe(3);
    expect(result.pagination.totalPages).toBe(2);
  });

  it("should delete a project", async () => {
    const created = await ProjectService.create(testProject, userId);
    await ProjectService.delete(created.id, userId);

    await expect(
      ProjectService.findById(created.id)
    ).rejects.toThrow("Projeto não encontrado");
  });

  it("should not allow unauthorized user to delete project", async () => {
    const created = await ProjectService.create(testProject, userId);
    
    await expect(
      ProjectService.delete(created.id, "wrong-user-id")
    ).rejects.toThrow("Você não tem permissão para excluir este projeto");
  });
});
