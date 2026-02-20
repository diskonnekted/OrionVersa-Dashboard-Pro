const fs = require('fs');

// Baca file GeoJSON 2022
const inputFile = 'D:/xampp/htdocs/sungai/geojson/bencana-banjarnegara-2022.geojson';
const outputFile = 'D:/xampp/htdocs/sungai/geojson/bencana-banjarnegara-2022-standardized.geojson';

console.log('Membaca file GeoJSON 2022...');
const geoJSONData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

console.log('Memproses', geoJSONData.features.length, 'features...');

// Standarisasi format properti untuk setiap feature
geoJSONData.features.forEach(feature => {
  const props = feature.properties;
  
  // Pastikan properti JENIS KEJADIAN (dengan spasi) ada
  if (props['JENIS_KEJADIAN'] && !props['JENIS KEJADIAN']) {
    props['JENIS KEJADIAN'] = props['JENIS_KEJADIAN'];
  }
  
  // Hapus properti JENIS_KEJADIAN (dengan underscore) untuk konsistensi
  delete props['JENIS_KEJADIAN'];
  
  // Pastikan properti No konsisten
  if (props.No === null || props.No === undefined || props.No === '') {
    props.No = '-';
  }
});

console.log('Menyimpan file yang sudah distandardisasi...');
fs.writeFileSync(outputFile, JSON.stringify(geoJSONData, null, 2));

console.log('Standardisasi selesai! File tersimpan di:', outputFile);
console.log('Total features yang diproses:', geoJSONData.features.length);