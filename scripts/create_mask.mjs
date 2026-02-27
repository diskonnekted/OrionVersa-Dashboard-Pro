import fs from 'fs';
import path from 'path';
import * as turf from '@turf/turf';

const DATA_DIR = path.join(process.cwd(), 'public/data');
const BOUNDARY_FILE = path.join(DATA_DIR, 'batas-admin.geojson');
const OUTPUT_FILE = path.join(DATA_DIR, 'masking-banjarnegara.geojson');

async function main() {
  console.log('Loading boundary...');
  const boundaryData = JSON.parse(fs.readFileSync(BOUNDARY_FILE, 'utf8'));
  
  // Filter only Polygons and MultiPolygons
  const validFeatures = boundaryData.features.filter(f => 
    f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')
  );

  if (validFeatures.length === 0) {
    console.error('No valid polygon features found in boundary file');
    return;
  }

  console.log(`Found ${validFeatures.length} valid boundary features.`);

  // Combine into a single MultiPolygon
  console.log('Combining features...');
  const combined = turf.combine(turf.featureCollection(validFeatures));
  const multiPolygon = combined.features[0];
  
  // Create a large world polygon (mask)
  // Coordinates for a box covering the whole world (or large enough area around Banjarnegara)
  // Let's use a box slightly larger than Java island to be safe and efficient
  // Or just a very large box: [-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]
  // But for better rendering, let's use a box around Central Java: [108, -8.5] to [112, -6.5]
  // Actually, let's use the bbox of the boundary + buffer
  const bbox = turf.bbox(multiPolygon);
  const maskPoly = turf.bboxPolygon([
      bbox[0] - 1.0, // buffer 1 degree (~111km)
      bbox[1] - 1.0, 
      bbox[2] + 1.0, 
      bbox[3] + 1.0
  ]);

  console.log('Creating difference (mask)...');
  
  // We want: World - Banjarnegara
  // turf.difference(poly1, poly2) = poly1 - poly2
  
  try {
      // Need to handle MultiPolygon for difference?
      // turf.difference takes Feature<Polygon|MultiPolygon>
      
      const mask = turf.difference(turf.featureCollection([maskPoly, multiPolygon]));
      
      if (!mask) {
          throw new Error('Difference operation returned null');
      }

      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(mask));
      console.log(`Saved masking layer to ${OUTPUT_FILE}`);
      
  } catch (e) {
      console.error('Error creating mask:', e);
  }
}

main().catch(console.error);
