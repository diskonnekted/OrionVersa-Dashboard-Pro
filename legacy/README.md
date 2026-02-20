# 🌊 Orion EWS Dashboard

Sistem monitoring dan early warning system (EWS) untuk banjir berbasis web dengan integrasi data sensor, peta geospasial, dan prediksi BMKG.

## ✨ Fitur Utama

- 📊 **Monitoring Real-time** - Data sensor banjir secara live
- 🗺️ **Visualisasi Peta** - Integrasi peta geospasial OpenStreetMap
- ⚠️ **Sistem Peringatan Dini** - Alert system berdasarkan level ketinggian air
- 📱 **Responsive Design** - Aksesibilitas dari desktop dan mobile
- 🔐 **Admin Dashboard** - Manajemen data sensor dan pengaturan
- 📈 **Data Historis** - Grafik dan analisis trend ketinggian air

## 🛠️ Teknologi

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla JS)
- **Backend**: PHP 7.4+
- **Database**: MySQL
- **Mapping**: Leaflet.js dengan OpenStreetMap
- **Charts**: Chart.js untuk visualisasi data
- **Icons**: Flat design icons

## 📋 Prerequisites

- Web server (Apache/Nginx)
- PHP 7.4 atau lebih baru
- MySQL 5.7+
- Composer (optional)

## 🚀 Instalasi

### 1. Clone Repository
```bash
git clone https://github.com/diskonnekted/Orion-Dasboard-EWS-Master.git
cd Orion-Dasboard-EWS-Master
```

### 2. Setup Database
- Import file SQL yang tersedia
- Konfigurasi koneksi database di `config.php`

### 3. Konfigurasi
Edit file `config.php` dengan detail database Anda:
```php
$DB_HOST = "localhost";
$DB_NAME = "orion_ews";
$DB_USER = "username";
$DB_PASS = "password";
```

### 4. Deploy
Upload semua file ke web server Anda

## 📁 Struktur Project

```
Orion-Dasboard-EWS-Master/
├── index.html          # Halaman utama dashboard
├── admin_ews.php       # Panel admin
├── monitor_ews.php     # Monitoring detail
├── login.php           # Authentication
├── config.php          # Konfigurasi database
├── ews_api.php         # API untuk data sensor
├── ews_levels_api.php  # API level peringatan
├── install_db.php      # Setup database
├── seed_ews.php        # Data sample
├── geojson/            # File geospasial
│   ├── kontur-banjarnegara.geojson
│   ├── peta_desa.geojson
│   ├── sungai.geojson
│   └── ...
├── img/                # Assets gambar
└── README.md
```

## 🔧 Konfigurasi Sensor

### Data Sensor Format
```json
{
  "sensor_id": "ORION-001",
  "water_level": 120.5,
  "temperature": 28.3,
  "humidity": 85,
  "timestamp": "2024-01-15 14:30:00"
}
```

### Level Peringatan
- 🟢 **Normal**: < 100 cm
- 🟡 **Waspada**: 100-150 cm  
- 🟠 **Siaga**: 150-200 cm
- 🔴 **Awas**: > 200 cm

## 🌐 API Endpoints

### GET Data Sensor
```
GET /ews_api.php?sensor_id=ORION-001
```

### GET Data Historis
```
GET /ews_api.php?history=1&days=7
```

### POST Data Sensor
```
POST /ews_api.php
Content-Type: application/json

{
  "sensor_id": "ORION-001",
  "water_level": 125.0
}
```

## 📊 Fitur Dashboard

### Halaman Utama
- Peta interaktif dengan overlay kontur
- Marker lokasi sensor
- Status real-time setiap sensor
- Grafik ketinggian air 24 jam terakhir

### Admin Panel
- Manajemen sensor
- Konfigurasi threshold peringatan
- View data historis
- Export data

## 🎨 Customization

### Warna Theme
Edit CSS variables di `index.html`:
```css
:root {
  --primary-color: #2563eb;
  --warning-color: #f59e0b;
  --danger-color: #dc2626;
  --success-color: #16a34a;
}
```

### Map Style
Ubah tile layer di `index.html`:
```javascript
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);
```

## 🚨 Troubleshooting

### Error Database Connection
- Pastikan MySQL service running
- Check credentials di `config.php`

### File GeoJSON tidak load
- Pastikan path relatif correct
- Check permission folder `geojson/`

### Peta tidak muncul
- Check koneksi internet untuk tile OpenStreetMap
- Pastikan Leaflet.js terload

## 📝 License

Project ini dikembangkan untuk sistem monitoring banjir. Silakan digunakan dengan bijak.

## 🤝 Kontribusi

Untuk kontribusi atau pertanyaan, silakan buka issue di GitHub repository.

## 📞 Support

Untuk bantuan teknis, hubungi tim development.

---

**⚠️ Disclaimer**: Sistem ini merupakan alat bantu monitoring. Selalu gunakan sumber informasi resmi untuk keputusan penting.
