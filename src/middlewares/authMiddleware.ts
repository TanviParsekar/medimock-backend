import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

// Extend Express Request to include userId and role
export interface AuthRequest extends Request {
  userId?: string;
  role?: "USER" | "ADMIN";
}

// Middleware to authenticate JWT and attach user info to request
export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role?: "USER" | "ADMIN";
    };

    req.userId = decoded.userId;
    req.role = decoded.role;
    next();
  } catch (err) {
    return res
      .status(403)
      .json({ error: "Forbidden: Invalid or expired token" });
  }
}
