export async function extractPaletteFromImage(file: File): Promise<string[]> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result)
      else reject(new Error("Failed to read image file."))
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Invalid image file."))
    img.src = dataUrl
  })

  const canvas = document.createElement("canvas")
  const maxSize = 240
  const scale = Math.min(maxSize / image.width, maxSize / image.height, 1)
  canvas.width = Math.round(image.width * scale)
  canvas.height = Math.round(image.height * scale)
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas context not available.")

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  const colorCounts = new Map<string, number>()
  const quantizeSize = 16
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]
    if (a < 128) continue

    const key = [r, g, b]
      .map((val) => Math.min(255, Math.max(0, Math.round(val / quantizeSize) * quantizeSize)))
      .join(",")
    colorCounts.set(key, (colorCounts.get(key) ?? 0) + 1)
  }

  const sorted = Array.from(colorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  const colors = sorted.map(([key]) => {
    const [r, g, b] = key.split(",").map(Number)
    return rgbToHex(r, g, b)
  })

  if (colors.length === 0) {
    throw new Error("Could not extract colors from the image.")
  }

  return colors
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (value: number) => value.toString(16).padStart(2, "0")
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}
