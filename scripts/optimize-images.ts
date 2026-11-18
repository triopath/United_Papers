/**
 * Shrinks product photos for the web: max 900px wide, WebP q80.
 * Originals are MOVED (not deleted) to assets/originals/products/ so nothing is lost.
 *   npm run images:optimize
 * Drop new PNG/JPG files into public/products/, run this, then point src/lib/product-images.ts at the .webp.
 */
import { existsSync, mkdirSync, readdirSync, renameSync, statSync } from "node:fs";
import { extname, join, parse } from "node:path";
import sharp from "sharp";

const dir = join(process.cwd(), "public", "products");
const archive = join(process.cwd(), "assets", "originals", "products");
mkdirSync(archive, { recursive: true });

async function main() {
  let before = 0;
  let after = 0;
  for (const file of readdirSync(dir)) {
    const ext = extname(file).toLowerCase();
    if (![".png", ".jpg", ".jpeg"].includes(ext)) continue;
    const src = join(dir, file);
    const out = join(dir, `${parse(file).name}.webp`);
    before += statSync(src).size;
    await sharp(src).rotate().resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toFile(out);
    after += statSync(out).size;
    const dest = join(archive, file);
    if (existsSync(dest)) throw new Error(`Refusing to overwrite archived original ${dest}`);
    renameSync(src, dest);
    console.log(`${file} -> ${parse(file).name}.webp`);
  }
  console.log(`\n${(before / 1048576).toFixed(1)} MB -> ${(after / 1048576).toFixed(1)} MB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
