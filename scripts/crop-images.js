import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory containing images to crop
const inputDir = path.join(__dirname, '../public');
const outputDir = path.join(__dirname, '../public/cropped');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Image file extensions to process
const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

// Simple cropping strategy: crop from center, avoiding top area where faces usually are
function getCropDimensions(width, height) {
  // Crop from center, but avoid top 30% where faces usually are
  const cropWidth = Math.floor(width * 0.8); // 80% of width
  const cropHeight = Math.floor(height * 0.7); // 70% of height (avoiding top 30%)
  
  const left = Math.floor((width - cropWidth) / 2);
  const top = Math.floor(height * 0.3); // Start from 30% down to avoid faces
  
  return {
    left,
    top,
    width: cropWidth,
    height: cropHeight
  };
}

async function cropImage(inputPath, outputPath) {
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    if (!metadata.width || !metadata.height) {
      console.log(`Skipping ${path.basename(inputPath)} - invalid dimensions`);
      return;
    }
    
    const crop = getCropDimensions(metadata.width, metadata.height);
    
    await image
      .extract(crop)
      .jpeg({ quality: 90 })
      .toFile(outputPath);
    
    console.log(`✅ Cropped: ${path.basename(inputPath)}`);
  } catch (error) {
    console.error(`❌ Error cropping ${path.basename(inputPath)}:`, error.message);
  }
}

async function processAllImages() {
  console.log('🚀 Starting batch image cropping...');
  
  const files = fs.readdirSync(inputDir);
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return imageExtensions.includes(ext) && !file.includes('cropped');
  });
  
  console.log(`📁 Found ${imageFiles.length} images to process`);
  
  for (const file of imageFiles) {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, `cropped_${file}`);
    
    await cropImage(inputPath, outputPath);
  }
  
  console.log('🎉 Batch cropping completed!');
  console.log(`📂 Cropped images saved to: ${outputDir}`);
}

// Run the script
processAllImages().catch(console.error);
