const fs = require('fs');
const path = require('path');

// Read the KML file
const kmlContent = fs.readFileSync(path.join(__dirname, 'banjarnegara_bencana.kml'), 'utf8');

// Simple KML parser for Placemark data
function parseKML(kmlContent) {
  const features = [];
  
  // Extract all Placemark sections
  const placemarkRegex = /<Placemark>([\s\S]*?)<\/Placemark>/g;
  let match;
  
  while ((match = placemarkRegex.exec(kmlContent)) !== null) {
    const placemarkContent = match[1];
    
    // Extract name
    const nameMatch = placemarkContent.match(/<name>([\s\S]*?)<\/name>/);
    const name = nameMatch ? nameMatch[1].trim() : 'Unknown';
    
    // Extract description
    const descMatch = placemarkContent.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/);
    const description = descMatch ? descMatch[1].trim() : '';
    
    // Extract coordinates
    const coordMatch = placemarkContent.match(/<coordinates>([\s\S]*?)<\/coordinates>/);
    let coordinates = null;
    
    if (coordMatch) {
      const coords = coordMatch[1].trim().split(',');
      if (coords.length >= 2) {
        coordinates = [parseFloat(coords[0]), parseFloat(coords[1])];
      }
    } else {
      // Try to extract from KOORDINAT in description
      const koordinatMatch = description.match(/KOORDINAT:\s*([-\d\.]+),\s*([-\d\.]+)/);
      if (koordinatMatch) {
        coordinates = [parseFloat(koordinatMatch[2]), parseFloat(koordinatMatch[1])];
      }
    }
    
    // Extract ExtendedData
    const extendedData = {};
    const dataRegex = /<Data name="([^"]+)">[\s\S]*?<value>([\s\S]*?)<\/value>/g;
    let dataMatch;
    
    while ((dataMatch = dataRegex.exec(placemarkContent)) !== null) {
      extendedData[dataMatch[1]] = dataMatch[2].trim();
    }
    
    if (coordinates) {
      features.push({
        type: 'Feature',
        properties: {
          name,
          description,
          ...extendedData
        },
        geometry: {
          type: 'Point',
          coordinates: coordinates
        }
      });
    }
  }
  
  return features;
}

// Parse the KML
const features = parseKML(kmlContent);

// Create GeoJSON structure
const geoJSON = {
  type: 'FeatureCollection',
  name: 'LOKASI_KEJADIAN_BENCANA_BANJARNEGARA_2024',
  crs: { 
    type: 'name', 
    properties: { 
      name: 'urn:ogc:def:crs:OGC:1.3:CRS84' 
    } 
  },
  features: features
};

// Write to GeoJSON file
fs.writeFileSync(
  path.join(__dirname, 'geojson', 'bencana-banjarnegara.geojson'),
  JSON.stringify(geoJSON, null, 2)
);

console.log(`Successfully converted ${features.length} features to GeoJSON`);
console.log('File saved to: geojson/bencana-banjarnegara.geojson');