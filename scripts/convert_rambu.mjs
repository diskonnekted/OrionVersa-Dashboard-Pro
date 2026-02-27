import fs from 'fs';
import path from 'path';

const SQL_FILE = path.join(process.cwd(), 'public/data/rambu.sql');
const OUTPUT_FILE = path.join(process.cwd(), 'public/data/rambu.geojson');

async function main() {
  console.log('Reading SQL file...');
  const sqlContent = fs.readFileSync(SQL_FILE, 'utf8');

  // Regex to match INSERT INTO `perlengkapan_jalan` values
  // Structure: (id, id_jenis, nama, ..., coordinate_lat, coordinate_lng, ..., gambar, foto, ...)
  // We need coordinate_lat (index 7) and coordinate_lng (index 8) - 0-indexed in values list?
  // Let's look at the INSERT statement structure:
  // INSERT INTO `perlengkapan_jalan` (`id`, `id_jenis`, `nama`, `id_ruasjalan`, `status`, `kondisi`, `lokasi`, `coordinate_lat`, `coordinate_lng`, `posisi`, `keterangan`, `gambar`, `foto`, `id_gambar`, `tgl_insert`, `tipe_jalan`, `th_anggaran`, `sdana`, `lat_akhir`, `lng_akhir`) VALUES
  // (37, 3, 'ALAT PENERANGAN JALAN', 621, 'T', 'Baik', '522042301796', -7.36782520, 109.6264888, 'kiri', 'Pintu Masuk Utara, Pasar Wanadadi', '1611448594_c5447b5801eebe672ce2.jpg', '1611448594_fb255dc458f96bd42dca.jpg', NULL, '2021-01-24', NULL, NULL, NULL, 0.00000000, 0.0000000)
  
  // Indices:
  // 0: id
  // 1: id_jenis
  // 2: nama
  // 3: id_ruasjalan
  // 4: status
  // 5: kondisi
  // 6: lokasi
  // 7: coordinate_lat
  // 8: coordinate_lng
  // 9: posisi
  // 10: keterangan
  // 11: gambar
  // 12: foto
  
  const features = [];
  const regex = /\(([^)]+)\)/g;
  let match;

  // Find the INSERT INTO `perlengkapan_jalan` block
  const tableStart = sqlContent.indexOf('INSERT INTO `perlengkapan_jalan`');
  if (tableStart === -1) {
    console.error('Could not find perlengkapan_jalan table data');
    return;
  }
  
  const tableContent = sqlContent.slice(tableStart);
  // Simple parsing of values
  // Note: This is a basic parser and might fail with complex SQL strings containing ) or ,
  
  const lines = tableContent.split('\n');
  for (const line of lines) {
    if (!line.trim().startsWith('(')) continue;
    
    // Clean line: remove leading ( and trailing ), or );
    let cleanLine = line.trim();
    if (cleanLine.endsWith(';')) cleanLine = cleanLine.slice(0, -1);
    if (cleanLine.endsWith(',')) cleanLine = cleanLine.slice(0, -1);
    if (cleanLine.startsWith('(')) cleanLine = cleanLine.slice(1);
    if (cleanLine.endsWith(')')) cleanLine = cleanLine.slice(0, -1);

    // Split by comma, respecting quotes is hard with simple split. 
    // But looking at data, it seems simple enough. 
    // Let's use a regex to match values
    // Values can be: 'string', number, NULL
    
    // Alternative: use a more robust splitting mechanism
    const values = [];
    let currentVal = '';
    let inQuote = false;
    
    for (let i = 0; i < cleanLine.length; i++) {
      const char = cleanLine[i];
      if (char === "'" && cleanLine[i-1] !== '\\') {
        inQuote = !inQuote;
        currentVal += char;
      } else if (char === ',' && !inQuote) {
        values.push(currentVal.trim());
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal.trim());

    if (values.length < 10) continue;

    try {
      const id = values[0];
      const name = values[2].replace(/^'|'$/g, '');
      const condition = values[5].replace(/^'|'$/g, '');
      const lat = parseFloat(values[7]);
      const lng = parseFloat(values[8]);
      const desc = values[10] ? values[10].replace(/^'|'$/g, '') : '';
      const photo = values[12] ? values[12].replace(/^'|'$/g, '') : '';

      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        features.push({
          type: "Feature",
          properties: {
            id,
            name,
            condition,
            description: desc,
            photo: photo !== 'NULL' ? photo : null
          },
          geometry: {
            type: "Point",
            coordinates: [lng, lat]
          }
        });
      }
    } catch (e) {
      // Ignore parsing errors for individual lines
    }
  }

  const geojson = {
    type: "FeatureCollection",
    features: features
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(geojson));
  console.log(`Converted ${features.length} rambu items to GeoJSON.`);
}

main().catch(console.error);
