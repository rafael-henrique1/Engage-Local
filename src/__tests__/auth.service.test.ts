import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { AuthService } from "../services/auth.service";
import prisma from "../lib/prisma";

describe("AuthService", () => {
  const testUser = {
    name: "Test User",
    email: "test@example.com",
    password: "Test@123456",
    role: "USER" as const,
  };

  beforeAll(async () => {
    // Limpar banco de dados de teste
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("should register a new user", async () => {
    const result = await AuthService.register(testUser);

    expect(result.user).toHaveProperty("id");
    expect(result.user.email).toBe(testUser.email);
    expect(result.user.name).toBe(testUser.name);
    expect(result.user.role).toBe(testUser.role);
    expect(result.tokens).toHaveProperty("accessToken");
    expect(result.tokens).toHaveProperty("refreshToken");
  });

  it("should not register a user with existing email", async () => {
    await expect(AuthService.register(testUser)).rejects.toThrow("Email já cadastrado");
  });

  it("should login with correct credentials", async () => {
    const result = await AuthService.login({
      email: testUser.email,
      password: testUser.password,
    });

    expect(result.user).toHaveProperty("id");
    expect(result.user.email).toBe(testUser.email);
    expect(result.tokens).toHaveProperty("accessToken");
    expect(result.tokens).toHaveProperty("refreshToken");
  });

  it("should not login with incorrect password", async () => {
    await expect(
      AuthService.login({
        email: testUser.email,
        password: "wrongpassword",
      })
    ).rejects.toThrow("Credenciais inválidas");
  });

  it("should get user profile", async () => {
    const { user } = await AuthService.login({
      email: testUser.email,
      password: testUser.password,
    });

    const profile = await AuthService.getProfile(user.id);

    expect(profile).toHaveProperty("id");
    expect(profile.email).toBe(testUser.email);
    expect(profile.name).toBe(testUser.name);
    expect(profile).toHaveProperty("points");
    expect(profile).toHaveProperty("level");
  });
});
