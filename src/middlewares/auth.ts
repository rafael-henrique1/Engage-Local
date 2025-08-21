import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config";
import logger from "../lib/logger";
import { z } from "zod";

export interface JwtPayload {
  sub: string;
  role: string;
}

export const auth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.access_token;

    if (!token) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = decoded;

    next();
  } catch (error) {
    logger.error("Auth middleware error:", error);
    return res.status(401).json({ message: "Token inválido" });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Não autorizado" });
    }

    next();
  };
};

export const validate = (schema: z.ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Dados inválidos",
          errors: error.errors,
        });
      }
      next(error);
    }
  };
};
