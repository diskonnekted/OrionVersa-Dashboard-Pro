// Global variables
let allNewsData = [];
let filteredNewsData = [];
let newsStats = {
    total: 0,
    longsor: 0,
    banjir: 0,
    kebakaran: 0,
    angin: 0,
    pohon: 0,
    orang: 0
};

// File GeoJSON yang akan dimuat
const geojsonFiles = [
    'geojson/bencana-banjarnegara-2024.geojson',
    'geojson/bencana-banjarnegara-2023.geojson', 
    'geojson/bencana-banjarnegara-2022.geojson',
    'geojson/bencana-banjarnegara-2021.geojson'
];

// Fungsi untuk memuat semua data GeoJSON
async function loadAllGeoJSONData() {
    const newsList = document.getElementById('newsList');
    newsList.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i><p>Memuat data berita...</p></div>';
    
    try {
        allNewsData = [];
        
        for (const file of geojsonFiles) {
            try {
                const response = await fetch(file);
                if (response.ok) {
                    const data = await response.json();
                    if (data.features && data.features.length > 0) {
                        const processedData = processGeoJSONData(data, file);
                        allNewsData = allNewsData.concat(processedData);
                    }
                } else {
                    console.warn(`File ${file} tidak ditemukan atau kosong`);
                }
            } catch (error) {
                console.warn(`Error loading ${file}:`, error);
            }
        }
        
        // Hitung statistik
        calculateStats();
        
        // Tampilkan data
        filteredNewsData = [...allNewsData];
        displayNews();
        
    } catch (error) {
        console.error('Error loading GeoJSON data:', error);
        newsList.innerHTML = '<div class="alert alert-danger">Gagal memuat data berita. Silakan refresh halaman.</div>';
    }
}

// Fungsi untuk memproses data GeoJSON menjadi format berita
function processGeoJSONData(geojson, filename) {
    const year = filename.match(/\d{4}/)?.[0] || 'Unknown';
    const newsItems = [];
    
    geojson.features.forEach((feature, index) => {
        const props = feature.properties;
        
        // Ambil data utama
        const title = props.Name || props['JUDUL BERITA'] || `Bencana ${props['JENIS KEJADIAN'] || 'Tidak Diketahui'}`;
        const disasterType = props['JENIS KEJADIAN'] || props['Jenis Kejadian'] || 'Lainnya';
        const date = props.WAKTU_KEJADIAN || props['TANGGAL KEJADIAN'] || 'Tanggal tidak tersedia';
        const location = props['LOKASI_KEJADIAN_Desa__Kecamatan'] || props['LOKASI KEJADIAN (Desa, Kecamatan)'] || 'Lokasi tidak tersedia';
        const coordinates = props.KOORDINAT || props['KOORDINAT'] || '';
        
        // Ambil konten berita
        let content = '';
        if (props.KRONOLOGI_KONDISI_UMUM) {
            content = props.KRONOLOGI_KONDISI_UMUM.replace(/<br>/g, '\n').replace(/<[^>]*>/g, '');
        } else if (props.description) {
            content = props.description.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
        } else {
            content = 'Kronologi kejadian tidak tersedia';
        }
        
        // Batasi konten untuk preview
        const previewContent = content.length > 200 ? content.substring(0, 200) + '...' : content;
        
        // Ambil dampak
        const buildingImpact = props.DAMPAK_Bangunan || props['DAMPAK Bangunan'] || 'Tidak ada dampak bangunan';
        const casualtyImpact = props.DAMPAK_Jiwa_Luka || props['DAMPAK Jiwa/ Luka'] || props.Luka || 'Tidak ada korban jiwa';
        const evacuationImpact = props.DAMPAK_Pengungsian || props['DAMPAK Pengungsian'] || 'Tidak ada pengungsian';
        
        // Ambil gambar
        let images = [];
        if (props.gx_media_links) {
            images = props.gx_media_links.split(' ').filter(link => link.trim());
        } else if (props.description && props.description.includes('src="')) {
            const imgMatches = props.description.match(/src="([^"]+)"/g);
            if (imgMatches) {
                images = imgMatches.map(match => match.replace('src="', '').replace('"', ''));
            }
        }
        
        // Buat objek berita
        const newsItem = {
            id: `${year}-${index}`,
            title: title,
            disasterType: disasterType,
            date: date,
            location: location,
            coordinates: coordinates,
            content: content,
            previewContent: previewContent,
            buildingImpact: buildingImpact,
            casualtyImpact: casualtyImpact,
            evacuationImpact: evacuationImpact,
            images: images,
            year: year,
            rawProperties: props // Simpan data asli untuk detail
        };
        
        newsItems.push(newsItem);
    });
    
    return newsItems;
}

