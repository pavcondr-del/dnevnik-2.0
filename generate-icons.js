/**
 * Скрипт для генерации PNG иконок из SVG с помощью sharp
 * 
 * Установка: npm install --save-dev sharp
 * Запуск: node generate-icons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, 'public', 'icons');

async function generateIcons() {
  console.log('🎨 Генерация PNG иконок из SVG...\n');

  // 1. Icon 192x192
  const svg192 = fs.readFileSync(path.join(iconsDir, 'icon-192.svg'), 'utf8');
  await sharp(Buffer.from(svg192))
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, 'icon-192.png'));
  console.log('✅ icon-192.png (192x192)');

  // 2. Icon 512x512
  const svg512 = fs.readFileSync(path.join(iconsDir, 'icon-512.svg'), 'utf8');
  await sharp(Buffer.from(svg512))
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'icon-512.png'));
  console.log('✅ icon-512.png (512x512)');

  // 3. Maskable icon 512x512 (с padding — иконка ~70%)
  const maskableBuffer = await sharp(Buffer.from(svg512))
    .resize(360, 360)
    .png()
    .toBuffer();
  
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 18, g: 18, b: 18, alpha: 1 }
    }
  })
    .composite([{ input: maskableBuffer, gravity: 'center' }])
    .png()
    .toFile(path.join(iconsDir, 'icon-maskable.png'));
  console.log('✅ icon-maskable.png (512x512, maskable with padding)');

  // 4. Apple touch icon 180x180
  await sharp(Buffer.from(svg512))
    .resize(180, 180)
    .png()
    .toFile(path.join(iconsDir, 'apple-touch.png'));
  console.log('✅ apple-touch.png (180x180)');

  console.log('\n✨ Все иконки успешно сгенерированы!');
}

generateIcons().catch(err => {
  console.error('❌ Ошибка генерации иконок:', err);
  process.exit(1);
});
