import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = process.cwd();
const GEOJSON_FILE = path.join(PROJECT_ROOT, 'public', 'data', 'rambu.geojson');
const IMAGES_DIR = path.join(PROJECT_ROOT, 'public', 'perlengkapan');
const TRASH_DIR = path.join(PROJECT_ROOT, 'public', 'perlengkapan_trash');

// Helper to check if file is an image
function isImageFile(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
}

async function main() {
  console.log('Reading GeoJSON data...');
  
  if (!fs.existsSync(GEOJSON_FILE)) {
    console.error(`GeoJSON file not found at: ${GEOJSON_FILE}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(GEOJSON_FILE, 'utf8');
  const geojson = JSON.parse(rawData);

  if (!geojson.features) {
    console.error('Invalid GeoJSON format');
    process.exit(1);
  }

  // Collect all used photo filenames
  const usedPhotos = new Set();
  geojson.features.forEach(feature => {
    const photo = feature.properties.photo;
    if (photo && photo !== 'NULL') {
      usedPhotos.add(photo);
    }
  });

  console.log(`Found ${usedPhotos.size} unique photos referenced in GeoJSON.`);

  // Scan images directory
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`Images directory not found at: ${IMAGES_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(IMAGES_DIR);
  const imageFiles = files.filter(isImageFile);
  
  console.log(`Found ${imageFiles.length} images in folder.`);

  // Identify unused images
  const unusedImages = [];
  imageFiles.forEach(file => {
    if (!usedPhotos.has(file)) {
      unusedImages.push(file);
    }
  });

  console.log(`Found ${unusedImages.length} unused images.`);

  if (unusedImages.length === 0) {
    console.log('No unused images found. Clean!');
    return;
  }

  // Create trash directory
  if (!fs.existsSync(TRASH_DIR)) {
    fs.mkdirSync(TRASH_DIR, { recursive: true });
  }

  // Move unused images to trash
  let movedCount = 0;
  unusedImages.forEach(file => {
    const srcPath = path.join(IMAGES_DIR, file);
    const destPath = path.join(TRASH_DIR, file);
    
    try {
      fs.renameSync(srcPath, destPath);
      movedCount++;
    } catch (err) {
      console.error(`Failed to move ${file}:`, err.message);
    }
  });

  console.log(`Moved ${movedCount} unused images to: ${TRASH_DIR}`);
  console.log('Please review the trash folder before deleting it permanently.');
}

main().catch(console.error);
