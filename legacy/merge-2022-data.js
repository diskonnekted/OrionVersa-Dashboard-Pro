const fs = require('fs');
const path = require('path');

// Daftar file GeoJSON 2022
const files = [
    'JANUARI-FEBRUARI 2022.geojson',
    'MARET-APRIL 2022.geojson',
    'MEI-JUNI 2022.geojson',
    'JULI - AGUSTUS 2022.geojson',
    'SEPTEMBER-OKTOBER 2022.geojson',
    'NOVEMBER - DESEMBER 2022.geojson'
];

const sourceDir = 'D:/xampp/htdocs/sungai/2022/LOKASI KEJADIAN BENCANA BANJARNEGARA 2022';
const outputFile = 'D:/xampp/htdocs/sungai/geojson/bencana-banjarnegara-2022.geojson';

let allFeatures = [];

console.log('Menggabungkan data bencana 2022...');

files.forEach(file => {
    const filePath = path.join(sourceDir, file);
    
    if (fs.existsSync(filePath)) {
        console.log('Memproses:', file);
        
        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            if (data && data.features && Array.isArray(data.features)) {
                allFeatures = allFeatures.concat(data.features);
                console.log(`  - Ditambahkan ${data.features.length} features`);
            } else {
                console.log(`  - Format tidak valid: ${file}`);
            }
        } catch (error) {
            console.log(`  - Error membaca ${file}:`, error.message);
        }
    } else {
        console.log(`  - File tidak ditemukan: ${file}`);
    }
});

// Buat FeatureCollection gabungan
const mergedGeoJSON = {
    type: 'FeatureCollection',
    name: 'Bencana Banjarnegara 2022',
    features: allFeatures
};

// Simpan file gabungan
fs.writeFileSync(outputFile, JSON.stringify(mergedGeoJSON, null, 2));

console.log('\n✅ Selesai!');
console.log(`Total features: ${allFeatures.length}`);
console.log(`File disimpan: ${outputFile}`);