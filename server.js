require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(cors());
app.use(express.json());

// Detect damage in books, furniture and laptops
app.post("/detect", upload.single("image"), async (req, res) => {
  try {
    const imageData = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a damage detection expert. Analyze this image carefully and detect any damage on books, furniture, or laptops/electronics.

    For each item you find, assess:
    - What the item is
    - Condition (Good/Fair/Damaged/Severely Damaged)
    - What damage is visible (scratches, cracks, tears, stains, dents etc)
    - Estimated condition percentage (100% = perfect, 0% = destroyed)
    - Whether it is still sellable as second hand

    Respond ONLY in this exact JSON format, no extra text:
    {
      "items_detected": [
        {
          "item": "Laptop",
          "condition": "Damaged",
          "damage_description": "Crack on screen, dent on corner",
          "condition_percentage": 60,
          "sellable": true,
          "suggested_price_reduction": "30%"
        }
      ],
      "overall_assessment": "Fair condition with some damage",
      "sellable_overall": true,
      "summary": "The items show moderate wear and tear but are still functional"
    }`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageData,
          mimeType: mimeType,
        },
      },
    ]);

    const response = result.response.text();
    const cleaned = response.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    res.json(parsed);

  } catch (error) {
    console.error("FULL ERROR:", error.message);
    res.status(500).json({ error: "Detection failed" });
  }
});

app.listen(5001, () => {
  console.log("Damage Detection Backend running on port 5001");
});