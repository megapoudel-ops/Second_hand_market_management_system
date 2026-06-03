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

// Analyze image - extract color palette and suggest furniture
app.post("/analyze", upload.single("image"), async (req, res) => {
  try {
    const imageData = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Analyze this room image and provide:
    1. COLOR PALETTE: Extract exactly 3 main colors as hex codes with names (Primary, Accent, Neutral)
    2. FURNITURE SUGGESTIONS: Suggest 3 furniture items that match the room colors with reasons

    Respond ONLY in this exact JSON format, no extra text:
    {
      "palette": [
        { "name": "Primary", "hex": "#006A61" },
        { "name": "Accent", "hex": "#86F2E4" },
        { "name": "Neutral", "hex": "#0B1C30" }
      ],
      "furniture_suggestions": [
        { "item": "Sofa", "color": "#006A61", "reason": "Matches primary tone" },
        { "item": "Coffee Table", "color": "#86F2E4", "reason": "Complements accent" },
        { "item": "Bookshelf", "color": "#0B1C30", "reason": "Adds depth" }
      ],
      "css_export": ":root { --primary: #006A61; --accent: #86F2E4; --neutral: #0B1C30; }"
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
    res.status(500).json({ error: "Analysis failed" });
  }
});

// Save palette to collection
app.post("/save", express.json(), (req, res) => {
  const { palette, name } = req.body;
  res.json({
    success: true,
    message: "Palette saved to collection!",
    saved: { name, palette, savedAt: new Date() }
  });
});

// Export palette as CSS/SCSS
app.post("/export", express.json(), (req, res) => {
  const { palette } = req.body;

  const css = `:root {\n${palette.map(c => `  --${c.name.toLowerCase()}: ${c.hex};`).join("\n")}\n}`;
  const scss = `// Color Palette\n${palette.map(c => `$${c.name.toLowerCase()}: ${c.hex};`).join("\n")}`;

  res.json({ css, scss });
});

app.listen(4000, () => {
  console.log("Color Palette Backend running on port 4000");
});