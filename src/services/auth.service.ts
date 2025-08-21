import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env, config } from "../config";
import prisma from "../lib/prisma";
import { AppError } from "../middlewares/error";
import { LoginInput, RegisterInput } from "../schemas/auth";
import logger from "../lib/logger";

export class AuthService {
  private static generateTokens(userId: string, role: string) {
    const accessToken = jwt.sign(
      { sub: userId, role },
      env.JWT_SECRET,
      { expiresIn: config.jwt.accessTokenExpiresIn }
    );

    const refreshToken = jwt.sign(
      { sub: userId, role },
      env.JWT_REFRESH_SECRET,
      { expiresIn: config.jwt.refreshTokenExpiresIn }
    );

    return { accessToken, refreshToken };
  }

  static async register(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError(400, "Email já cadastrado");
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    logger.info("Novo usuário registrado", { userId: user.id });

    const tokens = this.generateTokens(user.id, user.role);

    return { user, tokens };
  }

  static async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError(401, "Credenciais inválidas");
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new AppError(401, "Credenciais inválidas");
    }

    logger.info("Usuário logado", { userId: user.id });

    const tokens = this.generateTokens(user.id, user.role);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tokens,
    };
  }

  static async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as {
        sub: string;
        role: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
        select: {
          id: true,
          role: true,
        },
      });

      if (!user) {
        throw new AppError(401, "Usuário não encontrado");
      }

      const tokens = this.generateTokens(user.id, user.role);

      return tokens;
    } catch (error) {
      throw new AppError(401, "Token de refresh inválido");
    }
  }

  static async logout(userId: string) {
    logger.info("Usuário deslogado", { userId });
    // Aqui poderíamos implementar uma lista negra de tokens se necessário
    return true;
  }
}
  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
        avatar: true,
        points: true,
        level: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError(404, "Usuário não encontrado");
    }

    return user;
  }
