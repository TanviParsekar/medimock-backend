import express from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../../prisma";
import { authenticateToken, AuthRequest } from "../middlewares/authMiddleware";

const router = express.Router();

// Helper: Check admin access
const requireAdmin = (req: AuthRequest, res: express.Response) => {
  if (req.role !== "ADMIN") {
    res.status(403).json({ error: "Access denied" });
    return false;
  }
  return true;
};

// Zod schema for role update
const roleSchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
});

// Zod schema for profile update
const updateMeSchema = z.object({
  name: z.string().min(1).optional(),
  password: z.string().min(6).optional(),
});

// ───────────────────────────────
// GET /api/users - Admin only
router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
    });
    res.json(users);
  } catch (err) {
    console.error("Error fetching users", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ───────────────────────────────
// PATCH /api/users/:id/role
router.patch("/:id/role", authenticateToken, async (req: AuthRequest, res) => {
  if (!requireAdmin(req, res)) return;

  const { id } = req.params;

  try {
    const { role } = roleSchema.parse(req.body);

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    res.json(updated);
  } catch (err: any) {
    console.error("Error updating role", err);
    res.status(400).json({ error: err.message || "Failed to update role" });
  }
});

// ───────────────────────────────
// DELETE /api/users/me
router.delete("/me", authenticateToken, async (req: AuthRequest, res) => {
  try {
    // check if the user actually exists
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      console.log("User not found for deletion");
      return res.status(404).json({ error: "User not found" });
    }

    await prisma.user.delete({
      where: { id: req.userId },
    });

    res.json({ message: "Account deleted" });
  } catch (err: unknown) {
    console.error("Failed to delete account", err);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

// ───────────────────────────────
// DELETE /api/users/:id
router.delete("/:id", authenticateToken, async (req: AuthRequest, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ───────────────────────────────
// PATCH /api/users/me
router.patch("/me", authenticateToken, async (req: AuthRequest, res) => {
  const userId = req.userId;

  try {
    const { name, password, currentPassword } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const updates: { name?: string; passwordHash?: string } = {};

    if (name && name !== existingUser.name) {
      updates.name = name;
    }

    if (password) {
      if (!currentPassword) {
        return res.status(400).json({ error: "Current password is required" });
      }

      const isCorrect = await bcrypt.compare(
        currentPassword,
        existingUser.passwordHash!
      );
      if (!isCorrect) {
        return res.status(400).json({ error: "Invalid current password" });
      }

      if (password === currentPassword) {
        return res.status(400).json({
          error: "New password must be different from the current one",
        });
      }

      updates.passwordHash = await bcrypt.hash(password, 10);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No changes to update" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    res.json(updatedUser);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Error updating profile:", err.message);
      res.status(400).json({ error: err.message });
    } else {
      res.status(400).json({ error: "Failed to update profile" });
    }
  }
});

export default router;
