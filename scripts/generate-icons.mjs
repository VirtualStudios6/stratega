import sharp from "sharp"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")

const SRC_ICON = path.join(root, "icons", "icon-512.webp")
const SRC_FG   = path.join(root, "public", "logos", "logo-512x512-sin-fondo.png")
const RES      = path.join(root, "android", "app", "src", "main", "res")

const ICON_SIZES = [
  { density: "mipmap-ldpi",    px: 36  },
  { density: "mipmap-mdpi",    px: 48  },
  { density: "mipmap-hdpi",    px: 72  },
  { density: "mipmap-xhdpi",   px: 96  },
  { density: "mipmap-xxhdpi",  px: 144 },
  { density: "mipmap-xxxhdpi", px: 192 },
]

const FG_SIZES = [
  { density: "mipmap-ldpi",    px: 81  },
  { density: "mipmap-mdpi",    px: 108 },
  { density: "mipmap-hdpi",    px: 162 },
  { density: "mipmap-xhdpi",   px: 216 },
  { density: "mipmap-xxhdpi",  px: 324 },
  { density: "mipmap-xxxhdpi", px: 432 },
]

const BG = { r: 8, g: 8, b: 16, alpha: 255 }

async function circularIcon(inputBuf, size) {
  const circle = Buffer.from(
    `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><circle cx="${size/2}" cy="${size/2}" r="${size/2}"/></svg>`
  )
  const base = await sharp(inputBuf)
    .resize(size, size, { fit: "contain", background: { ...BG } })
    .ensureAlpha()
    .png()
    .toBuffer()
  return sharp(base)
    .composite([{ input: circle, blend: "dest-in" }])
    .png()
    .toBuffer()
}

async function main() {
  // ── Launcher icons ────────────────────────────────────────────
  for (const { density, px } of ICON_SIZES) {
    const dir = path.join(RES, density)
    fs.mkdirSync(dir, { recursive: true })

    // Square
    await sharp(SRC_ICON)
      .resize(px, px, { fit: "contain", background: { ...BG } })
      .png()
      .toFile(path.join(dir, "ic_launcher.png"))

    // Round (circular clip)
    const squareBuf = await sharp(SRC_ICON)
      .resize(px, px, { fit: "contain", background: { ...BG } })
      .ensureAlpha()
      .png()
      .toBuffer()
    const roundBuf = await circularIcon(squareBuf, px)
    fs.writeFileSync(path.join(dir, "ic_launcher_round.png"), roundBuf)

    console.log(`✅  ${density}: ic_launcher + ic_launcher_round (${px}px)`)
  }

  // ── Adaptive foreground (transparent logo, full canvas) ───────
  for (const { density, px } of FG_SIZES) {
    const dir = path.join(RES, density)
    fs.mkdirSync(dir, { recursive: true })
    await sharp(SRC_FG)
      .resize(px, px, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(dir, "ic_launcher_foreground.png"))
    console.log(`✅  ${density}: ic_launcher_foreground (${px}px transparent)`)
  }

  // ── Splash screen PNG (dark bg + centered icon) ───────────────
  const SPLASH = 1080
  const LOGO   = 300
  const OFF    = Math.round((SPLASH - LOGO) / 2)
  const logoBuf = await sharp(SRC_ICON)
    .resize(LOGO, LOGO, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .png()
    .toBuffer()
  await sharp({
    create: { width: SPLASH, height: SPLASH, channels: 4, background: { ...BG } }
  })
    .composite([{ input: logoBuf, left: OFF, top: OFF }])
    .png()
    .toFile(path.join(RES, "drawable", "splash.png"))
  console.log(`✅  drawable/splash.png  (${SPLASH}×${SPLASH}, dark)`)

  console.log("\n🎉  All icons generated successfully!")
}

main().catch(err => { console.error(err); process.exit(1) })