// Fungsi untuk menghitung statistik
function calculateStats() {
    newsStats = {
        total: allNewsData.length,
        longsor: 0,
        banjir: 0,
        kebakaran: 0,
        angin: 0,
        pohon: 0,
        orang: 0
    };
    
    allNewsData.forEach(item => {
        const type = item.disasterType.toLowerCase();
        if (type.includes('longsor')) newsStats.longsor++;
        else if (type.includes('banjir')) newsStats.banjir++;
        else if (type.includes('kebakaran')) newsStats.kebakaran++;
        else if (type.includes('angin')) newsStats.angin++;
        else if (type.includes('pohon')) newsStats.pohon++;
        else if (type.includes('orang')) newsStats.orang++;
    });
    
    // Update tampilan statistik
    document.getElementById('totalNews').textContent = newsStats.total;
    document.getElementById('totalLongsor').textContent = newsStats.longsor;
    document.getElementById('totalBanjir').textContent = newsStats.banjir;
    document.getElementById('totalKebakaran').textContent = newsStats.kebakaran;
}

// Fungsi untuk menampilkan berita
function displayNews() {
    const newsList = document.getElementById('newsList');
    
    if (filteredNewsData.length === 0) {
        newsList.innerHTML = '<div class="alert alert-info">Tidak ada berita yang sesuai dengan filter yang dipilih.</div>';
        return;
    }
    
    let html = '';
    filteredNewsData.forEach(item => {
        // Tentukan kelas warna berdasarkan jenis bencana
        const disasterClass = getDisasterClass(item.disasterType);
        
        // Buat HTML untuk berita
        html += `
            <div class="news-item">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h5 class="news-title">${item.title}</h5>
                    <span class="disaster-type ${disasterClass}">${item.disasterType}</span>
                </div>
                
                <div class="news-meta">
                    <i class="fas fa-calendar me-1"></i>${item.date}
                    <i class="fas fa-map-marker-alt ms-3 me-1"></i>${item.location}
                    <i class="fas fa-tag ms-3 me-1"></i>${item.year}
                </div>
                
                <div class="news-content">
                    ${item.previewContent}
                </div>
                
                <div class="mb-3">
                    <span class="impact-badge impact-rumah">
                        <i class="fas fa-home me-1"></i>${item.buildingImpact}
                    </span>
                    <span class="impact-badge impact-jiwa">
                        <i class="fas fa-user me-1"></i>${item.casualtyImpact}
                    </span>
                    <span class="impact-badge impact-pengungsian">
                        <i class="fas fa-users me-1"></i>${item.evacuationImpact}
                    </span>
                </div>
                
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        ${item.images.length > 0 ? '<i class="fas fa-image text-success me-1"></i><small class="text-muted">' + item.images.length + ' gambar</small>' : '<i class="fas fa-image text-muted me-1"></i><small class="text-muted">Tidak ada gambar</small>'}
                    </div>
                    <button class="btn btn-sm btn-primary" onclick="showNewsDetail('${item.id}')">
                        <i class="fas fa-eye me-1"></i>Lihat Detail
                    </button>
                </div>
            </div>
        `;
    });
    
    newsList.innerHTML = html;
}

// Fungsi untuk mendapatkan kelas warna berdasarkan jenis bencana
function getDisasterClass(disasterType) {
    const type = disasterType.toLowerCase();
    if (type.includes('longsor')) return 'longsor';
    if (type.includes('banjir')) return 'banjir';
    if (type.includes('kebakaran')) return 'kebakaran';
    if (type.includes('angin')) return 'angin';
    if (type.includes('pohon')) return 'angin';
    return 'default';
}

