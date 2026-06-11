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
