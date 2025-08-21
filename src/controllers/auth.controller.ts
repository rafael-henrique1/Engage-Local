import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { config } from "../config";
import { AppError } from "../middlewares/error";

export class AuthController {
  static async register(req: Request, res: Response) {
    const { user, tokens } = await AuthService.register(req.body);

    res.cookie("access_token", tokens.accessToken, config.jwt.cookieOptions);
    res.cookie("refresh_token", tokens.refreshToken, {
      ...config.jwt.cookieOptions,
      path: "/auth/refresh",
    });

    return res.status(201).json({ user });
  }

  static async login(req: Request, res: Response) {
    const { user, tokens } = await AuthService.login(req.body);

    res.cookie("access_token", tokens.accessToken, config.jwt.cookieOptions);
    res.cookie("refresh_token", tokens.refreshToken, {
      ...config.jwt.cookieOptions,
      path: "/auth/refresh",
    });

    return res.json({ user });
  }

  static async refresh(req: Request, res: Response) {
    const token = req.cookies.refresh_token;

    if (!token) {
      throw new AppError(401, "Token de refresh não encontrado");
    }

    const tokens = await AuthService.refreshToken(token);

    res.cookie("access_token", tokens.accessToken, config.jwt.cookieOptions);
    res.cookie("refresh_token", tokens.refreshToken, {
      ...config.jwt.cookieOptions,
      path: "/auth/refresh",
    });

    return res.json({ message: "Token atualizado com sucesso" });
  }

  static async logout(req: Request, res: Response) {
    const userId = req.user?.sub;

    if (userId) {
      await AuthService.logout(userId);
    }

    res.clearCookie("access_token", config.jwt.cookieOptions);
    res.clearCookie("refresh_token", {
      ...config.jwt.cookieOptions,
      path: "/auth/refresh",
    });

    return res.json({ message: "Logout realizado com sucesso" });
  }

  static async me(req: Request, res: Response) {
    const user = await AuthService.getProfile(req.user!.sub);
    return res.json(user);
  }
}
