<<<<<<< HEAD
import express from "express";
import multer from "multer";
import Jimp from "jimp";

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const PORT = process.env.PORT || 5000;
const SWORUP_API_URL = process.env.SWORUP_API_URL?.trim();

function toHex(value) {
  return value.toString(16).padStart(2, "0");
}

function rgbToHex(r, g, b) {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

async function extractPaletteFromBuffer(buffer) {
  const image = await Jimp.read(buffer);
  const maxSize = 200;
  const width = image.getWidth();
  const height = image.getHeight();
  const scale = Math.min(maxSize / width, maxSize / height, 1);
  const resized = image.clone().resize(Math.round(width * scale), Math.round(height * scale));

  const counts = new Map();
  const step = 4;
  for (let y = 0; y < resized.getHeight(); y += step) {
    for (let x = 0; x < resized.getWidth(); x += step) {
      const { r, g, b, a } = Jimp.intToRGBA(resized.getPixelColor(x, y));
      if (a < 128) continue;
      const quantized = [Math.round(r / 32) * 32, Math.round(g / 32) * 32, Math.round(b / 32) * 32].map((v) => Math.min(255, Math.max(0, v)));
      const key = quantized.join(",");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  const sorted = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([key]) => {
      const [r, g, b] = key.split(",").map(Number);
      return rgbToHex(r, g, b);
    });

  if (sorted.length === 0) {
    throw new Error("Could not extract colors from the uploaded image.");
  }

  return sorted;
}

app.post("/api/ai/palette", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Image file is required." });
  }

  try {
    if (SWORUP_API_URL) {
      const formData = new FormData();
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      formData.append("image", blob, req.file.originalname || "upload.png");

      const sworupResponse = await fetch(`${SWORUP_API_URL}/api/ai/palette`, {
        method: "POST",
        body: formData,
      });

      const contentType = sworupResponse.headers.get("content-type") || "application/json";
      const responseBody = await sworupResponse.text();
      if (!sworupResponse.ok) {
        return res.status(sworupResponse.status).type(contentType).send(responseBody);
      }

      return res.status(200).type(contentType).send(responseBody);
    }

    const colors = await extractPaletteFromBuffer(req.file.buffer);
    return res.status(200).json({ colors });
  } catch (error) {
    console.error("Sworup proxy error:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to extract palette." });
  }
});

app.listen(PORT, () => {
  console.log(`Sworup proxy server listening on http://localhost:${PORT}`);
  if (SWORUP_API_URL) {
    console.log(`Forwarding to Sworup backend at ${SWORUP_API_URL}`);
  } else {
    console.log("No SWORUP_API_URL configured, using local palette extraction.");
  }
});
=======
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
>>>>>>> ab79b9c57628d5ccf3051bbe06886ee955f16cc1
