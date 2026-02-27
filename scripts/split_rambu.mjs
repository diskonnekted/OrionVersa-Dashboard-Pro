import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'public/data');
const INPUT_FILE = path.join(DATA_DIR, 'rambu.geojson');
const OUTPUT_RAMBU = path.join(DATA_DIR, 'rambu_only.geojson');
const OUTPUT_PJU = path.join(DATA_DIR, 'pju.geojson');

async function main() {
  console.log('Reading Rambus GeoJSON...');
  const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
  const data = JSON.parse(rawData);

  if (!data.features) {
    console.error('Invalid GeoJSON');
    return;
  }

  const rambuFeatures = [];
  const pjuFeatures = [];

  // Keywords for PJU (Street Lights)
  const PJU_KEYWORDS = ['lampu', 'pju', 'penerangan'];

  for (const feature of data.features) {
    const name = (feature.properties.name || '').toLowerCase();
    
    // Check if name contains any PJU keyword
    const isPJU = PJU_KEYWORDS.some(kw => name.includes(kw));

    if (isPJU) {
      pjuFeatures.push(feature);
    } else {
      rambuFeatures.push(feature);
    }
  }

  // Save Rambu Only
  fs.writeFileSync(OUTPUT_RAMBU, JSON.stringify({
    type: "FeatureCollection",
    features: rambuFeatures
  }));
  console.log(`Saved ${rambuFeatures.length} items to ${OUTPUT_RAMBU}`);

  // Save PJU Only
  fs.writeFileSync(OUTPUT_PJU, JSON.stringify({
    type: "FeatureCollection",
    features: pjuFeatures
  }));
  console.log(`Saved ${pjuFeatures.length} items to ${OUTPUT_PJU}`);
}

main().catch(console.error);
