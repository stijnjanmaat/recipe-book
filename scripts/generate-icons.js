import sharp from "sharp";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, "..", "public");

// Primary color from theme: #fab429 (Lightning)
const primaryColor = "#fab429";
const backgroundColor = "#ffffff";

async function generateIcon(size, filename) {
  // Create a simple icon with a recipe book emoji or text
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
      <rect x="${size * 0.1}" y="${size * 0.1}" width="${size * 0.8}" height="${size * 0.8}" 
            fill="${primaryColor}" rx="${size * 0.1}"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.4}" 
            font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">📖</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(join(publicDir, filename));

  console.log(`Generated ${filename} (${size}x${size})`);
}

async function generateIcons() {
  console.log("Generating PWA icons...");

  await generateIcon(192, "icon-192.png");
  await generateIcon(512, "icon-512.png");
  await generateIcon(180, "apple-touch-icon.png");

  console.log("Icons generated successfully!");
}

generateIcons().catch(console.error);