// Fungsi untuk menampilkan detail berita
function showNewsDetail(newsId) {
    const newsItem = filteredNewsData.find(item => item.id === newsId);
    if (!newsItem) return;
    
    const modal = new bootstrap.Modal(document.getElementById('newsDetailModal'));
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = newsItem.title;
    
    let imagesHtml = '';
    if (newsItem.images.length > 0) {
        imagesHtml = `
            <div class="mb-3">
                <img src="${newsItem.images[0]}" class="image-preview" alt="Gambar kejadian" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="no-image" style="display:none;">
                    <i class="fas fa-image fa-3x"></i>
                    <p class="mt-2">Gambar tidak tersedia</p>
                </div>
            </div>
        `;
    } else {
        imagesHtml = `
            <div class="no-image mb-3">
                <i class="fas fa-image fa-3x"></i>
                <p class="mt-2">Tidak ada gambar</p>
            </div>
        `;
    }
    
    modalBody.innerHTML = `
        ${imagesHtml}
        
        <div class="row mb-3">
            <div class="col-md-6">
                <strong><i class="fas fa-exclamation-triangle me-2"></i>Jenis Bencana:</strong>
                <p>${newsItem.disasterType}</p>
            </div>
            <div class="col-md-6">
                <strong><i class="fas fa-calendar me-2"></i>Tanggal:</strong>
                <p>${newsItem.date}</p>
            </div>
        </div>
        
        <div class="row mb-3">
            <div class="col-md-6">
                <strong><i class="fas fa-map-marker-alt me-2"></i>Lokasi:</strong>
                <p>${newsItem.location}</p>
            </div>
            <div class="col-md-6">
                <strong><i class="fas fa-tag me-2"></i>Tahun:</strong>
                <p>${newsItem.year}</p>
            </div>
        </div>
        
        ${newsItem.coordinates ? `
        <div class="mb-3">
            <strong><i class="fas fa-crosshairs me-2"></i>Koordinat:</strong>
            <p>${newsItem.coordinates}</p>
        </div>
        ` : ''}
        
        <div class="mb-3">
            <strong><i class="fas fa-file-alt me-2"></i>Kronologi / Isi Berita:</strong>
            <p style="white-space: pre-line;">${newsItem.content}</p>
        </div>
        
        <div class="row mb-3">
            <div class="col-md-4">
                <strong><i class="fas fa-home me-2"></i>Dampak Bangunan:</strong>
                <p>${newsItem.buildingImpact}</p>
            </div>
            <div class="col-md-4">
                <strong><i class="fas fa-user me-2"></i>Dampak Jiwa:</strong>
                <p>${newsItem.casualtyImpact}</p>
            </div>
            <div class="col-md-4">
                <strong><i class="fas fa-users me-2"></i>Dampak Pengungsian:</strong>
                <p>${newsItem.evacuationImpact}</p>
            </div>
        </div>
    `;
    
    modal.show();
}

// Fungsi untuk filter berita
function filterNews() {
    const filterYear = document.getElementById('filterYear').value;
    const filterType = document.getElementById('filterType').value;
    
    filteredNewsData = allNewsData.filter(item => {
        let match = true;
        
        if (filterYear) {
            match = match && item.year === filterYear;
        }
        
        if (filterType) {
            match = match && item.disasterType === filterType;
        }
        
        return match;
    });
    
    displayNews();
}

// Fungsi untuk menangani form tambah berita
document.getElementById('newsForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const newsData = {
        title: document.getElementById('newsTitle').value,
        disasterType: document.getElementById('disasterType').value,
        date: formatDate(document.getElementById('incidentDate').value),
        location: document.getElementById('location').value,
        coordinates: document.getElementById('coordinates').value,
        content: document.getElementById('newsContent').value,
        buildingImpact: document.getElementById('buildingImpact').value || 'Tidak ada dampak bangunan',
        casualtyImpact: document.getElementById('casualtyImpact').value || 'Tidak ada korban jiwa',
        evacuationImpact: document.getElementById('evacuationImpact').value || 'Tidak ada pengungsian',
        imageUrl: document.getElementById('imageUrl').value,
        year: new Date().getFullYear().toString()
    };
    
    // Handle file upload if any
    const imageFile = document.getElementById('imageFile').files[0];
    if (imageFile) {
        // For demo purposes, we'll just show an alert
        // In real implementation, you would upload the file to a server
        alert('Upload gambar akan diproses di server. Untuk demo, gunakan URL gambar.');
    }
    
    // Add the new news to the data
    const newNewsItem = {
        id: `manual-${Date.now()}`,
        title: newsData.title,
        disasterType: newsData.disasterType,
        date: newsData.date,
        location: newsData.location,
        coordinates: newsData.coordinates,
        content: newsData.content,
        previewContent: newsData.content.length > 200 ? newsData.content.substring(0, 200) + '...' : newsData.content,
        buildingImpact: newsData.buildingImpact,
        casualtyImpact: newsData.casualtyImpact,
        evacuationImpact: newsData.evacuationImpact,
        images: newsData.imageUrl ? [newsData.imageUrl] : [],
        year: newsData.year,
        rawProperties: newsData
    };
    
    allNewsData.unshift(newNewsItem); // Add to the beginning
    
    // Reset form
    this.reset();
    
    // Update display
    calculateStats();
    filterNews();
    
    // Show success message
    alert('Berita berhasil ditambahkan!');
});

// Helper function to format date
function formatDate(dateString) {
    if (!dateString) return 'Tanggal tidak tersedia';
    const date = new Date(dateString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

// Event listeners for filters
document.getElementById('filterYear').addEventListener('change', filterNews);
document.getElementById('filterType').addEventListener('change', filterNews);

// Load data when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadAllGeoJSONData();
    
    // Set current date as default for incident date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('incidentDate').value = today;
});