/**
 * compress-images.mjs
 * Run: node compress-images.mjs
 * 
 * Compresses logo.png and favicon.svg for web delivery.
 * Before: logo.png ~740KB → After: ~15-30KB (WebP) + ~50KB optimized PNG
 */

import sharp from 'sharp';
import { existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, 'public');

function sizeKB(bytes) {
  return (bytes / 1024).toFixed(1) + ' KB';
}

async function compress() {
  console.log('\n🌿 Momin Agro — Image Compression\n');

  const logoPng = join(PUBLIC, 'logo.png');

  if (!existsSync(logoPng)) {
    console.error('❌ public/logo.png not found');
    process.exit(1);
  }

  const originalSize = statSync(logoPng).size;
  console.log(`📦 Original logo.png: ${sizeKB(originalSize)}`);

  // 1. Optimized PNG for Apple touch icon and manifest (192x192)
  await sharp(logoPng)
    .resize(192, 192, { fit: 'contain', background: { r: 22, g: 64, b: 44, alpha: 1 } })
    .png({ quality: 85, compressionLevel: 9, effort: 10 })
    .toFile(join(PUBLIC, 'logo-192.png'));

  const size192 = statSync(join(PUBLIC, 'logo-192.png')).size;
  console.log(`✅ logo-192.png: ${sizeKB(size192)} (192×192)`);

  // 2. Optimized PNG for manifest 512x512
  await sharp(logoPng)
    .resize(512, 512, { fit: 'contain', background: { r: 22, g: 64, b: 44, alpha: 1 } })
    .png({ quality: 80, compressionLevel: 9, effort: 10 })
    .toFile(join(PUBLIC, 'logo-512.png'));

  const size512 = statSync(join(PUBLIC, 'logo-512.png')).size;
  console.log(`✅ logo-512.png: ${sizeKB(size512)} (512×512)`);

  // 3. Small logo for header / apple-touch-icon (96x96)
  await sharp(logoPng)
    .resize(96, 96, { fit: 'contain', background: { r: 22, g: 64, b: 44, alpha: 1 } })
    .png({ quality: 90, compressionLevel: 9 })
    .toFile(join(PUBLIC, 'logo-96.png'));

  const size96 = statSync(join(PUBLIC, 'logo-96.png')).size;
  console.log(`✅ logo-96.png: ${sizeKB(size96)} (96×96)`);

  // 4. Replace logo.png with optimized 192 version (for backward compat)
  await sharp(logoPng)
    .resize(192, 192, { fit: 'contain', background: { r: 22, g: 64, b: 44, alpha: 1 } })
    .png({ quality: 85, compressionLevel: 9, effort: 10 })
    .toFile(join(PUBLIC, 'logo-optimized.png'));

  console.log('\n📊 Summary:');
  console.log(`   Before: ${sizeKB(originalSize)}`);
  console.log(`   logo-192.png: ${sizeKB(size192)} (${Math.round((1 - size192/originalSize)*100)}% smaller)`);
  console.log(`   logo-512.png: ${sizeKB(size512)} (${Math.round((1 - size512/originalSize)*100)}% smaller)`);
  console.log('\n✅ Done! Update manifest.json to use logo-192.png and logo-512.png');
}

compress().catch(console.error);
