import sharp from "sharp";
import { mkdir } from "fs/promises";
import path from "path";

const SOURCE = path.resolve("logo-gpv1~2_x16.png");
const OUT = path.resolve("public/icons");

async function removeBlackBackground(buffer) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r < 45 && g < 45 && b < 45) {
      data[i + 3] = 0;
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  });
}

async function toSquare(image) {
  const meta = await image.metadata();
  const size = Math.max(meta.width, meta.height);
  const top = Math.floor((size - meta.height) / 2);
  const left = Math.floor((size - meta.width) / 2);

  return image.extend({
    top,
    bottom: size - meta.height - top,
    left,
    right: size - meta.width - left,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });
}

async function composeIcon(squareImage, size, paddingRatio, background = { r: 0, g: 0, b: 0, alpha: 0 }) {
  const inner = Math.round(size * (1 - paddingRatio * 2));
  const resized = await squareImage
    .clone()
    .resize(inner, inner, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  }).composite([{ input: resized, gravity: "center" }]);
}

const WHITE_BG = { r: 255, g: 255, b: 255, alpha: 1 };
const BRAND_BG = { r: 22, g: 101, b: 52, alpha: 1 }; // #166534

async function writeIcon(squareImage, filename, size, paddingRatio, background) {
  const icon = await composeIcon(squareImage, size, paddingRatio, background);
  await icon.png().toFile(path.join(OUT, filename));
  console.log(`  ${filename} (${size}x${size}, padding ${Math.round(paddingRatio * 100)}%)`);
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const sourceBuffer = await sharp(SOURCE).toBuffer();
  const transparent = await removeBlackBackground(sourceBuffer);
  const squareBuffer = await (await toSquare(transparent)).png().toBuffer();
  const square = sharp(squareBuffer);

  await square
    .clone()
    .resize(512, 512, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toFile(path.join(OUT, "../logo-gpv.png"));

  console.log("Icone Android (standard, sfondo bianco):");
  await writeIcon(square, "icon-192.png", 192, 0.06, WHITE_BG);
  await writeIcon(square, "icon-512.png", 512, 0.06, WHITE_BG);

  console.log("Icone Android (maskable, sfondo brand):");
  await writeIcon(square, "icon-192-maskable.png", 192, 0.18, BRAND_BG);
  await writeIcon(square, "icon-512-maskable.png", 512, 0.18, BRAND_BG);

  console.log("Icone iOS (sfondo bianco):");
  await writeIcon(square, "apple-touch-icon.png", 180, 0.08, WHITE_BG);
  await writeIcon(square, "apple-touch-icon-152.png", 152, 0.08, WHITE_BG);
  await writeIcon(square, "apple-touch-icon-167.png", 167, 0.08, WHITE_BG);

  console.log("Favicon:");
  await writeIcon(square, "favicon-32.png", 32, 0.06, WHITE_BG);
  await writeIcon(square, "favicon-16.png", 16, 0.04, WHITE_BG);

  const favicon32 = await composeIcon(square, 32, 0.06, WHITE_BG);
  await favicon32.png().toFile(path.join(OUT, "../favicon.ico"));

  console.log("Fatto.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
