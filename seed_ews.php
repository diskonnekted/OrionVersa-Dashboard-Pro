<?php

error_reporting(E_ALL);
ini_set("display_errors", "1");

require __DIR__ . "/config.php";

try {
    $pdo = get_pdo();
} catch (Throwable $e) {
    echo "<h3>Gagal terhubung ke database dari seed_ews.php</h3>";
    echo "<p>" . htmlspecialchars($e->getMessage(), ENT_QUOTES, "UTF-8") . "</p>";
    exit;
}

try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'ews_stations'");
    if (!$stmt->fetch()) {
        echo "<h3>Tabel ews_stations belum ada. Jalankan install_db.php terlebih dahulu.</h3>";
        exit;
    }

    $check = $pdo->prepare("SELECT id FROM ews_stations WHERE sensor_code = ?");
    $check->execute(["DEMO-ORION-1"]);
    if ($check->fetch()) {
        echo "<p>Data demo EWS sudah ada.</p>";
    } else {
        $insert = $pdo->prepare(
            "INSERT INTO ews_stations (name, location, sensor_code, type, status, latitude, longitude, description)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $insert->execute([
            "DEMO Orion FloodGuard Banjarnegara",
            "Sekitar pusat Banjarnegara",
            "DEMO-ORION-1",
            "flood",
            "aktif",
            -7.45,
            109.68,
            "Contoh titik EWS Orion FloodGuard untuk pengujian tampilan peta."
        ]);
        echo "<p>1 data demo EWS telah ditambahkan.</p>";
    }

    echo "<p>Silakan buka <a href=\"admin_ews.php\">admin_ews.php</a> untuk melihat data, lalu <a href=\"index.html\">index.html</a> dan aktifkan Lokasi EWS + Orion FloodGuard.</p>";
} catch (Throwable $e) {
    echo "<h3>Terjadi kesalahan saat menyiapkan data demo EWS</h3>";
    echo "<p>" . htmlspecialchars($e->getMessage(), ENT_QUOTES, "UTF-8") . "</p>";
}

