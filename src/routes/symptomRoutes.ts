import express from "express";
import { z } from "zod";
import prisma from "../../prisma";
import { authenticateToken, AuthRequest } from "../middlewares/authMiddleware";
import { format } from "date-fns";

const router = express.Router();

// Schema to validate symptom input
const symptomSchema = z.object({
  input: z
    .string()
    .min(10, "Symptom description must be at least 10 characters long"),
});

import { startOfYear, addMonths } from "date-fns";

// === Route: Monthly Analytics (Jan–Dec) ===
router.get("/analytics", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const yearStart = startOfYear(new Date());

    const logs = await prisma.symptomLog.findMany({
      where: {
        userId: req.userId,
        createdAt: {
          gte: yearStart,
        },
      },
      select: {
        createdAt: true,
      },
    });

    //Counts logs per month
    const counts: Record<string, number> = {};
    logs.forEach((log) => {
      const label = format(log.createdAt, "MMM");
      counts[label] = (counts[label] || 0) + 1;
    });

    // Generate months from Jan to Dec
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = addMonths(startOfYear(new Date()), i);
      const label = format(date, "MMM");
      return {
        date: label,
        count: counts[label] || 0,
      };
    });

    res.json(months);
  } catch (error) {
    console.error("Error in /analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics data" });
  }
});

// === Route: Get All Symptom Logs for Current User ===
router.get("/logs", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { date } = req.query;

    const where: any = {
      userId: req.userId,
    };

    if (date) {
      const selectedDate = new Date(date as string);
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);

      where.createdAt = {
        gte: start,
        lte: end,
      };
    }

    const logs = await prisma.symptomLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.json(logs);
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ error: "Failed to fetch symptom logs" });
  }
});

// === Route: Log a New Symptom (mocked AI response) ===
router.post("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { input } = symptomSchema.parse(req.body);

    const mockResponses = [
      `🩺 Mild viral infection.\n💡 Suggestions: Rest, hydrate, and monitor for 2–3 days.`,
      `🧠 Tension headache or dehydration.\n💡 Suggestions: Rest eyes, hydrate, use mild pain relief.`,
      `😷 Seasonal flu or cold.\n💡 Suggestions: Warm fluids, rest, and monitor symptoms.`,
      `👃 Sinus infection.\n💡 Suggestions: Try saline spray, consult ENT if needed.`,
      `🤧 Allergy or mild infection.\n💡 Suggestions: Avoid triggers, try antihistamines.`,
      `🌡️ Low-grade fever from viral illness.\n💡 Suggestions: Take paracetamol, rest, and check temperature regularly.`,
      `🫁 Mild bronchitis.\n💡 Suggestions: Avoid cold drinks, try steam inhalation, consult doctor if it worsens.`,
      `🥴 Food poisoning.\n💡 Suggestions: Hydrate with ORS, eat light, and avoid dairy or spicy food temporarily.`,
      `🤒 Stomach flu (gastroenteritis).\n💡 Suggestions: Drink clear fluids, avoid solid food initially, and rest.`,
      `🧏 Ear infection.\n💡 Suggestions: Warm compress, avoid inserting anything in ear, see doctor if pain increases.`,
      `😴 Fatigue due to stress.\n💡 Suggestions: Take short naps, reduce screen time, try deep breathing or meditation.`,
      `💊 Medication side effect.\n💡 Suggestions: Review recent medications, consult doctor before stopping any dose.`,
      `🫀 Mild chest congestion.\n💡 Suggestions: Use vapor rubs, inhale steam, and avoid cold beverages.`,
      `🦴 Muscle strain.\n💡 Suggestions: Apply cold compress, rest the area, and avoid heavy lifting.`,
      `👁️ Eye strain.\n💡 Suggestions: Follow 20-20-20 rule, reduce screen glare, use lubricating eye drops.`,
    ];

    const summary =
      mockResponses[Math.floor(Math.random() * mockResponses.length)];

    await prisma.symptomLog.create({
      data: {
        userId: req.userId!,
        input,
        aiResponse: summary,
      },
    });

    res.json({ summary });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.errors[0].message
        : "Failed to log symptoms";

    console.error("Error in POST /symptoms:", error);
    res.status(400).json({ error: message });
  }
});

export default router;
