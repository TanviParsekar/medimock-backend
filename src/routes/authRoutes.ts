import express from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../../prisma";
import { signJwt } from "../utils/jwt";

const router = express.Router();

// === Validation Schemas ===
const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// === Register Route ===
router.post("/register", async (req, res) => {
  try {
    const { email, name, password } = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: { email, name, passwordHash },
    });

    const token = signJwt({ userId: newUser.id, role: newUser.role });

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    });
  } catch (err) {
    const message =
      err instanceof z.ZodError ? err.errors[0].message : "Registration failed";
    res.status(400).json({ error: message });
  }
});

// === Login Route ===
router.post("/login", async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signJwt({ userId: user.id, role: user.role });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    const message =
      err instanceof z.ZodError ? err.errors[0].message : "Login failed";
    res.status(400).json({ error: message });
  }
});

export default router;
