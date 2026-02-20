<?php

error_reporting(E_ALL);
ini_set("display_errors", "1");

require __DIR__ . "/config.php";

try {
    $pdo = get_pdo();
} catch (Throwable $e) {
    echo "<h3>Gagal terhubung ke database</h3>";
    echo "<p>Pesan: " . htmlspecialchars($e->getMessage(), ENT_QUOTES, "UTF-8") . "</p>";
    echo "<p>Pastikan nilai \$DB_HOST, \$DB_NAME, \$DB_USER, dan \$DB_PASS di config.php sudah sesuai dengan data MySQL di server.</p>";
    exit;
}

$dbName = isset($DB_NAME) ? $DB_NAME : "";

try {

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS ews_stations (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            location VARCHAR(150) DEFAULT NULL,
            sensor_code VARCHAR(100) DEFAULT NULL,
            type VARCHAR(20) DEFAULT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'aktif',
            latitude DOUBLE NOT NULL,
            longitude DOUBLE NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS ews_levels (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            station_id INT UNSIGNED NOT NULL,
            measured_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            water_level_cm INT NOT NULL,
            status VARCHAR(20) NOT NULL,
            note VARCHAR(255) DEFAULT NULL,
            INDEX idx_station_time (station_id, measured_at),
            CONSTRAINT fk_ews_levels_station FOREIGN KEY (station_id)
                REFERENCES ews_stations(id)
                ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    echo "<h3>Instalasi database EWS selesai</h3>";
    echo "<ul>";
    echo "<li>Database: <strong>" . htmlspecialchars((string) $dbName, ENT_QUOTES, "UTF-8") . "</strong></li>";
    echo "<li>Tabel: <strong>ews_stations</strong> dibuat / sudah ada</li>";
    echo "<li>Tabel: <strong>ews_levels</strong> dibuat / sudah ada</li>";
    echo "</ul>";
    echo "<p>Anda sekarang bisa membuka <a href=\"admin_ews.php\">admin_ews.php</a> dan <a href=\"index.html\">index.html</a>.</p>";
} catch (Throwable $e) {
    echo "<h3>Terjadi kesalahan saat membuat database / tabel</h3>";
    echo "<p>Pesan: " . htmlspecialchars($e->getMessage(), ENT_QUOTES, "UTF-8") . "</p>";
}
