import jwt from "jsonwebtoken";

const JWT_SECRET = (process.env.JWT_SECRET || "supersecret-dev-key") as string;

export function signJwt(
  payload: { userId: string; role: "USER" | "ADMIN" },
  expiresIn: number = 60 * 60 * 24 * 7
) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyJwt(token: string) {
  return jwt.verify(token, JWT_SECRET);
}
