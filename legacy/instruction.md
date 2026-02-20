# Panduan Langkah-demi-Langkah Migrasi: PHP Native ke Next.js (App Router)

Dokumen ini berisi instruksi teknis terperinci untuk melakukan migrasi sistem GIS monitoring sungai dari arsitektur PHP Native ke framework modern Next.js.

---

## Fase 1: Inisialisasi dan Persiapan Lingkungan

1.  **Inisialisasi Proyek Next.js:**
    Jalankan perintah berikut dan pilih opsi: TypeScript (Yes), ESLint (Yes), Tailwind CSS (Yes), \src/\ directory (Yes), App Router (Yes).
    \\\ash
    npx create-next-app@latest . --typescript --tailwind --eslint
    \\\
    *(Gunakan titik \.\ jika ingin menginisialisasi di folder saat ini atau tentukan nama folder baru)*.

2.  **Setup Environment Variables:**
    Buat file \.env\ di root proyek untuk menyimpan kredensial database agar tidak terekspos seperti pada \config.php\ lama.
    \\\env
    DATABASE_URL="mysql://user:password@localhost:3306/nama_db"
    NEXTAUTH_SECRET="rahasia_sangat_kuat_anda"
    \\\

3.  **Instalasi Library Pendukung:**
    \\\ash
    npm install prisma @prisma/client # Database ORM
    npm install leaflet react-leaflet # Pemetaan
    npm install next-auth @auth/core # Autentikasi
    npm install lucide-react # Icon
    \\\

---

## Fase 2: Migrasi Database (Model & Schema)

1.  **Inisialisasi Prisma:**
    Gantikan koneksi database manual PHP dengan Prisma.
    \\\ash
    npx prisma init
    \\\

2.  **Introspeksi Database:**
    Jika database MySQL sudah ada (dari file \uas_jalan.sql\), tarik skemanya otomatis:
    \\\ash
    npx prisma db pull
    npx prisma generate
    \\\
    *Catatan: Jika tabel belum ada, definisikan model di \prisma/schema.prisma\ lalu jalankan \
px prisma db push\.*

---

## Fase 3: Manajemen Aset Spasial (GeoJSON)

1.  **Pembersihan Data:**
    Pindahkan semua file \.geojson\ dari direktori root lama ke \public/data/\.

2.  **Optimasi File Besar:**
    Untuk file >50MB (seperti \kontur-banjarnegara.geojson\), gunakan tool \mapshaper\ sebelum dipindahkan untuk mengurangi ukuran file tanpa merusak geometri:
    \\\ash
    npx mapshaper kontur.geojson -simplify 10% -o kontur_optimized.geojson
    \\\

---

## Fase 4: Pembuatan API (Route Handlers)

Migrasikan logika dari file PHP API (\ews_api.php\, \ews_levels_api.php\) ke App Router API.

1.  **Buat Endpoint GET/POST:**
    Buat file di \src/app/api/ews/route.ts\. Gunakan Prisma untuk mengambil data dari MySQL dan kembalikan sebagai JSON.

2.  **Implementasi Server Actions:**
    Untuk operasi tulis (seperti update status bencana di \dmin_ews.php\), buat file \src/app/actions/ews-actions.ts\ menggunakan direktif \'use server'\.

---

## Fase 5: Pengembangan Komponen UI & Peta

1.  **Layout Utama:**
    Konfigurasi \src/app/layout.tsx\ untuk menyertakan Navbar dan Sidebar yang sebelumnya ada di setiap file PHP secara redundan.

2.  **Komponen Peta (Client Component):**
    Karena Leaflet membutuhkan akses DOM (\window\), buat komponen di \src/components/Map.tsx\ dengan direktif \'use client'\.

3.  **Halaman Utama (Server Component):**
    Di \src/app/page.tsx\, ambil data awal (GeoJSON & Status EWS) langsung di sisi server, lalu teruskan ke komponen peta.

---

## Fase 6: Autentikasi dan Keamanan

1.  **Konfigurasi Auth.js:**
    Gantikan sistem session PHP manual di \login.php\ dengan NextAuth. Buat rute di \src/app/api/auth/[...nextauth]/route.ts\.

2.  **Middleware Proteksi:**
    Buat file \src/middleware.ts\ di folder \src/\ untuk memproteksi rute \/admin\ agar tidak bisa diakses tanpa session, menggantikan pengecekan manual di atas setiap file PHP.

---

## Fase 7: Optimasi dan Validasi

1.  **Penggantian Tag Aset:**
    Ganti semua tag \<img>\ dengan \<Image />\ dari \
ext/image\ untuk optimasi bandwidth otomatis.

2.  **Dynamic Metadata:**
    Implementasikan fungsi \generateMetadata\ di rute berita (\pp/berita/[id]/page.tsx\) untuk SEO yang lebih baik dibandingkan tag meta statis di HTML lama.

3.  **Build dan Test:**
    Pastikan tidak ada error tipe data dan semua rute berfungsi:
    \\\ash
    npm run build
    npm run start
    \\\

---

## Daftar Periksa (Checklist) Migrasi
- [ ] Database terkoneksi via Prisma (cek \.env\).
- [ ] Semua file GeoJSON besar sudah dioptimasi dan berada di folder \public/\.
- [ ] Endpoint PHP (\.php\) sudah diganti ke Route Handlers (\/api/...\).
- [ ] Login menggunakan session aman (NextAuth).
- [ ] Peta di-load menggunakan \dynamic import\ dengan \ssr: false\.
- [ ] Halaman admin terproteksi oleh Middleware.
