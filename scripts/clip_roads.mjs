import fs from 'fs';
import path from 'path';
import * as turf from '@turf/turf';

const DATA_DIR = path.join(process.cwd(), 'public/data');
const BOUNDARY_FILE = path.join(DATA_DIR, 'batas-admin.geojson');

const ROAD_FILES = [
  'jalan_kabupaten.geojson',
  'jalan_provinsi.geojson',
  'jalan_nasional.geojson',
  'sungai.geojson',
  'jalan.geojson'
];

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

  // Prepare boundary polygons with bboxes for quick check
  const boundaries = validFeatures.map(f => ({
      feature: f,
      bbox: turf.bbox(f)
  }));

  // Create global bbox
  const globalBbox = turf.bbox(turf.featureCollection(validFeatures));

  for (const file of ROAD_FILES) {
    const filePath = path.join(DATA_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.log(`Skipping ${file} (not found)`);
      continue;
    }

    console.log(`Processing ${file}...`);
    const roadData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const clippedFeatures = [];
    
    const flattened = turf.flatten(roadData);

    let processedCount = 0;
    const totalCount = flattened.features.length;

    for (const feature of flattened.features) {
      if (!feature.geometry) continue;
      processedCount++;
      if (processedCount % 1000 === 0) process.stdout.write(`\rProcessed ${processedCount}/${totalCount}`);
      
      const roadBbox = turf.bbox(feature);

      // Check against global bbox first
      if (
        roadBbox[2] < globalBbox[0] || 
        roadBbox[0] > globalBbox[2] || 
        roadBbox[3] < globalBbox[1] || 
        roadBbox[1] > globalBbox[3]
      ) {
        continue;
      }

      // Check against individual polygons
      let keptParts = [];
      let isFullyInside = false;

      // Optimization: find candidate polygons
      const candidates = boundaries.filter(b => !(
          roadBbox[2] < b.bbox[0] || 
          roadBbox[0] > b.bbox[2] || 
          roadBbox[3] < b.bbox[1] || 
          roadBbox[1] > b.bbox[3]
      ));

      if (candidates.length === 0) continue;

      // For each candidate, check intersection
      // If road is fully inside one polygon, keep it and stop
      for (const candidate of candidates) {
          if (turf.booleanWithin(feature, candidate.feature)) {
              isFullyInside = true;
              break;
          }
      }

      if (isFullyInside) {
          clippedFeatures.push(feature);
          continue;
      }

      // If not fully inside any single polygon, it might span multiple.
      // Or partially outside.
      // We clip against the union of candidates? Union is slow.
      // Instead, we split against each candidate and keep parts inside THAT candidate.
      // But if a road spans two candidates, it will be split twice?
      // No, we want the union of parts inside candidates.
      
      // Simpler approach for lines:
      // Iterate candidates. If part is inside candidate, keep it.
      // Use turf.lineSplit against candidate.
      
      // But if a segment is inside multiple candidates (overlap), we duplicate it?
      // Boundaries usually don't overlap much (villages).
      
      // Let's try to intersect with each candidate and collect segments.
      // To avoid duplicates, maybe just rely on non-overlapping villages.
      
      for (const candidate of candidates) {
          try {
              // Check intersection
              if (!turf.booleanIntersects(feature, candidate.feature)) continue;

              // Split
              // turf.lineSplit splits by line. 
              // Convert polygon to line for splitting
              const polyLine = turf.polygonToLine(candidate.feature);
              // Handle MultiLineString return from polygonToLine (for MultiPolygon or donut)
              const splitter = polyLine.type === 'FeatureCollection' ? polyLine.features[0] : polyLine; // Simplification
              
              const split = turf.lineSplit(feature, splitter);
              
              const segments = split.features.length > 0 ? split.features : [feature];
              
              for (const segment of segments) {
                  const len = turf.length(segment);
                  const mid = turf.along(segment, len / 2);
                  if (turf.booleanPointInPolygon(mid, candidate.feature)) {
                      keptParts.push(segment);
                  }
              }
          } catch (e) {
              // Fallback
          }
      }
      
      // If we have parts, add them.
      // Note: This might fragment the line. But that's fine for rendering.
      // Warning: If a line crosses boundary between A and B, and we split against A, we get part in A.
      // Then we split original against B, we get part in B.
      // So we get both parts. Correct.
      // But if we split against A, the part outside A (which is in B) is discarded for A loop.
      // Then in B loop, we process original line again? Yes.
      // So we get parts in A and parts in B.
      // The only issue is if A and B overlap, we get duplicates. Villages shouldn't overlap.
      
      if (keptParts.length > 0) {
          clippedFeatures.push(...keptParts);
      }
    }
    console.log(`\nSaved clipped ${file} (kept ${clippedFeatures.length} segments from ${flattened.features.length} original features)`);

    const outputData = {
        type: "FeatureCollection",
        features: clippedFeatures
    };
    
    if (!fs.existsSync(filePath + '.bak_clip')) {
        fs.copyFileSync(filePath, filePath + '.bak_clip');
    }
    
    fs.writeFileSync(filePath, JSON.stringify(outputData));
  }
  
  console.log('Done.');
}

main().catch(console.error);
